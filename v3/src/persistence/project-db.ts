import type { Project } from '../model/project';
import { parseProject } from '../model/schema';

const DATABASE_NAME = 'flash-nick-v3';
const DATABASE_VERSION = 1;
const PROJECT_STORE = 'projects';
const ASSET_STORE = 'assets';
const CURRENT_PROJECT_KEY = 'current';
const ASSET_URL_PREFIX = 'idb-asset:';

let persistenceEpoch = 0;

type StoredProjectRecord = {
  key: typeof CURRENT_PROJECT_KEY;
  project: Project;
  savedAt: number;
};

type StoredAssetRecord = {
  elementId: string;
  sourceUrl: string;
  blob: Blob;
};

export type SaveCurrentProjectOptions = {
  resolveAsset?: (assetUrl: string) => Promise<Blob>;
};

export type LoadCurrentProjectOptions = {
  createObjectUrl?: (blob: Blob) => string;
  revokeObjectUrl?: (url: string) => void;
};

export type LoadedProject = {
  project: Project;
  dispose: () => void;
};

function requestAsPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB işlemi başarısız oldu.'));
  });
}

function transactionAsPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB işlemi başarısız oldu.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB işlemi iptal edildi.'));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PROJECT_STORE)) {
        database.createObjectStore(PROJECT_STORE, { keyPath: 'key' });
      }
      if (!database.objectStoreNames.contains(ASSET_STORE)) {
        database.createObjectStore(ASSET_STORE, { keyPath: 'elementId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Yerel proje veritabanı açılamadı.'));
  });
}

async function defaultResolveAsset(assetUrl: string): Promise<Blob> {
  const response = await fetch(assetUrl);
  if (!response.ok) {
    throw new Error('Fotoğraf yerel kayıt için okunamadı.');
  }
  return response.blob();
}

function portableAssetUrl(elementId: string): string {
  return `${ASSET_URL_PREFIX}${elementId}`;
}

export async function saveCurrentProject(
  project: Project,
  options: SaveCurrentProjectOptions = {},
): Promise<void> {
  const saveEpoch = persistenceEpoch;
  const validatedProject = parseProject(project);
  const resolveAsset = options.resolveAsset ?? defaultResolveAsset;
  const database = await openDatabase();

  try {
    const readTransaction = database.transaction(ASSET_STORE, 'readonly');
    const existingAssets = await requestAsPromise(
      readTransaction.objectStore(ASSET_STORE).getAll() as IDBRequest<StoredAssetRecord[]>,
    );
    await transactionAsPromise(readTransaction);

    const existingByElementId = new Map(existingAssets.map((asset) => [asset.elementId, asset]));
    const activeImageIds = new Set<string>();
    const nextAssets: StoredAssetRecord[] = [];
    const portableProject = structuredClone(validatedProject);

    for (const element of portableProject.elements) {
      if (element.type !== 'image') continue;

      activeImageIds.add(element.id);
      const runtimeAssetUrl = element.assetUrl;
      const existingAsset = existingByElementId.get(element.id);
      const blob = existingAsset?.sourceUrl === runtimeAssetUrl
        ? existingAsset.blob
        : await resolveAsset(runtimeAssetUrl);

      if (!(blob instanceof Blob)) {
        throw new Error('Fotoğraf yerel kayıt için geçersiz veri döndürdü.');
      }

      nextAssets.push({
        elementId: element.id,
        sourceUrl: runtimeAssetUrl,
        blob,
      });
      element.assetUrl = portableAssetUrl(element.id);
    }

    if (saveEpoch !== persistenceEpoch) return;

    const writeTransaction = database.transaction([PROJECT_STORE, ASSET_STORE], 'readwrite');
    writeTransaction.objectStore(PROJECT_STORE).put({
      key: CURRENT_PROJECT_KEY,
      project: portableProject,
      savedAt: Date.now(),
    } satisfies StoredProjectRecord);

    const assetStore = writeTransaction.objectStore(ASSET_STORE);
    for (const asset of nextAssets) assetStore.put(asset);
    for (const existingAsset of existingAssets) {
      if (!activeImageIds.has(existingAsset.elementId)) assetStore.delete(existingAsset.elementId);
    }

    await transactionAsPromise(writeTransaction);
  } finally {
    database.close();
  }
}

export async function loadCurrentProject(
  options: LoadCurrentProjectOptions = {},
): Promise<LoadedProject | null> {
  const createObjectUrl = options.createObjectUrl ?? ((blob: Blob) => URL.createObjectURL(blob));
  const revokeObjectUrl = options.revokeObjectUrl ?? ((url: string) => URL.revokeObjectURL(url));
  const database = await openDatabase();
  const createdUrls: string[] = [];

  try {
    const transaction = database.transaction([PROJECT_STORE, ASSET_STORE], 'readonly');
    const projectRequest = transaction.objectStore(PROJECT_STORE).get(CURRENT_PROJECT_KEY) as IDBRequest<StoredProjectRecord | undefined>;
    const assetRequest = transaction.objectStore(ASSET_STORE).getAll() as IDBRequest<StoredAssetRecord[]>;
    const [storedProject, storedAssets] = await Promise.all([
      requestAsPromise(projectRequest),
      requestAsPromise(assetRequest),
    ]);
    await transactionAsPromise(transaction);

    if (!storedProject) return null;

    const portableProject = parseProject(storedProject.project);
    const assetsByElementId = new Map(storedAssets.map((asset) => [asset.elementId, asset]));
    const runtimeProject = structuredClone(portableProject);

    for (const element of runtimeProject.elements) {
      if (element.type !== 'image' || !element.assetUrl.startsWith(ASSET_URL_PREFIX)) continue;

      const assetId = element.assetUrl.slice(ASSET_URL_PREFIX.length);
      const storedAsset = assetsByElementId.get(assetId);
      if (!storedAsset) {
        throw new Error('Kaydedilmiş fotoğraf verisi eksik veya bozuk.');
      }

      const runtimeUrl = createObjectUrl(storedAsset.blob);
      createdUrls.push(runtimeUrl);
      element.assetUrl = runtimeUrl;
    }

    const project = parseProject(runtimeProject);
    let disposed = false;

    return {
      project,
      dispose: () => {
        if (disposed) return;
        disposed = true;
        for (const url of createdUrls) revokeObjectUrl(url);
      },
    };
  } catch (error) {
    for (const url of createdUrls) revokeObjectUrl(url);
    throw error;
  } finally {
    database.close();
  }
}

export async function clearCurrentProject(): Promise<void> {
  persistenceEpoch += 1;
  const database = await openDatabase();

  try {
    const transaction = database.transaction([PROJECT_STORE, ASSET_STORE], 'readwrite');
    transaction.objectStore(PROJECT_STORE).clear();
    transaction.objectStore(ASSET_STORE).clear();
    await transactionAsPromise(transaction);
  } finally {
    database.close();
  }
}

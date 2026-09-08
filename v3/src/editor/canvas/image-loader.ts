export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 8192;

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

export type LoadedImageAsset = {
  url: string;
  width: number;
  height: number;
  revoke: () => void;
};

export function validateImageFile(file: File): void {
  if (!file.type.startsWith('image/')) {
    throw new Error('Lütfen geçerli bir resim dosyası seçin.');
  }

  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Yalnızca PNG, JPG, WebP veya GIF resimleri destekleniyor.');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Fotoğraf 20 MB sınırını aşıyor. Daha küçük bir resim seçin.');
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Fotoğraf okunamadı. Dosya bozuk olabilir.'));
    image.src = url;
  });
}

export async function readImageFile(file: File): Promise<LoadedImageAsset> {
  validateImageFile(file);

  const url = URL.createObjectURL(file);

  try {
    const image = await loadImage(url);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;

    if (!width || !height) {
      throw new Error('Fotoğraf boyutları okunamadı. Başka bir resim deneyin.');
    }

    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      throw new Error(
        `Fotoğraf çok büyük. En fazla ${MAX_IMAGE_DIMENSION} × ${MAX_IMAGE_DIMENSION} piksel kullanın.`,
      );
    }

    let revoked = false;
    return {
      url,
      width,
      height,
      revoke: () => {
        if (!revoked) {
          URL.revokeObjectURL(url);
          revoked = true;
        }
      },
    };
  } catch (error) {
    URL.revokeObjectURL(url);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Fotoğraf yüklenemedi. Başka bir resim deneyin.');
  }
}

import type {
  AnimationPreset,
  DecorationPreset,
  FramePreset,
  ImageEffects,
  Project,
} from '../model/project';

export type DesignTemplate = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  background: string;
  frame: FramePreset;
  decoration: DecorationPreset;
  motion: AnimationPreset;
  textFill: string;
  textStroke: string;
  textShadow: string;
  imageEffects?: Partial<ImageEffects>;
};

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  { id: 'neon-gece', name: 'Neon Gece', emoji: '💜', description: 'Mor-mavi neon, parıltı ve nabız.', background: '#080718', frame: 'neon', decoration: 'sparkles', motion: 'pulse', textFill: '#e8ddff', textStroke: '#7047ff', textShadow: '#6d5cff', imageEffects: { contrast: 12, saturation: 0.25 } },
  { id: 'altin-siklik', name: 'Altın Şıklık', emoji: '👑', description: 'Sıcak altın, zarif yıldızlar.', background: '#171008', frame: 'gold', decoration: 'stars', motion: 'float', textFill: '#ffe29a', textStroke: '#6b4307', textShadow: '#f2b843', imageEffects: { brightness: 0.08, contrast: 8 } },
  { id: 'romantik', name: 'Romantik', emoji: '💕', description: 'Pembe kalpler ve yumuşak hareket.', background: '#24101c', frame: 'hearts', decoration: 'hearts', motion: 'pulse', textFill: '#ffd8e9', textStroke: '#a51e55', textShadow: '#ff4f94' },
  { id: 'atesli', name: 'Ateşli', emoji: '🔥', description: 'Ateş çerçevesi ve güçlü kontrast.', background: '#1b0804', frame: 'fire', decoration: 'fire', motion: 'shake', textFill: '#ffe1a1', textStroke: '#b52b0c', textShadow: '#ff521f', imageEffects: { contrast: 18, saturation: 0.35 } },
  { id: 'buz-mavisi', name: 'Buz Mavisi', emoji: '❄️', description: 'Soğuk tonlar ve kar taneleri.', background: '#071a26', frame: 'ice', decoration: 'snow', motion: 'float', textFill: '#d9f8ff', textStroke: '#147ea8', textShadow: '#56d9ff', imageEffects: { brightness: 0.05, saturation: -0.15 } },
  { id: 'turk', name: 'Türk', emoji: '🇹🇷', description: 'Kırmızı-beyaz milli stil.', background: '#330308', frame: 'turkish', decoration: 'turkish', motion: 'swing', textFill: '#ffffff', textStroke: '#c30b16', textShadow: '#ff5260', imageEffects: { contrast: 10 } },
  { id: 'galaksi', name: 'Galaksi', emoji: '🌌', description: 'Derin uzay ve yıldız parıltısı.', background: '#07091f', frame: 'neon', decoration: 'stars', motion: 'wave', textFill: '#cabdff', textStroke: '#3b2c92', textShadow: '#987dff', imageEffects: { saturation: 0.2 } },
  { id: 'retro', name: 'Retro', emoji: '📼', description: 'Sıcak sepya ve sallanan yazı.', background: '#24170e', frame: 'gold', decoration: 'sparkles', motion: 'swing', textFill: '#ffd29b', textStroke: '#5f351d', textShadow: '#ca7441', imageEffects: { sepia: true, contrast: 8 } },
  { id: 'pembe-neon', name: 'Pembe Neon', emoji: '🌸', description: 'Canlı pembe neon parıltısı.', background: '#1b0719', frame: 'neon', decoration: 'sparkles', motion: 'blink', textFill: '#ffd8fb', textStroke: '#ec38c8', textShadow: '#ff45df', imageEffects: { saturation: 0.3 } },
  { id: 'mavi-neon', name: 'Mavi Neon', emoji: '💎', description: 'Elektrik mavisi ve parlak kenarlar.', background: '#061421', frame: 'neon', decoration: 'lightning', motion: 'pulse', textFill: '#dff8ff', textStroke: '#168ad1', textShadow: '#37c6ff', imageEffects: { contrast: 12, brightness: 0.05 } },
  { id: 'kirmizi-kalp', name: 'Kırmızı Kalp', emoji: '❤️', description: 'Kırmızı kalpler ve romantik vurgu.', background: '#250508', frame: 'hearts', decoration: 'hearts', motion: 'bounce', textFill: '#fff0f1', textStroke: '#bc1025', textShadow: '#ff304d' },
  { id: 'yildizli-gece', name: 'Yıldızlı Gece', emoji: '⭐', description: 'Gece mavisi ve kayan yıldız hissi.', background: '#070d21', frame: 'stars', decoration: 'stars', motion: 'slide', textFill: '#fff4bd', textStroke: '#3e52a8', textShadow: '#e5c653' },
  { id: 'gokkusagi', name: 'Gökkuşağı', emoji: '🌈', description: 'Renk değiştiren çerçeve ve konfeti.', background: '#151025', frame: 'rainbow', decoration: 'confetti', motion: 'wave', textFill: '#ffffff', textStroke: '#7448c7', textShadow: '#55d8ff', imageEffects: { saturation: 0.45 } },
  { id: 'oyuncu', name: 'Oyuncu', emoji: '🎮', description: 'Enerjik mor-mavi oyun stili.', background: '#080c18', frame: 'neon', decoration: 'lightning', motion: 'shake', textFill: '#bffcff', textStroke: '#5643e8', textShadow: '#44e2ff', imageEffects: { contrast: 18, saturation: 0.25 } },
  { id: 'zarif', name: 'Zarif', emoji: '✨', description: 'Sade altın parıltı ve yavaş süzülme.', background: '#121114', frame: 'gold', decoration: 'sparkles', motion: 'float', textFill: '#f8edd7', textStroke: '#8f7951', textShadow: '#d8c28e', imageEffects: { saturation: -0.15 } },
  { id: 'matrix', name: 'Matrix', emoji: '🟢', description: 'Yeşil dijital görünüm.', background: '#020a05', frame: 'glitter', decoration: 'sparkles', motion: 'blink', textFill: '#8cffad', textStroke: '#0f652d', textShadow: '#35ff72', imageEffects: { grayscale: true, contrast: 20 } },
  { id: 'elektrik', name: 'Elektrik', emoji: '⚡', description: 'Şimşek, titreşim ve parlak neon.', background: '#08101d', frame: 'neon', decoration: 'lightning', motion: 'shake', textFill: '#fff7b8', textStroke: '#3477d8', textShadow: '#5eb7ff', imageEffects: { contrast: 16 } },
  { id: 'cicek-bahcesi', name: 'Çiçek Bahçesi', emoji: '🌺', description: 'Renkli çiçekler ve yumuşak hareket.', background: '#211020', frame: 'hearts', decoration: 'flowers', motion: 'float', textFill: '#ffe0f2', textStroke: '#9d3b7c', textShadow: '#ef7cbe', imageEffects: { saturation: 0.2 } },
  { id: 'kelebek', name: 'Kelebek', emoji: '🦋', description: 'Kelebekler ve dalga hareketi.', background: '#11142d', frame: 'neon', decoration: 'butterflies', motion: 'wave', textFill: '#e6dcff', textStroke: '#7650b9', textShadow: '#b292ff' },
  { id: 'parti', name: 'Parti', emoji: '🎉', description: 'Konfeti, gökkuşağı ve zıplama.', background: '#171026', frame: 'rainbow', decoration: 'confetti', motion: 'bounce', textFill: '#ffffff', textStroke: '#d14da5', textShadow: '#59d6ff', imageEffects: { saturation: 0.4, brightness: 0.05 } },
];

export function applyDesignTemplate(project: Project, templateId: string): Project {
  const template = DESIGN_TEMPLATES.find((item) => item.id === templateId);
  if (!template) return structuredClone(project);

  return {
    ...structuredClone(project),
    background: template.background,
    frame: { preset: template.frame, width: project.frame.width || 8 },
    decorations: [{
      id: `template-${template.id}`,
      preset: template.decoration,
      count: 18,
      opacity: 0.82,
      speed: 'normal',
    }],
    elements: project.elements.map((element) => {
      if (element.type === 'text') {
        return {
          ...element,
          fill: template.textFill,
          stroke: template.textStroke,
          strokeWidth: Math.max(2, element.strokeWidth),
          shadowColor: template.textShadow,
          shadowBlur: 14,
          animation: { ...element.animation, preset: template.motion, speed: 'normal' },
        };
      }

      return {
        ...element,
        effects: { ...element.effects, ...template.imageEffects },
        animation: { ...element.animation, preset: template.motion, speed: 'normal' },
      };
    }),
  };
}

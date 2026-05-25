// Shared types — wire from Python worker /jobs response later.
export type Scene = {
  i: number;
  text: string;
  dur: number;
  file: string;
  size: string;
  dim: string;
  /** Tailwind gradient class — placeholder until real image src wired */
  img: string;
};

export type Voice = {
  id: string;
  label: string;
  gender: '♀' | '♂';
  tone: string;
  engine: 'edge-tts' | 'elevenlabs';
  free: boolean;
};

export type EffectPreset = 'Smooth' | 'Cinematic' | 'Subtle' | 'Dynamic';

export type Project = {
  id: string;
  title: string;
  duration: number;
  aspect: '9:16' | '16:9' | '1:1';
  voice: Voice;
  preset: EffectPreset;
  scenes: Scene[];
  status: 'draft' | 'rendering' | 'done' | 'error';
};

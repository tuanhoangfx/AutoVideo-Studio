export type VoiceOption = {
  id: string;
  label: string;
  gender: string;
  locale: string;
  tone: string;
  recommended?: boolean;
};

/** Curated live edge-tts voices (retired ids removed — see voice-catalog.ts aliases). */
export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'en-US-JennyNeural', label: 'Jenny', gender: '♀', locale: 'EN-US', tone: 'friendly', recommended: true },
  { id: 'vi-VN-HoaiMyNeural', label: 'Hoài My', gender: '♀', locale: 'VI', tone: 'warm, natural' },
  { id: 'vi-VN-NamMinhNeural', label: 'Nam Minh', gender: '♂', locale: 'VI', tone: 'clear, strong' },
  { id: 'en-US-AriaNeural', label: 'Aria', gender: '♀', locale: 'EN-US', tone: 'expressive' },
  { id: 'en-US-GuyNeural', label: 'Guy', gender: '♂', locale: 'EN-US', tone: 'news' },
  { id: 'en-US-AnaNeural', label: 'Ana', gender: '♀', locale: 'EN-US', tone: 'young' },
  { id: 'en-US-AvaNeural', label: 'Ava', gender: '♀', locale: 'EN-US', tone: 'friendly' },
  { id: 'en-US-EmmaNeural', label: 'Emma', gender: '♀', locale: 'EN-US', tone: 'natural' },
  { id: 'en-US-AndrewNeural', label: 'Andrew', gender: '♂', locale: 'EN-US', tone: 'business' },
  { id: 'en-US-BrianNeural', label: 'Brian', gender: '♂', locale: 'EN-US', tone: 'clear' },
  { id: 'en-US-ChristopherNeural', label: 'Christopher', gender: '♂', locale: 'EN-US', tone: 'deep' },
  { id: 'en-US-EricNeural', label: 'Eric', gender: '♂', locale: 'EN-US', tone: 'steady' },
  { id: 'en-US-MichelleNeural', label: 'Michelle', gender: '♀', locale: 'EN-US', tone: 'smooth' },
  { id: 'en-US-RogerNeural', label: 'Roger', gender: '♂', locale: 'EN-US', tone: 'authoritative' },
  { id: 'en-US-SteffanNeural', label: 'Steffan', gender: '♂', locale: 'EN-US', tone: 'professional' },
  { id: 'en-GB-LibbyNeural', label: 'Libby', gender: '♀', locale: 'EN-GB', tone: 'natural' },
  { id: 'en-GB-MaisieNeural', label: 'Maisie', gender: '♀', locale: 'EN-GB', tone: 'young' },
  { id: 'en-GB-RyanNeural', label: 'Ryan', gender: '♂', locale: 'EN-GB', tone: 'clear' },
  { id: 'en-GB-SoniaNeural', label: 'Sonia', gender: '♀', locale: 'EN-GB', tone: 'calm' },
  { id: 'en-GB-ThomasNeural', label: 'Thomas', gender: '♂', locale: 'EN-GB', tone: 'steady' },
  { id: 'en-AU-NatashaNeural', label: 'Natasha', gender: '♀', locale: 'EN-AU', tone: 'natural' },
  { id: 'en-AU-WilliamMultilingualNeural', label: 'William', gender: '♂', locale: 'EN-AU', tone: 'clear' },
  { id: 'en-CA-ClaraNeural', label: 'Clara', gender: '♀', locale: 'EN-CA', tone: 'friendly' },
  { id: 'en-CA-LiamNeural', label: 'Liam', gender: '♂', locale: 'EN-CA', tone: 'warm' },
  { id: 'en-IN-NeerjaNeural', label: 'Neerja', gender: '♀', locale: 'EN-IN', tone: 'expressive' },
  { id: 'en-IN-PrabhatNeural', label: 'Prabhat', gender: '♂', locale: 'EN-IN', tone: 'formal' },
  { id: 'en-IE-ConnorNeural', label: 'Connor', gender: '♂', locale: 'EN-IE', tone: 'calm' },
  { id: 'en-IE-EmilyNeural', label: 'Emily', gender: '♀', locale: 'EN-IE', tone: 'warm' },
  { id: 'en-NZ-MitchellNeural', label: 'Mitchell', gender: '♂', locale: 'EN-NZ', tone: 'clear' },
  { id: 'en-NZ-MollyNeural', label: 'Molly', gender: '♀', locale: 'EN-NZ', tone: 'friendly' },
  { id: 'en-ZA-LeahNeural', label: 'Leah', gender: '♀', locale: 'EN-ZA', tone: 'smooth' },
  { id: 'en-ZA-LukeNeural', label: 'Luke', gender: '♂', locale: 'EN-ZA', tone: 'steady' },
  { id: 'en-HK-SamNeural', label: 'Sam', gender: '♂', locale: 'EN-HK', tone: 'clear' },
  { id: 'en-HK-YanNeural', label: 'Yan', gender: '♀', locale: 'EN-HK', tone: 'natural' },
  { id: 'en-SG-LunaNeural', label: 'Luna', gender: '♀', locale: 'EN-SG', tone: 'friendly' },
  { id: 'en-SG-WayneNeural', label: 'Wayne', gender: '♂', locale: 'EN-SG', tone: 'formal' },
  { id: 'en-PH-JamesNeural', label: 'James', gender: '♂', locale: 'EN-PH', tone: 'bright' },
  { id: 'en-PH-RosaNeural', label: 'Rosa', gender: '♀', locale: 'EN-PH', tone: 'warm' },
  { id: 'ja-JP-NanamiNeural', label: 'Nanami', gender: '♀', locale: 'JA', tone: 'bright' },
  { id: 'ja-JP-KeitaNeural', label: 'Keita', gender: '♂', locale: 'JA', tone: 'clear' },
  { id: 'ko-KR-SunHiNeural', label: 'SunHi', gender: '♀', locale: 'KO', tone: 'warm' },
  { id: 'ko-KR-InJoonNeural', label: 'InJoon', gender: '♂', locale: 'KO', tone: 'steady' },
  { id: 'zh-CN-XiaoxiaoNeural', label: 'Xiaoxiao', gender: '♀', locale: 'ZH', tone: 'soft' },
  { id: 'zh-CN-YunxiNeural', label: 'Yunxi', gender: '♂', locale: 'ZH', tone: 'young' },
  { id: 'th-TH-PremwadeeNeural', label: 'Premwadee', gender: '♀', locale: 'TH', tone: 'smooth' },
  { id: 'id-ID-GadisNeural', label: 'Gadis', gender: '♀', locale: 'ID', tone: 'clear' },
];

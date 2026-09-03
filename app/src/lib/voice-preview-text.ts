function voiceNameFromId(voiceId: string): string {
  const tail = voiceId.split('-').slice(2).join('-').replace(/Neural$/i, '').trim();
  return tail || 'Voice';
}

/** Short TTS samples for voice-list previews (max 200 chars — worker limit). */
export function voiceListPreviewText(voiceId: string, voiceLabel?: string): string {
  const name = voiceLabel?.trim() || voiceNameFromId(voiceId);
  if (voiceId.startsWith('vi-VN')) {
    return `Xin chào, tôi là ${name}. Đây là bản nghe thử giọng đọc trong AutoVideo Studio.`;
  }
  if (voiceId.startsWith('ja-')) return `こんにちは、${name}です。これは音声プレビューです。`;
  if (voiceId.startsWith('ko-')) return `안녕하세요, ${name}입니다. 음성 미리듣기입니다.`;
  if (voiceId.startsWith('zh-')) return `你好，我是${name}。这是语音预览。`;
  if (voiceId.startsWith('th-')) return `สวัสดี ฉันคือ ${name} นี่คือตัวอย่างเสียง`;
  if (voiceId.startsWith('id-')) return `Halo, saya ${name}. Ini pratinjau suara.`;
  return `Hello, I'm ${name}. This is a voice preview in AutoVideo Studio.`;
}

export function clampVoicePreviewText(text: string, maxLen = 200): string {
  const trimmed = text.trim();
  if (!trimmed) return voiceListPreviewText('en-US-JennyNeural', 'Jenny');
  return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}` : trimmed;
}

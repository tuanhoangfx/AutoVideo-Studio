/** Short TTS samples for voice-list previews (max 200 chars — worker limit). */
export function voiceListPreviewText(voiceId: string): string {
  if (voiceId.startsWith('vi-VN')) {
    return 'Xin chào, đây là bản nghe thử giọng đọc trong AutoVideo Studio.';
  }
  if (voiceId.startsWith('ja-')) return 'こんにちは。これは音声プレビューです。';
  if (voiceId.startsWith('ko-')) return '안녕하세요. 음성 미리듣기입니다.';
  if (voiceId.startsWith('zh-')) return '你好，这是语音预览。';
  if (voiceId.startsWith('th-')) return 'สวัสดี นี่คือตัวอย่างเสียง';
  if (voiceId.startsWith('id-')) return 'Halo, ini pratinjau suara.';
  return 'Hello, this is a voice preview in AutoVideo Studio.';
}

export function clampVoicePreviewText(text: string, maxLen = 200): string {
  const trimmed = text.trim();
  if (!trimmed) return voiceListPreviewText('en-US-JennyNeural');
  return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}` : trimmed;
}

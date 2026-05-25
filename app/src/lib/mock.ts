import type { Project } from './types';

export const MOCK_PROJECT: Project = {
  id: 'J260525-a3f2c1',
  title: 'Top 5 mẹo tiết kiệm thời gian khi code với AI',
  duration: 27.3,
  aspect: '9:16',
  voice: {
    id: 'vi-HoaiMy',
    label: 'Hoài My',
    gender: '♀',
    tone: 'warm',
    engine: 'edge-tts',
    free: true,
  },
  preset: 'Cinematic',
  status: 'draft',
  scenes: [
    { i: 1, text: 'Bạn dành quá nhiều thời gian sửa code AI gen? Đây là 5 mẹo giúp tăng tốc.', dur: 4.2, file: 'IMG_4821.jpg', size: '3.2 MB', dim: '1920×1080', img: 'from-slate-700 to-slate-900' },
    { i: 2, text: 'Mẹo 1: Mô tả context rõ ràng — file paths, line numbers, ý định cụ thể.', dur: 5.1, file: 'IMG_4822.jpg', size: '2.8 MB', dim: '1920×1080', img: 'from-blue-900 to-indigo-900' },
    { i: 3, text: 'Mẹo 2: Yêu cầu AI review từng phần trước khi sinh code dài.', dur: 4.8, file: 'IMG_4823.jpg', size: '4.1 MB', dim: '2048×1365', img: 'from-emerald-900 to-teal-900' },
    { i: 4, text: 'Mẹo 3: Dùng plan mode để chốt approach trước khi implement.', dur: 4.5, file: 'IMG_4824.jpg', size: '3.7 MB', dim: '1920×1080', img: 'from-amber-900 to-orange-900' },
    { i: 5, text: 'Mẹo 4: Lưu pattern vào memory để dùng lại sau.', dur: 4.0, file: 'IMG_4825.jpg', size: '2.4 MB', dim: '1920×1080', img: 'from-rose-900 to-pink-900' },
    { i: 6, text: 'Mẹo 5: Verify bằng cách chạy app, đừng chỉ tin tests pass.', dur: 4.7, file: 'IMG_4826.jpg', size: '3.5 MB', dim: '1920×1080', img: 'from-purple-900 to-violet-900' },
  ],
};

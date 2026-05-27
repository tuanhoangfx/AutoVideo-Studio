export type RuntimeShell = 'web' | 'desktop';
export type RenderRuntime = 'offline' | 'local' | 'tunnel' | 'vps' | 'public';

export type RuntimeProfile = {
  shell: RuntimeShell;
  render: RenderRuntime;
  label: string;
  detail: string;
};

export function detectRuntimeProfile(workerUrl: string): RuntimeProfile {
  const shell = detectShell();
  const render = detectRenderRuntime(workerUrl);
  return {
    shell,
    render,
    label: `${shell === 'desktop' ? 'Desktop Shell' : 'Web Shell'} / ${renderLabel(render)}`,
    detail: renderDetail(render, shell),
  };
}

export function detectShell(): RuntimeShell {
  if (typeof window === 'undefined') return 'web';
  if (window.autovideo || window.__TAURI__ || window.electronAPI) return 'desktop';
  return 'web';
}

export function detectRenderRuntime(workerUrl: string): RenderRuntime {
  if (!workerUrl) return 'offline';
  if (/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/i.test(workerUrl)) return 'local';
  if (/trycloudflare\.com/i.test(workerUrl)) return 'tunnel';
  if (/zaloai\.infix1\.io\.vn/i.test(workerUrl)) return 'vps';
  return 'public';
}

function renderLabel(render: RenderRuntime) {
  if (render === 'local') return 'Local Worker';
  if (render === 'tunnel') return 'Tunnel Worker';
  if (render === 'vps') return 'VPS Worker';
  if (render === 'public') return 'Public Worker';
  return 'Offline';
}

function renderDetail(render: RenderRuntime, shell: RuntimeShell) {
  if (shell === 'desktop' && render === 'local') {
    return 'Shared Studio UI with native local render capability.';
  }
  if (render === 'tunnel') return 'Shared Studio UI calling a Cloudflare Tunnel worker.';
  if (render === 'vps') return 'Shared Studio UI calling a dedicated VPS worker.';
  if (render === 'public') return 'Shared Studio UI calling a public worker endpoint.';
  if (render === 'local') return 'Local worker is only reachable from this machine.';
  return 'Set a worker URL or launch the desktop/local render agent.';
}

import type { LibraryImage } from '@/types/studio';
import type { FileWithRelativePath, FolderBucket, FolderImage, WorkspaceTreeNodeData } from './types';

export function attachRelativePath(file: File, relativePath: string): FileWithRelativePath {
  const next = file as FileWithRelativePath;
  try {
    Object.defineProperty(next, 'relativePath', { value: relativePath, configurable: true });
  } catch {
    next.relativePath = relativePath;
  }
  return next;
}

export function relativePathOf(file: File) {
  const browserPath = 'webkitRelativePath' in file ? file.webkitRelativePath : '';
  return browserPath || (file as FileWithRelativePath).relativePath || '';
}

export function fileKey(file: File) {
  const relativePath = relativePathOf(file);
  return `${relativePath || file.name}:${file.size}:${file.lastModified}`;
}

export function imageSyncKey(image: LibraryImage) {
  return image.driveFileId ? `drive:${image.driveFileId}` : fileKey(image.file);
}

export function sourceFolderName(file: File) {
  const relativePath = relativePathOf(file);
  const [folderName] = relativePath.split(/[\\/]/);
  return folderName || undefined;
}

export function parseDriveFolderInputs(input: string) {
  return input
    .split(/[\s,]+/g)
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);
}

export function filterWorkspaces(
  folders: FolderBucket[],
  sourceFilter: 'all' | 'local' | 'drive',
  query: string
) {
  const normalized = query.trim().toLowerCase();
  return folders.filter((folder) => {
    if (sourceFilter !== 'all' && folder.source !== sourceFilter) return false;
    if (!normalized) return true;
    if (folder.name.toLowerCase().includes(normalized)) return true;
    return folder.files.some((item) =>
      `${item.relativePath ?? ''} ${item.file?.name ?? ''} ${item.driveFile?.name ?? ''}`
        .toLowerCase()
        .includes(normalized)
    );
  });
}

export function folderId(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'local-folder'
  );
}

export function displayPathSegments(folder: FolderBucket, item: FolderImage) {
  const rawPath = item.relativePath || item.file?.name || item.driveFile?.name || 'image';
  const parts = rawPath.split(/[\\/]/).filter(Boolean);
  if (parts[0] === folder.name) return parts.slice(1);
  return parts;
}

export function displayFolderSegments(folder: FolderBucket, item: FolderImage) {
  const parts = displayPathSegments(folder, item);
  if (parts.length <= 1) return ['Images'];
  return parts.slice(0, -1);
}

export function displayFolderPath(folder: FolderBucket, item: FolderImage) {
  return displayFolderSegments(folder, item).join('/');
}

type TreeNode = { files: FolderImage[]; children: TreeNode[] };

export function flattenTreeFiles(node: TreeNode): FolderImage[] {
  return node.children.reduce<FolderImage[]>((acc, child) => {
    acc.push(...flattenTreeFiles(child));
    return acc;
  }, [...node.files]);
}

export function displaySourceFolder(folder: FolderBucket, item: FolderImage) {
  const parts = displayPathSegments(folder, item);
  if (parts.length <= 1) return folder.name;
  return `${folder.name}/${parts.slice(0, -1).join('/')}`;
}

export function workspaceTree(folder: FolderBucket, query: string): WorkspaceTreeNodeData[] {
  const normalized = query.trim().toLowerCase();
  const root: WorkspaceTreeNodeData[] = [];
  folder.files
    .filter((item) => {
      if (!normalized) return true;
      const haystack = `${item.relativePath ?? ''} ${item.file?.name ?? ''} ${item.driveFile?.name ?? ''}`.toLowerCase();
      return folder.name.toLowerCase().includes(normalized) || haystack.includes(normalized);
    })
    .forEach((item) => {
      const segments = displayFolderSegments(folder, item);
      let current = root;
      let path = '';
      segments.forEach((segment, index) => {
        path = path ? `${path}/${segment}` : segment;
        let node = current.find((candidate) => candidate.name === segment);
        if (!node) {
          node = { path, name: segment, children: [], files: [] };
          current.push(node);
        }
        node.files.push(item);
        current = node.children;
      });
    });
  return root;
}

export function driveErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('API key') || message.includes('developer key') || message.includes('key')) {
    return 'Google Drive API key is invalid or Drive API is not enabled. Check NEXT_PUBLIC_GOOGLE_API_KEY restrictions and try again.';
  }
  if (message.includes('public') || message.includes('403') || message.includes('404')) {
    return message;
  }
  return message;
}

export async function readImageFilesFromDirectory(directoryHandle: {
  name?: string;
  values: () => AsyncIterable<{ kind: string; name: string; getFile: () => Promise<File> }>;
}): Promise<FileWithRelativePath[]> {
  const files: FileWithRelativePath[] = [];
  const walk = async (handle: typeof directoryHandle, parts: string[]) => {
    for await (const entry of handle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        if (file.type.startsWith('image/')) {
          files.push(attachRelativePath(file, [...parts, file.name].join('/')));
        }
      } else if (entry.kind === 'directory') {
        await walk(entry as unknown as typeof directoryHandle, [...parts, entry.name]);
      }
    }
  };
  await walk(directoryHandle, [directoryHandle.name || 'Local folder']);
  return files;
}


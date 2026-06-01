import type { DriveImageFile } from '@/lib/google-drive';

export type FolderImage = {
  id: string;
  file?: File;
  driveFile?: DriveImageFile;
  relativePath?: string;
  url: string;
  selected: boolean;
};

export type FolderBucket = {
  id: string;
  name: string;
  source: 'local' | 'drive';
  driveFolderId?: string;
  files: FolderImage[];
};

export type FolderError = {
  message: string;
  canRetry?: boolean;
};

export type FileWithRelativePath = File & { relativePath?: string };

export type WorkspaceTreeNodeData = {
  path: string;
  name: string;
  children: WorkspaceTreeNodeData[];
  files: FolderImage[];
};


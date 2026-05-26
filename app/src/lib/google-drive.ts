'use client';

export type DriveFolder = {
  id: string;
  name: string;
};

export type DriveImageFile = {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  size?: string;
  modifiedTime?: string;
};

export function googleDriveConfigured() {
  return true;
}

export function googleDriveConfigHint() {
  return 'Missing GOOGLE_DRIVE_API_KEY on the server.';
}

export async function getPublicDriveFolder(folderInput: string): Promise<DriveFolder> {
  const res = await fetch(`/api/google-drive/public?${new URLSearchParams({ mode: 'folder', input: folderInput })}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await driveErrorMessage(res, 'Could not read the public folder.'));
  return (await res.json()) as DriveFolder;
}

export async function listDriveFolderImages(folderId: string): Promise<DriveImageFile[]> {
  const res = await fetch(`/api/google-drive/public?${new URLSearchParams({ mode: 'list', folderId })}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await driveErrorMessage(res, 'Could not list images in the public folder.'));
  const data = (await res.json()) as { files?: DriveImageFile[] };
  return data.files ?? [];
}

export async function downloadDriveImage(file: DriveImageFile): Promise<File> {
  const res = await fetch(
    `/api/google-drive/public?${new URLSearchParams({
      mode: 'download',
      fileId: file.id,
      name: file.name,
      mimeType: file.mimeType,
    })}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error(await driveErrorMessage(res, `Could not download image ${file.name}.`));
  const blob = await res.blob();
  return new File([blob], file.name, { type: blob.type || file.mimeType || 'image/jpeg' });
}

async function driveErrorMessage(res: Response, fallback: string) {
  let detail = '';
  try {
    const data = await res.json();
    detail = data?.message || data?.error?.message ? ` ${data.message || data.error.message}` : '';
  } catch {
    try {
      detail = ` ${await res.text()}`;
    } catch {}
  }

  if (res.status === 403 || res.status === 404) {
    return `${fallback} Make sure the folder/file is public ("Anyone with the link can view") and the API key has Google Drive API enabled.${detail}`;
  }
  return `${fallback} (${res.status})${detail}`;
}

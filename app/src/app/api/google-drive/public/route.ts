import { NextRequest, NextResponse } from 'next/server';

type DriveFolder = {
  id: string;
  name: string;
};

type DriveImageFile = {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  size?: string;
  modifiedTime?: string;
};

const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const mode = req.nextUrl.searchParams.get('mode');

    if (mode === 'folder') {
      const input = req.nextUrl.searchParams.get('input') ?? '';
      const folder = await getPublicDriveFolder(input);
      return NextResponse.json(folder);
    }

    if (mode === 'list') {
      const folderId = req.nextUrl.searchParams.get('folderId') ?? '';
      if (!isDriveId(folderId)) return errorResponse('Invalid Google Drive folder ID.', 400);
      const files = await listDriveFolderImages(folderId);
      return NextResponse.json({ files });
    }

    if (mode === 'download') {
      const fileId = req.nextUrl.searchParams.get('fileId') ?? '';
      const fileName = req.nextUrl.searchParams.get('name') ?? 'drive-image';
      const mimeType = req.nextUrl.searchParams.get('mimeType') ?? 'image/jpeg';
      if (!isDriveId(fileId)) return errorResponse('Invalid Google Drive file ID.', 400);
      return await downloadDriveImage(fileId, fileName, mimeType);
    }

    return errorResponse('Invalid Drive mode.', 400);
  } catch (e: any) {
    return errorResponse(e?.message || String(e), 500);
  }
}

async function getPublicDriveFolder(folderInput: string): Promise<DriveFolder> {
  const id = parseDriveFolderId(folderInput);
  if (!id) throw new Error('Invalid Google Drive folder link or ID.');

  const data = await driveJson<{ id?: string; name?: string; mimeType?: string }>(
    `${DRIVE_API}/${encodeURIComponent(id)}?${driveParams({
      fields: 'id,name,mimeType',
      supportsAllDrives: 'true',
    })}`,
    'Could not read the public folder.'
  );

  if (data.mimeType && data.mimeType !== DRIVE_FOLDER_MIME) {
    throw new Error('This Google Drive link is not a folder.');
  }
  return { id: data.id || id, name: data.name || id };
}

async function listDriveFolderImages(folderId: string): Promise<DriveImageFile[]> {
  const files: DriveImageFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = driveParams({
      q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
      fields: 'nextPageToken,files(id,name,mimeType,thumbnailLink,size,modifiedTime)',
      orderBy: 'name_natural',
      pageSize: '1000',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const data = await driveJson<{ files?: DriveImageFile[]; nextPageToken?: string }>(
      `${DRIVE_API}?${params}`,
      'Could not list images in the public folder.'
    );
    files.push(...(data.files ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}

async function downloadDriveImage(fileId: string, fileName: string, mimeType: string) {
  const res = await driveFetch(`${DRIVE_API}/${encodeURIComponent(fileId)}?${driveParams({ alt: 'media' })}`);
  if (!res.ok) {
    return errorResponse(await driveErrorMessage(res, `Could not download image ${fileName}.`), res.status);
  }

  const headers = new Headers();
  headers.set('content-type', res.headers.get('content-type') || mimeType || 'image/jpeg');
  headers.set('cache-control', 'private, max-age=86400');
  headers.set('content-disposition', `inline; filename="${safeFileName(fileName)}"`);
  return new Response(await res.arrayBuffer(), { headers });
}

async function driveJson<T>(url: string, fallback: string): Promise<T> {
  const res = await driveFetch(url);
  if (!res.ok) throw new Error(await driveErrorMessage(res, fallback));
  return (await res.json()) as T;
}

function driveFetch(url: string) {
  return fetch(url, {
    cache: 'no-store',
    headers: {
      // The API key is restricted to local browser referrers; use a stable allowlisted referrer here.
      Referer: process.env.GOOGLE_DRIVE_API_REFERER || 'http://localhost:3021/studio',
    },
  });
}

function driveParams(params: Record<string, string>) {
  const key = process.env.GOOGLE_DRIVE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  if (!key) throw new Error('Missing GOOGLE_DRIVE_API_KEY on the server.');
  return new URLSearchParams({ ...params, key });
}

function parseDriveFolderId(input: string) {
  const value = input.trim();
  if (!value) return null;
  if (isDriveId(value)) return value;

  try {
    const url = new URL(value);
    const folderMatch = url.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch?.[1]) return folderMatch[1];
    return url.searchParams.get('id') || url.searchParams.get('folders');
  } catch {
    return null;
  }
}

function isDriveId(value: string) {
  return /^[a-zA-Z0-9_-]{20,}$/.test(value);
}

async function driveErrorMessage(res: Response, fallback: string) {
  let detail = '';
  try {
    const data = await res.json();
    detail = data?.error?.message ? ` ${data.error.message}` : '';
  } catch {
    try {
      detail = ` ${await res.text()}`;
    } catch {}
  }

  if (detail.includes('referer') || detail.includes('API key')) {
    return `${fallback} API key is blocked by restrictions. Check GOOGLE_DRIVE_API_REFERER or the referrer allowlist in Google Cloud.${detail}`;
  }
  if (res.status === 403 || res.status === 404) {
    return `${fallback} Make sure the folder/file is public ("Anyone with the link can view") and Google Drive API is enabled.${detail}`;
  }
  return `${fallback} (${res.status})${detail}`;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function safeFileName(name: string) {
  return name.replace(/["\r\n]/g, '_');
}

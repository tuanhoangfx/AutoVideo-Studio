# Google Drive Asset Schema

AutoVideo Studio supports a hybrid image library:

- `local`: files selected from local upload or local folders.
- `drive`: images loaded from public Google Drive folder links, downloaded as `File` objects before render.

## Env

Set these server env vars for the Drive API proxy:

```env
GOOGLE_DRIVE_API_KEY=your-google-api-key
GOOGLE_DRIVE_API_REFERER=http://localhost:3021/studio
```

No Google login or OAuth is used. The folder and image files must be public:

```text
Anyone with the link can view
```

Google API key setup:

- API restriction: Google Drive API.
- Website restrictions:
  - `http://localhost:3021`
  - `http://localhost:3021/*`
  - `http://127.0.0.1:3021`
  - `http://127.0.0.1:3021/*`

The browser calls the local Next.js API route (`/api/google-drive/public`) instead of calling Google directly. This avoids browser-specific referrer mismatch while keeping the same public-folder-only behavior.

## Runtime Metadata

`LibraryImage` keeps render-compatible `File` data plus source metadata:

```ts
type LibraryImage = {
  file: File;
  url: string;
  used: boolean;
  sourceFolder?: string;
  sourceKind?: 'local' | 'drive';
  driveFolderId?: string;
  driveFileId?: string;
  thumbnailUrl?: string;
};
```

## Drive Flow

1. User clicks `+ Public Drive`.
2. User pastes a public Google Drive folder link or folder ID.
3. Frontend asks the local Next.js API route to read folder metadata and list public images with Drive API + API key.
4. User selects one or more images in the folder.
5. `Sync selected` loads cached Drive images from IndexedDB when possible, otherwise downloads each selected image as a `File` and caches it.
6. Render flow remains unchanged: selected images are uploaded to the worker as multipart files.

This avoids changing the FastAPI worker contract while keeping enough Drive metadata for future project persistence and cache reuse.

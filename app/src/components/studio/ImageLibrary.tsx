'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  downloadDriveImage,
  getPublicDriveFolder,
  googleDriveConfigured,
  googleDriveConfigHint,
  listDriveFolderImages,
  type DriveImageFile,
} from '@/lib/google-drive';
import { clearCachedDriveImages, loadCachedDriveImage, saveCachedDriveImage } from '@/lib/drive-cache';

export type LibraryImage = {
  file: File;
  url: string; // ObjectURL
  used: boolean;
  sourceFolder?: string;
  sourceKind?: 'local' | 'drive';
  driveFolderId?: string;
  driveFileId?: string;
  thumbnailUrl?: string;
  cacheStatus?: 'cached' | 'downloaded';
};

export type LibraryImageInput = Pick<
  LibraryImage,
  'file' | 'sourceFolder' | 'sourceKind' | 'driveFolderId' | 'driveFileId' | 'thumbnailUrl' | 'cacheStatus'
>;

type FolderImage = {
  id: string;
  file?: File;
  driveFile?: DriveImageFile;
  url: string;
  selected: boolean;
};

type FolderBucket = {
  id: string;
  name: string;
  source: 'local' | 'drive';
  driveFolderId?: string;
  files: FolderImage[];
};

type FolderError = {
  message: string;
  canRetry?: boolean;
};

export function ImageLibrary({
  images,
  onAdd,
  onRemove,
  selectedIndex,
  onSelect,
  selectedForRender,
  onAddToKeyframe,
  imageDurationSec = 5,
}: {
  images: LibraryImage[];
  onAdd: (files: FileList | File[] | LibraryImageInput[]) => void;
  onRemove: (i: number) => void;
  selectedIndex: number;
  onSelect: (i: number) => void;
  selectedForRender?: number[];
  onAddToKeyframe?: (indexes: number[]) => void;
  imageDurationSec?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const foldersRef = useRef<FolderBucket[]>([]);
  const [folders, setFolders] = useState<FolderBucket[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [driveBusy, setDriveBusy] = useState(false);
  const [syncingDrive, setSyncingDrive] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'local' | 'drive'>('all');
  const [folderError, setFolderError] = useState<FolderError | null>(null);
  const [publicDriveOpen, setPublicDriveOpen] = useState(false);
  const [publicDriveInput, setPublicDriveInput] = useState('');
  const [driveNotice, setDriveNotice] = useState<string | null>(null);
  const [pendingIndexes, setPendingIndexes] = useState<number[]>([]);
  const [folderConfirmOpen, setFolderConfirmOpen] = useState(false);

  useEffect(() => {
    const input = folderInputRef.current;
    if (!input) return;
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
  }, []);

  useEffect(() => {
    foldersRef.current = folders;
  }, [folders]);

  useEffect(
    () => () => {
      foldersRef.current.forEach((folder) => {
        folder.files.forEach((item) => URL.revokeObjectURL(item.url));
      });
    },
    []
  );

  const syncedKeys = useMemo(() => new Set(images.map((img) => imageSyncKey(img))), [images]);
  const selectedRenderSet = useMemo(() => new Set(selectedForRender ?? []), [selectedForRender]);
  const pendingSet = useMemo(() => new Set(pendingIndexes), [pendingIndexes]);
  const filteredFolders = useMemo(
    () => folders.filter((folder) => sourceFilter === 'all' || folder.source === sourceFilter),
    [folders, sourceFilter]
  );
  const activeFolder =
    filteredFolders.find((folder) => folder.id === activeFolderId) ?? filteredFolders[0] ?? null;
  const selectedFolderFiles = activeFolder?.files.filter((item) => item.selected && !syncedKeys.has(item.id)) ?? [];

  const addFolders = (files: FileList | File[] | null, fallbackFolderName = 'Local folder') => {
    if (!files) return;
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const grouped = new Map<string, File[]>();
    imageFiles.forEach((file) => {
      const folderName = sourceFolderName(file) ?? fallbackFolderName;
      grouped.set(folderName, [...(grouped.get(folderName) ?? []), file]);
    });

    setFolders((prev) => {
      const next = [...prev];
      grouped.forEach((groupFiles, name) => {
        const bucketId = folderId(name);
        const existing = next.find((folder) => folder.id === bucketId);
        const existingKeys = new Set(existing?.files.map((item) => item.id) ?? []);
        const nextFiles = groupFiles
          .filter((file) => !existingKeys.has(fileKey(file)))
          .map((file) => ({
            id: fileKey(file),
            file,
            url: URL.createObjectURL(file),
            selected: false,
          }));
        if (nextFiles.length === 0) return;
        if (existing) {
          existing.files = [...existing.files, ...nextFiles];
        } else {
          next.push({ id: bucketId, name, source: 'local', files: nextFiles });
        }
      });
      if (!activeFolderId && next.length > 0) setActiveFolderId(next[0].id);
      return next;
    });
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const openFolderPicker = async () => {
    setFolderConfirmOpen(false);
    setFolderError(null);
    const picker = (window as any).showDirectoryPicker;
    if (typeof picker !== 'function') {
      folderInputRef.current?.click();
      return;
    }
    try {
      const directoryHandle = await picker({ mode: 'read' });
      const files = await readImageFilesFromDirectory(directoryHandle);
      addFolders(files, directoryHandle.name || 'Local folder');
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setFolderError({ message: e?.message || 'Could not read selected folder.', canRetry: false });
    }
  };

  const addDriveFolder = useCallback(async () => {
    setFolderError(null);
    setDriveNotice(null);
    const folderValue = publicDriveInput.trim();
    if (!folderValue) {
      setFolderError({ message: 'Paste a public Google Drive folder link or ID before loading.', canRetry: false });
      setPublicDriveOpen(true);
      return;
    }

    setDriveBusy(true);
    try {
      const folder = await getPublicDriveFolder(folderValue);
      const driveFiles = await listDriveFolderImages(folder.id);
      const bucketId = `drive:${folder.id}`;
      const nextFiles: FolderImage[] = driveFiles.map((file) => ({
        id: `drive:${file.id}`,
        driveFile: file,
        url: file.thumbnailLink ?? '',
        selected: false,
      }));

      setFolders((prev) => {
        const next = prev.filter((item) => item.id !== bucketId);
        next.push({
          id: bucketId,
          name: folder.name,
          source: 'drive',
          driveFolderId: folder.id,
          files: nextFiles,
        });
        setActiveFolderId(bucketId);
        return next;
      });
      setSourceFilter('all');
      setPublicDriveOpen(false);
    } catch (e: any) {
      setFolderError({ message: driveErrorMessage(e), canRetry: true });
      setPublicDriveOpen(true);
    } finally {
      setDriveBusy(false);
    }
  }, [publicDriveInput]);

  const clearDriveCache = useCallback(async () => {
    setFolderError(null);
    try {
      const deleted = await clearCachedDriveImages();
      setDriveNotice(deleted > 0 ? `Cleared ${deleted} cached Drive images.` : 'Drive cache is empty.');
    } catch (e: any) {
      setFolderError({ message: e?.message || String(e), canRetry: false });
    }
  }, []);

  const toggleFolderImage = (folderIdValue: string, imageId: string) => {
    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === folderIdValue
          ? {
              ...folder,
              files: folder.files.map((item) =>
                item.id === imageId ? { ...item, selected: !item.selected } : item
              ),
            }
          : folder
      )
    );
  };

  const setFolderSelection = (folderIdValue: string, selected: boolean) => {
    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === folderIdValue
          ? {
              ...folder,
              files: folder.files.map((item) => ({
                ...item,
                selected: syncedKeys.has(item.id) ? item.selected : selected,
              })),
            }
          : folder
      )
    );
  };

  const removeFolder = (folderIdValue: string) => {
    setFolders((prev) => {
      const removed = prev.find((folder) => folder.id === folderIdValue);
      removed?.files.forEach((item) => URL.revokeObjectURL(item.url));
      const next = prev.filter((folder) => folder.id !== folderIdValue);
      if (activeFolderId === folderIdValue) setActiveFolderId(next[0]?.id ?? null);
      return next;
    });
  };

  const syncSelectedFolderImages = async () => {
    if (selectedFolderFiles.length === 0) return;
    if (!activeFolder || activeFolder.source === 'local') {
      onAdd(selectedFolderFiles.map((item) => item.file).filter(Boolean) as File[]);
      return;
    }

    if (!activeFolder.driveFolderId) return;
    setFolderError(null);
    setSyncingDrive(true);
    try {
      const downloaded: LibraryImageInput[] = await Promise.all(
        selectedFolderFiles.map(async (item) => {
          if (!item.driveFile) throw new Error('Missing Google Drive image metadata.');
          let file = await loadCachedDriveImage(item.driveFile);
          const cacheStatus: LibraryImageInput['cacheStatus'] = file ? 'cached' : 'downloaded';
          if (!file) {
            file = await downloadDriveImage(item.driveFile);
            await saveCachedDriveImage(item.driveFile, file);
          }
          return {
            file,
            sourceKind: 'drive',
            sourceFolder: activeFolder.name,
            driveFolderId: activeFolder.driveFolderId,
            driveFileId: item.driveFile.id,
            thumbnailUrl: item.driveFile.thumbnailLink,
            cacheStatus,
          };
        })
      );
      onAdd(downloaded);
    } catch (e: any) {
      setFolderError({ message: driveErrorMessage(e), canRetry: true });
    } finally {
      setSyncingDrive(false);
    }
  };

  const togglePendingImage = (index: number) => {
    setPendingIndexes((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index]
    );
    onSelect(index);
  };

  const addPendingToKeyframe = () => {
    const next = pendingIndexes.filter((index) => index >= 0 && index < images.length);
    if (next.length === 0) return;
    onAddToKeyframe?.(next);
    setPendingIndexes([]);
  };

  return (
    <section>
      <div className="hub-filter-toolbar mx-2 mt-1">
        <div className="hub-filter-row">
        <div className="hub-filter-chips mr-auto" role="group" aria-label="Image source filters">
          {(['all', 'local', 'drive'] as const).map((source) => (
            <button
              key={source}
              onClick={() => setSourceFilter(source)}
              className={`hub-filter-chip ${
                sourceFilter === source
                  ? 'active'
                  : ''
              }`}
            >
              {source === 'all' ? 'All' : source === 'local' ? 'Local' : 'Drive'}
            </button>
          ))}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="hub-filter-chip"
        >
          + Upload
        </button>
        <button
          onClick={() => setFolderConfirmOpen(true)}
          className="hub-filter-chip"
        >
          + Folder
        </button>
        <button
          onClick={() => setPublicDriveOpen((open) => !open)}
          disabled={driveBusy || !googleDriveConfigured()}
          className="hub-filter-chip disabled:cursor-not-allowed disabled:opacity-35"
          title={googleDriveConfigured() ? 'Paste a public Google Drive folder link' : googleDriveConfigHint()}
        >
          {driveBusy ? 'Drive...' : '+ Public Drive'}
        </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => e.target.files && onAdd(e.target.files)}
      />
      <input
        ref={folderInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => addFolders(e.target.files)}
      />
      {folderConfirmOpen && (
        <div className="mx-2 mt-1 rounded-xl border border-indigo-300/20 bg-indigo-500/10 p-2 text-[10px] text-indigo-50 shadow-lg shadow-black/20">
          <div className="font-semibold text-white">Import local folder?</div>
          <div className="mt-0.5 text-white/55">
            AutoVideo will scan image files only, then show them inside Image Library for review before adding to Keyframe.
          </div>
          <div className="mt-2 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setFolderConfirmOpen(false)}
              className="hub-filter-chip"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void openFolderPicker()}
              className="hub-filter-chip active"
            >
              Import folder
            </button>
          </div>
        </div>
      )}
      {publicDriveOpen && (
        <form
          className="mx-2 mt-1 rounded border border-white/10 bg-white/[.03] p-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            void addDriveFolder();
          }}
        >
          <div className="mb-1 text-[8px] text-white/45">
            Folder must be public: Anyone with the link can view.
          </div>
          <div className="flex gap-1">
            <label className="hub-search-box min-w-0 flex-1">
              <input
              value={publicDriveInput}
              onChange={(e) => setPublicDriveInput(e.target.value)}
              placeholder="Paste Drive folder link or folder ID..."
            />
            </label>
            <button
              type="submit"
              disabled={driveBusy || !publicDriveInput.trim()}
              className="hub-filter-chip active disabled:cursor-not-allowed disabled:opacity-35"
            >
              Load
            </button>
            <button
              type="button"
              onClick={clearDriveCache}
              className="hub-filter-chip"
            >
              Clear cache
            </button>
          </div>
        </form>
      )}
      {driveNotice && (
        <div className="mx-2 mt-1 rounded border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[9px] text-emerald-100">
          {driveNotice}
        </div>
      )}
      {folderError && (
        <div className="mx-2 mt-1 rounded border border-rose-400/25 bg-rose-500/10 px-2 py-1 text-[9px] text-rose-100">
          <div>{folderError.message}</div>
          <div className="mt-1 flex items-center gap-2">
            {folderError.canRetry && (
              <button
                onClick={addDriveFolder}
                disabled={driveBusy}
                className="rounded bg-white/10 px-1.5 py-0.5 font-semibold text-white hover:bg-white/15 disabled:opacity-40"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => setFolderError(null)}
              className="text-white/55 hover:text-white"
            >
              hide
            </button>
          </div>
        </div>
      )}
      {filteredFolders.length > 0 && (
        <div className="m-2 overflow-hidden rounded-md border border-[var(--border-subtle)] bg-black/20">
          <div className="grid grid-cols-[0.42fr_0.58fr]">
            <div className="max-h-36 overflow-y-auto border-r border-[var(--border-subtle)] p-1">
              {filteredFolders.map((folder) => {
                const selectedCount = folder.files.filter((item) => item.selected).length;
                return (
                  <div
                    key={folder.id}
                    className={`group relative mb-1 rounded transition ${
                      activeFolder?.id === folder.id
                        ? 'bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/40'
                        : 'hover:bg-white/[.04]'
                    }`}
                  >
                    <button
                      onClick={() => setActiveFolderId(folder.id)}
                      className="w-full px-1.5 py-1 text-left"
                    >
                      <div className="flex items-center gap-1 text-[9px] font-semibold text-white/85">
                        <span>{folder.source === 'drive' ? 'G' : 'L'}</span>
                        <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                        <span className="font-mono text-white/35">{folder.files.length}</span>
                      </div>
                      <div className="mt-0.5 text-[8px] text-white/35">{selectedCount} selected</div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFolder(folder.id);
                      }}
                      className="absolute bottom-1 right-1 text-[8px] text-white/35 opacity-0 hover:text-rose-200 group-hover:opacity-100"
                    >
                      remove
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="min-w-0 p-1">
              {activeFolder && (
                <>
                  <div className="mb-1 flex items-center justify-between gap-1">
                    <div className="min-w-0 truncate text-[9px] text-white/55">
                      Select images in <span className="text-white/80">{activeFolder.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setFolderSelection(activeFolder.id, true)}
                        className="rounded bg-white/[.05] px-1.5 py-0.5 text-[8px] text-white/55 hover:text-white"
                      >
                        all
                      </button>
                      <button
                        onClick={() => setFolderSelection(activeFolder.id, false)}
                        className="rounded bg-white/[.05] px-1.5 py-0.5 text-[8px] text-white/55 hover:text-white"
                      >
                        none
                      </button>
                    </div>
                  </div>
                  <div className="grid max-h-24 grid-cols-3 gap-1 overflow-y-auto">
                    {activeFolder.files.map((item) => {
                      const isSynced = syncedKeys.has(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => !isSynced && toggleFolderImage(activeFolder.id, item.id)}
                          disabled={isSynced}
                          className={`group relative aspect-[4/3] overflow-hidden rounded ring-1 transition ${
                            isSynced
                              ? 'cursor-not-allowed ring-emerald-400/50 opacity-70'
                              : item.selected
                              ? 'ring-[var(--accent)] ring-2'
                              : 'ring-white/10 hover:ring-white/30'
                          }`}
                          title={isSynced ? 'Already synced to library' : item.file?.name ?? item.driveFile?.name}
                        >
                          {item.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.url}
                              alt={item.file?.name ?? item.driveFile?.name ?? 'image'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center bg-white/[.04] text-[8px] text-white/35">
                              IMG
                            </div>
                          )}
                          <span className="absolute left-0.5 top-0.5 grid h-3.5 w-3.5 place-items-center rounded border border-white/25 bg-black/70 text-[8px] text-white">
                            {isSynced ? '✓' : item.selected ? '✓' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={syncSelectedFolderImages}
                    disabled={selectedFolderFiles.length === 0 || syncingDrive}
                    className="mt-1 w-full rounded bg-[var(--accent)] px-2 py-1 text-[9px] font-semibold text-white transition hover:brightness-110 disabled:opacity-30"
                  >
                    {syncingDrive ? 'Syncing...' : `Sync selected (${selectedFolderFiles.length})`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {images.length > 0 && (
        <div className="mx-2 mt-2 flex items-center justify-between gap-2 rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[9px]">
          <div className="min-w-0 text-white/55">
            Keyframe <span className="font-semibold text-white">{selectedRenderSet.size}</span>/{images.length}
            <span className="ml-1 font-mono text-[var(--accent-2)]">{formatDuration(selectedRenderSet.size * imageDurationSec)}</span>
          </div>
          <button
            onClick={addPendingToKeyframe}
            disabled={pendingIndexes.length === 0 || !onAddToKeyframe}
            className="shrink-0 rounded bg-[var(--accent)] px-2 py-0.5 font-semibold text-white disabled:opacity-30"
          >
            Add to Keyframe ({pendingIndexes.length})
          </button>
        </div>
      )}
      {images.length === 0 && filteredFolders.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="m-2 grid h-20 w-[calc(100%-1rem)] place-items-center rounded-md border border-dashed border-white/20 bg-white/[.02] text-center transition hover:border-[var(--accent)]/60 hover:bg-white/[.04]"
        >
          <div>
            <div className="text-xl opacity-50">📤</div>
            <div className="mt-0.5 text-[10px] text-white/60">Drop images here</div>
            <div className="text-[9px] text-white/40">PNG · JPG · WebP</div>
          </div>
        </button>
      ) : (
        <div className="grid max-h-32 grid-cols-6 gap-1 overflow-y-auto p-2">
          {images.map((img, i) => {
            const renderSelected = selectedRenderSet.has(i);
            const pending = pendingSet.has(i);
            return (
              <div
                key={i}
                className={`group relative aspect-square cursor-pointer overflow-hidden rounded-md ring-1 transition ${
                  i === selectedIndex
                    ? 'ring-[var(--accent)] ring-2 shadow-[0_0_0_1px_rgba(99,102,241,0.35)]'
                    : pending
                    ? 'ring-sky-300/70 ring-2'
                    : renderSelected
                    ? 'ring-emerald-400/50'
                    : 'ring-white/10 hover:ring-white/30'
                }`}
                onClick={() => togglePendingImage(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.file.name}
                  className="h-full w-full object-cover"
                />
              {(renderSelected || pending) && (
                <div className={`absolute left-0.5 top-0.5 grid h-3.5 w-3.5 place-items-center rounded text-[8px] font-bold text-white ${
                  pending ? 'bg-sky-500/90' : 'bg-emerald-500/85'
                }`}>
                  ✓
                </div>
              )}
              {renderSelected && (
                <div className="absolute left-0.5 top-4 rounded bg-black/70 px-1 py-0.5 font-mono text-[6px] text-emerald-100">
                  {imageDurationSec}s
                </div>
              )}
              {img.sourceKind === 'drive' && (
                <div className="absolute right-4 top-0.5 rounded bg-black/70 px-1 py-0.5 text-[6px] font-semibold uppercase tracking-wide text-cyan-100 ring-1 ring-cyan-300/30">
                  {img.cacheStatus === 'cached' ? 'cached' : 'downloaded'}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1 py-0.5">
                <div className="truncate font-mono text-[7px] text-white/85">
                  {String(i + 1).padStart(2, '0')}
                </div>
                {img.sourceFolder && (
                  <div className="truncate text-[6px] text-white/45">{img.sourceFolder}</div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(i);
                }}
                className="absolute right-0.5 top-0.5 grid h-3 w-3 place-items-center rounded-full bg-black/60 text-[8px] text-white opacity-0 hover:bg-rose-500 group-hover:opacity-100"
              >
                ×
              </button>
            </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function fileKey(file: File) {
  const relativePath = 'webkitRelativePath' in file ? file.webkitRelativePath : '';
  return `${relativePath || file.name}:${file.size}:${file.lastModified}`;
}

function imageSyncKey(image: LibraryImage) {
  return image.driveFileId ? `drive:${image.driveFileId}` : fileKey(image.file);
}

function sourceFolderName(file: File) {
  const relativePath = 'webkitRelativePath' in file ? file.webkitRelativePath : '';
  const [folderName] = relativePath.split(/[\\/]/);
  return folderName || undefined;
}

async function readImageFilesFromDirectory(directoryHandle: any): Promise<File[]> {
  const files: File[] = [];
  const walk = async (handle: any) => {
    for await (const entry of handle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        if (file.type.startsWith('image/')) files.push(file);
      } else if (entry.kind === 'directory') {
        await walk(entry);
      }
    }
  };
  await walk(directoryHandle);
  return files;
}

function folderId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'local-folder';
}

function driveErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('API key') || message.includes('developer key') || message.includes('key')) {
    return 'Google Drive API key is invalid or Drive API is not enabled. Check NEXT_PUBLIC_GOOGLE_API_KEY restrictions and try again.';
  }
  if (message.includes('public') || message.includes('403') || message.includes('404')) {
    return message;
  }
  return message;
}

function formatDuration(totalSec: number) {
  const safe = Math.max(0, Math.round(totalSec));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainMinutes = minutes % 60;
    return `${hours}h${String(remainMinutes).padStart(2, '0')}m`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

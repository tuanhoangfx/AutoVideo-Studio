'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckSquare, ChevronRight, Cloud, Folder, FolderOpen, HardDrive, Search, Square } from 'lucide-react';
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
  relativePath?: string;
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

type FileWithRelativePath = File & { relativePath?: string };

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
  const [workspaceQuery, setWorkspaceQuery] = useState('');
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
    () => filterWorkspaces(folders, sourceFilter, workspaceQuery),
    [folders, sourceFilter, workspaceQuery]
  );
  const activeFolder =
    filteredFolders.find((folder) => folder.id === activeFolderId) ?? filteredFolders[0] ?? null;
  const selectedWorkspaceFiles = useMemo(
    () =>
      filteredFolders.flatMap((folder) =>
        folder.files
          .filter((item) => item.selected && !syncedKeys.has(item.id))
          .map((item) => ({ folder, item }))
      ),
    [filteredFolders, syncedKeys]
  );

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
            relativePath: relativePathOf(file) || file.name,
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
    const folderValues = parseDriveFolderInputs(publicDriveInput);
    if (folderValues.length === 0) {
      setFolderError({ message: 'Paste one or more public Google Drive folder links or IDs before loading.', canRetry: false });
      setPublicDriveOpen(true);
      return;
    }

    setDriveBusy(true);
    try {
      const loadedBuckets: FolderBucket[] = [];
      for (const folderValue of folderValues) {
        const folder = await getPublicDriveFolder(folderValue);
        const driveFiles = await listDriveFolderImages(folder.id);
        loadedBuckets.push({
          id: `drive:${folder.id}`,
          name: folder.name,
          source: 'drive',
          driveFolderId: folder.id,
          files: driveFiles.map((file) => ({
            id: `drive:${file.id}`,
            driveFile: file,
            relativePath: file.relativePath ?? `Images/${file.name}`,
            url: file.thumbnailLink ?? '',
            selected: false,
          })),
        });
      }

      setFolders((prev) => {
        const loadedIds = new Set(loadedBuckets.map((folder) => folder.id));
        const next = prev.filter((item) => !loadedIds.has(item.id));
        next.push(...loadedBuckets);
        setActiveFolderId(loadedBuckets[0]?.id ?? next[0]?.id ?? null);
        return next;
      });
      setSourceFilter('all');
      setPublicDriveOpen(false);
      setDriveNotice(
        loadedBuckets.length === 1
          ? `Loaded ${loadedBuckets[0].files.length} Drive images from ${loadedBuckets[0].name}.`
          : `Loaded ${loadedBuckets.length} Drive workspaces.`
      );
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

  const setFolderSelectionByPrefix = (folderIdValue: string, prefix: string, selected: boolean) => {
    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === folderIdValue
          ? {
              ...folder,
              files: folder.files.map((item) => {
                const path = displayFolderPath(folder, item);
                if ((path !== prefix && !path.startsWith(`${prefix}/`)) || syncedKeys.has(item.id)) return item;
                return { ...item, selected };
              }),
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

  const syncSelectedWorkspaceImages = async () => {
    if (selectedWorkspaceFiles.length === 0) return;
    setFolderError(null);
    setSyncingDrive(true);
    try {
      const syncedItems: LibraryImageInput[] = await Promise.all(
        selectedWorkspaceFiles.map(async ({ folder, item }) => {
          if (folder.source === 'local') {
            if (!item.file) throw new Error('Missing local image file.');
            return {
              file: item.file,
              sourceKind: 'local',
              sourceFolder: displaySourceFolder(folder, item),
            };
          }
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
            sourceFolder: displaySourceFolder(folder, item),
            driveFolderId: folder.driveFolderId,
            driveFileId: item.driveFile.id,
            thumbnailUrl: item.driveFile.thumbnailLink,
            cacheStatus,
          };
        })
      );
      onAdd(syncedItems);
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
    <section className="flex h-full min-h-0 flex-col">
      <div className="mx-1 mt-1 flex shrink-0 flex-wrap items-center justify-between gap-1.5 rounded-xl border border-white/10 bg-black/10 px-2 py-1">
        <div className="flex items-center gap-1" role="group" aria-label="Image source filters">
          {(['all', 'local', 'drive'] as const).map((source) => (
            <button
              key={source}
              onClick={() => setSourceFilter(source)}
              className={`rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
                sourceFilter === source
                  ? 'border-indigo-300/35 bg-indigo-500/20 text-indigo-100'
                  : 'border-white/10 bg-white/[.03] text-white/55 hover:bg-white/[.06] hover:text-white'
              }`}
            >
              {source === 'all' ? 'All' : source === 'local' ? 'Local' : 'Drive'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => inputRef.current?.click()} className="hub-filter-chip">
            + Upload
          </button>
          <button onClick={() => setFolderConfirmOpen(true)} className="hub-filter-chip">
            + Folder
          </button>
          <button
            onClick={() => setPublicDriveOpen((open) => !open)}
            disabled={driveBusy || !googleDriveConfigured()}
            className="hub-filter-chip disabled:cursor-not-allowed disabled:opacity-35"
            title={googleDriveConfigured() ? 'Paste a public Google Drive folder link' : googleDriveConfigHint()}
          >
            {driveBusy ? 'Drive...' : '+ Drive'}
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
        <div className="mx-1 mt-1 shrink-0 rounded-xl border border-indigo-300/20 bg-indigo-500/10 p-2 text-[10px] text-indigo-50 shadow-lg shadow-black/20">
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
          className="mx-1 mt-1 shrink-0 rounded-xl border border-white/10 bg-white/[.03] p-2"
          onSubmit={(e) => {
            e.preventDefault();
            void addDriveFolder();
          }}
        >
          <div className="mb-1 text-[9px] text-white/45">
            Paste one or many public Drive folder links. Separate by new line, comma, or space.
          </div>
          <div className="grid gap-1">
            <textarea
              value={publicDriveInput}
              onChange={(e) => setPublicDriveInput(e.target.value)}
              rows={3}
              placeholder="https://drive.google.com/drive/folders/...&#10;https://drive.google.com/drive/folders/..."
              className="min-h-16 resize-none rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-[10px] text-white/75 outline-none placeholder:text-white/25 focus:border-[var(--accent)]/60"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={clearDriveCache}
                className="hub-filter-chip"
              >
                Clear cache
              </button>
              <button
                type="submit"
                disabled={driveBusy || !publicDriveInput.trim()}
                className="hub-filter-chip active disabled:cursor-not-allowed disabled:opacity-35"
              >
                {driveBusy ? 'Loading...' : `Load ${parseDriveFolderInputs(publicDriveInput).length || ''}`}
              </button>
            </div>
          </div>
        </form>
      )}
      {driveNotice && (
        <div className="mx-1 mt-1 shrink-0 rounded border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[9px] text-emerald-100">
          {driveNotice}
        </div>
      )}
      {folderError && (
        <div className="mx-1 mt-1 shrink-0 rounded border border-rose-400/25 bg-rose-500/10 px-2 py-1 text-[9px] text-rose-100">
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
      <div className="m-1 grid min-h-0 flex-1 grid-cols-[minmax(12rem,0.72fr)_minmax(0,1fr)] gap-1.5 overflow-hidden">
        <div className="order-2 flex h-full min-w-0 flex-col rounded-xl border border-white/10 bg-black/15">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-2 py-1 text-[9px] text-white/45">
            <span className="font-semibold uppercase tracking-[0.14em]">Library</span>
            {images.length > 0 ? (
              <span>
                Keyframe <span className="font-semibold text-white">{selectedRenderSet.size}</span>/{images.length}
                <span className="ml-1 font-mono text-[var(--accent-2)]">{formatDuration(selectedRenderSet.size * imageDurationSec)}</span>
              </span>
            ) : null}
          </div>
          {images.length === 0 ? (
            <button
              onClick={() => inputRef.current?.click()}
              className="grid min-h-0 flex-1 place-items-center rounded-b-xl border border-dashed border-transparent bg-white/[.02] text-center transition hover:border-[var(--accent)]/60 hover:bg-white/[.04]"
            >
              <div>
                <div className="text-xl opacity-50">📤</div>
                <div className="mt-0.5 text-[10px] text-white/60">Drop images here</div>
                <div className="text-[9px] text-white/40">PNG · JPG · WebP</div>
              </div>
            </button>
          ) : (
            <>
              <div className="grid min-h-0 flex-1 grid-cols-6 content-start gap-1 overflow-y-auto p-1.5">
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
                      <img src={img.url} alt={img.file.name} className="h-full w-full object-cover" />
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
                        <div className="truncate font-mono text-[7px] text-white/85">{String(i + 1).padStart(2, '0')}</div>
                        {img.sourceFolder && <div className="truncate text-[6px] text-white/45">{img.sourceFolder}</div>}
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
              <div className="shrink-0 border-t border-white/10 p-1">
                <button
                  onClick={addPendingToKeyframe}
                  disabled={pendingIndexes.length === 0 || !onAddToKeyframe}
                  className="w-full rounded bg-[var(--accent)] px-2 py-1 text-[9px] font-semibold text-white disabled:opacity-30"
                >
                  Add to Keyframe ({pendingIndexes.length})
                </button>
              </div>
            </>
          )}
        </div>

        <div className="order-1 flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-black/20">
          <div className="shrink-0 border-b border-white/10 p-1">
            <label className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[9px] text-white/45">
              <Search size={11} />
              <input
                value={workspaceQuery}
                onChange={(event) => setWorkspaceQuery(event.target.value)}
                placeholder="Search workspace, folder..."
                className="min-w-0 flex-1 bg-transparent text-[10px] text-white/70 outline-none placeholder:text-white/25"
              />
            </label>
          </div>
          {filteredFolders.length === 0 ? (
            <div className="grid min-h-0 flex-1 place-items-center px-3 text-center text-[10px] leading-5 text-white/35">
              Folder workspace will appear here after importing a local folder or Drive folder.
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto p-1">
                {filteredFolders.map((folder) => {
                  const selectedCount = folder.files.filter((item) => item.selected && !syncedKeys.has(item.id)).length;
                  const allSelectable = folder.files.filter((item) => !syncedKeys.has(item.id)).length;
                  const checked = selectedCount > 0 && selectedCount === allSelectable;
                  return (
                    <div
                      key={folder.id}
                      className={`group mb-1 rounded-lg border transition ${
                        activeFolder?.id === folder.id
                          ? 'border-[var(--accent)]/45 bg-[var(--accent)]/10'
                          : 'border-white/5 bg-white/[.02] hover:bg-white/[.04]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => setFolderSelection(folder.id, !checked)}
                          className="grid h-4 w-4 place-items-center rounded text-white/55 hover:text-white"
                          title={checked ? 'Unselect workspace' : 'Select workspace'}
                        >
                          {checked ? <CheckSquare size={13} className="text-emerald-200" /> : <Square size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveFolderId(folder.id)}
                          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                        >
                          <ChevronRight size={11} className="text-white/25" />
                          {folder.source === 'drive' ? (
                            <Cloud size={12} className="text-cyan-200" />
                          ) : (
                            <HardDrive size={12} className="text-indigo-200" />
                          )}
                          <FolderOpen size={13} className="text-amber-200/85" />
                          <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-white/85">{folder.name}</span>
                          <span className="font-mono text-[9px] text-white/35">{folder.files.length}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFolder(folder.id)}
                          className="text-[8px] text-white/30 opacity-0 hover:text-rose-200 group-hover:opacity-100"
                        >
                          remove
                        </button>
                      </div>
                      <div className="ml-8 border-l border-white/10 pb-1 pl-2">
                        {workspaceTree(folder, workspaceQuery).map((node) => (
                          <WorkspaceTreeNode
                            key={node.path}
                            node={node}
                            folder={folder}
                            syncedKeys={syncedKeys}
                            onSelectFolder={setFolderSelectionByPrefix}
                          />
                        ))}
                      </div>
                      <div className="border-t border-white/5 px-2 py-1 text-[8px] text-white/35">
                        {selectedCount} selected · {allSelectable} available
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="shrink-0 border-t border-white/10 p-1">
                <button
                  onClick={syncSelectedWorkspaceImages}
                  disabled={selectedWorkspaceFiles.length === 0 || syncingDrive}
                  className="w-full rounded-lg bg-[var(--accent)] px-2 py-1.5 text-[9px] font-semibold text-white transition hover:brightness-110 disabled:opacity-30"
                >
                  {syncingDrive ? 'Syncing...' : `Sync selected folders (${selectedWorkspaceFiles.length})`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

type WorkspaceTreeNodeData = {
  path: string;
  name: string;
  children: WorkspaceTreeNodeData[];
  files: FolderImage[];
};

function WorkspaceTreeNode({
  node,
  folder,
  syncedKeys,
  onSelectFolder,
}: {
  node: WorkspaceTreeNodeData;
  folder: FolderBucket;
  syncedKeys: Set<string>;
  onSelectFolder: (folderIdValue: string, prefix: string, selected: boolean) => void;
}) {
  const allFiles = flattenTreeFiles(node);
  const selectedFiles = allFiles.filter((file) => file.selected && !syncedKeys.has(file.id)).length;
  const selectableFiles = allFiles.filter((file) => !syncedKeys.has(file.id)).length;
  const folderChecked = selectableFiles > 0 && selectedFiles === selectableFiles;

  return (
    <div>
      <div className="flex items-center gap-1 rounded px-1 py-0.5 text-[9px] text-white/60 hover:bg-white/[.04]">
        <button
          type="button"
          onClick={() => onSelectFolder(folder.id, node.path, !folderChecked)}
          className="grid h-3.5 w-3.5 place-items-center text-white/45 hover:text-white"
          title={folderChecked ? 'Unselect folder' : 'Select folder'}
        >
          {folderChecked ? <CheckSquare size={11} className="text-emerald-200" /> : <Square size={11} />}
        </button>
        <Folder size={11} className="text-amber-200/80" />
        <span className="min-w-0 flex-1 truncate font-semibold text-white/70">{node.name}</span>
        <span className="font-mono text-[8px] text-white/30">{selectableFiles}</span>
        {selectedFiles > 0 ? <span className="rounded bg-emerald-400/10 px-1 text-[7px] text-emerald-100">{selectedFiles}</span> : null}
      </div>
      {node.children.length > 0 ? (
        <div className="ml-3 border-l border-white/10 pl-1">
          {node.children.map((child) => (
            <WorkspaceTreeNode
              key={child.path}
              node={child}
              folder={folder}
              syncedKeys={syncedKeys}
              onSelectFolder={onSelectFolder}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function fileKey(file: File) {
  const relativePath = relativePathOf(file);
  return `${relativePath || file.name}:${file.size}:${file.lastModified}`;
}

function imageSyncKey(image: LibraryImage) {
  return image.driveFileId ? `drive:${image.driveFileId}` : fileKey(image.file);
}

function sourceFolderName(file: File) {
  const relativePath = relativePathOf(file);
  const [folderName] = relativePath.split(/[\\/]/);
  return folderName || undefined;
}

async function readImageFilesFromDirectory(directoryHandle: any): Promise<FileWithRelativePath[]> {
  const files: FileWithRelativePath[] = [];
  const walk = async (handle: any, parts: string[]) => {
    for await (const entry of handle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        if (file.type.startsWith('image/')) files.push(attachRelativePath(file, [...parts, file.name].join('/')));
      } else if (entry.kind === 'directory') {
        await walk(entry, [...parts, entry.name]);
      }
    }
  };
  await walk(directoryHandle, [directoryHandle.name || 'Local folder']);
  return files;
}

function attachRelativePath(file: File, relativePath: string): FileWithRelativePath {
  const next = file as FileWithRelativePath;
  try {
    Object.defineProperty(next, 'relativePath', { value: relativePath, configurable: true });
  } catch {
    next.relativePath = relativePath;
  }
  return next;
}

function relativePathOf(file: File) {
  const browserPath = 'webkitRelativePath' in file ? file.webkitRelativePath : '';
  return browserPath || (file as FileWithRelativePath).relativePath || '';
}

function parseDriveFolderInputs(input: string) {
  return input
    .split(/[\s,]+/g)
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);
}

function filterWorkspaces(folders: FolderBucket[], sourceFilter: 'all' | 'local' | 'drive', query: string) {
  const normalized = query.trim().toLowerCase();
  return folders.filter((folder) => {
    if (sourceFilter !== 'all' && folder.source !== sourceFilter) return false;
    if (!normalized) return true;
    if (folder.name.toLowerCase().includes(normalized)) return true;
    return folder.files.some((item) =>
      `${item.relativePath ?? ''} ${item.file?.name ?? ''} ${item.driveFile?.name ?? ''}`.toLowerCase().includes(normalized)
    );
  });
}

function workspaceTree(folder: FolderBucket, query: string): WorkspaceTreeNodeData[] {
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
        const isLeaf = index === segments.length - 1;
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

function displayFolderSegments(folder: FolderBucket, item: FolderImage) {
  const parts = displayPathSegments(folder, item);
  if (parts.length <= 1) return ['Images'];
  return parts.slice(0, -1);
}

function displayFolderPath(folder: FolderBucket, item: FolderImage) {
  return displayFolderSegments(folder, item).join('/');
}

function displayPathSegments(folder: FolderBucket, item: FolderImage) {
  const rawPath = item.relativePath || item.file?.name || item.driveFile?.name || 'image';
  const parts = rawPath.split(/[\\/]/).filter(Boolean);
  if (parts[0] === folder.name) return parts.slice(1);
  return parts;
}

function flattenTreeFiles(node: WorkspaceTreeNodeData): FolderImage[] {
  return [...node.files, ...node.children.flatMap((child) => flattenTreeFiles(child))];
}

function displaySourceFolder(folder: FolderBucket, item: FolderImage) {
  const parts = displayPathSegments(folder, item);
  if (parts.length <= 1) return folder.name;
  return `${folder.name}/${parts.slice(0, -1).join('/')}`;
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

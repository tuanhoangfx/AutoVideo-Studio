'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Cloud, FolderPlus, ListChecks, Search, Trash2, Upload } from 'lucide-react';
import {
  StudioToolbarButton,
  StudioToolbarGroup,
  StudioToolbarRow,
  StudioToolbarSearch,
  TOOLBAR_ROW,
} from './StudioToolbar';
import {
  downloadDriveImage,
  getPublicDriveFolder,
  googleDriveConfigured,
  googleDriveConfigHint,
  listDriveFolderImages,
} from '@/lib/google-drive';
import { clearCachedDriveImages, loadCachedDriveImage, saveCachedDriveImage } from '@/lib/drive-cache';

import type { LibraryImage, LibraryImageInput } from '@/types/studio';

export type { LibraryImage, LibraryImageInput } from '@/types/studio';

import { LAST_LOCAL_FOLDER_ID_KEY, LIBRARY_SOURCE_FILTERS } from './image-library/constants';
import type { FolderBucket, FolderError } from './image-library/types';
import { DriveImportPanels } from './image-library/DriveImportPanels';
import { FolderPanel } from './image-library/FolderPanel';
import { ImageGridPanel } from './image-library/ImageGridPanel';
import {
  displayFolderPath,
  displaySourceFolder,
  driveErrorMessage,
  fileKey,
  filterWorkspaces,
  folderId,
  imageSyncKey,
  parseDriveFolderInputs,
  readImageFilesFromDirectory,
  relativePathOf,
  sourceFolderName,
} from './image-library/utils';

// moved to `image-library/*`

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
  const lastClickIndexRef = useRef<number | null>(null);
  const sweepSelectRef = useRef<{
    active: boolean;
    anchor: number | null;
    pointerIndex: number | null;
    selecting: boolean;
    additive: boolean;
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    moved: boolean;
  }>({
    active: false,
    anchor: null,
    pointerIndex: null,
    selecting: true,
    additive: false,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    moved: false,
  });
  const [lastLocalFolderId, setLastLocalFolderId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return window.localStorage.getItem(LAST_LOCAL_FOLDER_ID_KEY) ?? '';
    } catch {
      return '';
    }
  });

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
  const visibleLibraryEntries = useMemo(
    () =>
      images
        .map((img, index) => ({ img, index }))
        .filter(({ img }) => {
          if (sourceFilter === 'all') return true;
          return (img.sourceKind ?? 'local') === sourceFilter;
        }),
    [images, sourceFilter]
  );
  const visibleIndexSet = useMemo(
    () => new Set(visibleLibraryEntries.map((entry) => entry.index)),
    [visibleLibraryEntries]
  );
  const visiblePendingCount = useMemo(
    () => pendingIndexes.filter((index) => visibleIndexSet.has(index)).length,
    [pendingIndexes, visibleIndexSet]
  );
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

  const pendingDotClass =
    pendingIndexes.length === 0
      ? 'bg-slate-400/70'
      : pendingIndexes.length < 20
      ? 'bg-amber-400'
      : pendingIndexes.length < 50
      ? 'bg-cyan-400'
      : 'bg-violet-400';

  const addFolders = (files: FileList | File[] | null, fallbackFolderName = 'Local folder') => {
    if (!files) return;
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const grouped = new Map<string, File[]>();
    imageFiles.forEach((file) => {
      const folderName = sourceFolderName(file) ?? fallbackFolderName;
      grouped.set(folderName, [...(grouped.get(folderName) ?? []), file]);
    });

    let selectedId: string | null = null;
    setFolders((prev) => {
      const next = [...prev];
      grouped.forEach((groupFiles, name) => {
        const bucketId = folderId(name);
        selectedId = bucketId;
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
    if (selectedId) {
      setLastLocalFolderId(selectedId);
      try {
        window.localStorage.setItem(LAST_LOCAL_FOLDER_ID_KEY, selectedId);
      } catch {}
    }
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  useEffect(() => {
    if (sourceFilter !== 'local') return;
    if (!lastLocalFolderId) return;
    if (filteredFolders.some((f) => f.id === lastLocalFolderId)) {
      setActiveFolderId(lastLocalFolderId);
    }
  }, [filteredFolders, lastLocalFolderId, sourceFilter]);

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

  const togglePendingImage = useCallback(
    (index: number, additive = false) => {
      setPendingIndexes((prev) => {
        const has = prev.includes(index);
        if (additive) return has ? prev.filter((item) => item !== index) : [...prev, index];
        return has ? prev.filter((item) => item !== index) : [...prev, index];
      });
      onSelect(index);
    },
    [onSelect]
  );

  const applySweepRange = useCallback(
    (from: number, to: number, selecting: boolean, additive: boolean) => {
      const start = Math.max(0, Math.min(from, to));
      const end = Math.min(images.length - 1, Math.max(from, to));
      const range = Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
      setPendingIndexes((prev) => {
        const next = new Set(additive ? prev : []);
        if (selecting) {
          range.forEach((idx) => next.add(idx));
        } else if (additive) {
          range.forEach((idx) => next.delete(idx));
        } else {
          prev.forEach((idx) => next.add(idx));
          range.forEach((idx) => next.delete(idx));
        }
        return [...next].sort((a, b) => a - b);
      });
      onSelect(range[range.length - 1] ?? 0);
    },
    [images.length, onSelect]
  );

  const startLibrarySweep = useCallback(
    (index: number, event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }) => {
      const additive = event.ctrlKey || event.metaKey || event.shiftKey;
      const selecting = event.shiftKey ? true : !pendingSet.has(index);
      const anchor = event.shiftKey && lastClickIndexRef.current != null ? lastClickIndexRef.current : index;
      sweepSelectRef.current = {
        active: true,
        anchor,
        pointerIndex: index,
        selecting,
        additive,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        moved: false,
      };
    },
    [pendingSet]
  );

  const updateLibrarySweep = useCallback(
    (index: number) => {
      const sweep = sweepSelectRef.current;
      if (!sweep.active || sweep.anchor == null) return;
      if (index === sweep.pointerIndex && !sweep.moved) return;
      sweep.moved = true;
      applySweepRange(sweep.anchor, index, sweep.selecting, sweep.additive);
    },
    [applySweepRange]
  );

  const finishLibrarySweep = useCallback(() => {
    const sweep = sweepSelectRef.current;
    if (!sweep.active) return;

    if (!sweep.moved && sweep.pointerIndex != null) {
      const index = sweep.pointerIndex;
      if (sweep.shiftKey && lastClickIndexRef.current != null) {
        applySweepRange(lastClickIndexRef.current, index, true, true);
      } else {
        togglePendingImage(index, sweep.ctrlKey || sweep.metaKey);
      }
      lastClickIndexRef.current = index;
    }

    sweepSelectRef.current = {
      active: false,
      anchor: null,
      pointerIndex: null,
      selecting: true,
      additive: false,
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
      moved: false,
    };
  }, [applySweepRange, togglePendingImage]);

  useEffect(() => {
    window.addEventListener('mouseup', finishLibrarySweep);
    return () => window.removeEventListener('mouseup', finishLibrarySweep);
  }, [finishLibrarySweep]);

  const allVisibleSelected =
    visibleLibraryEntries.length > 0 &&
    visibleLibraryEntries.every((entry) => pendingSet.has(entry.index));

  const toggleSelectAllPending = () => {
    const visible = visibleLibraryEntries.map((entry) => entry.index);
    if (visible.length === 0) return;
    if (allVisibleSelected) {
      setPendingIndexes((prev) => prev.filter((index) => !visible.includes(index)));
      return;
    }
    setPendingIndexes((prev) => [...new Set([...prev, ...visible])].sort((a, b) => a - b));
  };

  const addPendingToKeyframe = () => {
    const next = pendingIndexes.filter((index) => index >= 0 && index < images.length);
    if (next.length === 0) return;
    onAddToKeyframe?.(next);
    setPendingIndexes([]);
  };

  const deletePendingFromLibrary = () => {
    const next = pendingIndexes.filter((index) => index >= 0 && index < images.length);
    if (next.length === 0) return;
    next
      .slice()
      .sort((a, b) => b - a)
      .forEach((idx) => onRemove(idx));
    setPendingIndexes([]);
  };

  return (
    <section className="flex h-full min-h-0 flex-col">
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
      <DriveImportPanels
        folderConfirmOpen={folderConfirmOpen}
        onCloseFolderConfirm={() => setFolderConfirmOpen(false)}
        onOpenFolderPicker={() => void openFolderPicker()}
        publicDriveOpen={publicDriveOpen}
        publicDriveInput={publicDriveInput}
        onPublicDriveInputChange={setPublicDriveInput}
        onSubmitDrive={() => void addDriveFolder()}
        onClearDriveCache={() => void clearDriveCache()}
        driveBusy={driveBusy}
        driveNotice={driveNotice}
        folderError={folderError}
        onDismissFolderError={() => setFolderError(null)}
        onRetryDrive={() => void addDriveFolder()}
      />
      <div className="m-1 grid min-h-0 flex-1 grid-cols-[minmax(12rem,0.72fr)_minmax(0,1fr)] grid-rows-[auto_auto_minmax(0,1fr)] gap-x-1.5 gap-y-1 overflow-hidden">
        {/* Row 1 â€” Workspace: import only */}
        <StudioToolbarRow className="col-start-1 row-start-1 shrink-0" aria-label="Import to workspace">
          <StudioToolbarGroup>
            <StudioToolbarButton
              tone="indigo"
              icon={Upload}
              onClick={() => inputRef.current?.click()}
              title="Upload image files"
            >
              Upload
            </StudioToolbarButton>
            <StudioToolbarButton
              tone="amber"
              icon={FolderPlus}
              onClick={() => setFolderConfirmOpen(true)}
              title="Import a local folder"
            >
              Folder
            </StudioToolbarButton>
            <StudioToolbarButton
              tone="cyan"
              icon={Cloud}
              onClick={() => setPublicDriveOpen((open) => !open)}
              disabled={driveBusy || !googleDriveConfigured()}
              title={googleDriveConfigured() ? 'Import from Google Drive' : googleDriveConfigHint()}
            >
              {driveBusy ? 'Driveâ€¦' : 'Drive'}
            </StudioToolbarButton>
          </StudioToolbarGroup>
        </StudioToolbarRow>

        {/* Row 1 â€” Library: source filter only */}
        <StudioToolbarRow className="col-start-2 row-start-1 shrink-0" aria-label="Library source">
          <StudioToolbarGroup>
            {LIBRARY_SOURCE_FILTERS.map((source) => {
              const active = sourceFilter === source.id;
              return (
                <StudioToolbarButton
                  key={source.id}
                  tone="neutral"
                  active={active}
                  icon={source.icon}
                  iconClassName={active ? 'text-white' : source.iconClass}
                  onClick={() => setSourceFilter(source.id)}
                  title={
                    source.id === 'all'
                      ? 'All images in library'
                      : source.id === 'local'
                      ? 'Local files only'
                      : 'Google Drive imports only'
                  }
                >
                  {source.label}
                </StudioToolbarButton>
              );
            })}
          </StudioToolbarGroup>
        </StudioToolbarRow>

        {/* Row 2 â€” Workspace: search only */}
        <StudioToolbarRow className="col-start-1 row-start-2 shrink-0 min-w-0">
          <StudioToolbarSearch
            value={workspaceQuery}
            onChange={setWorkspaceQuery}
            placeholder="Search workspace, folder..."
            icon={<Search size={12} strokeWidth={2.25} />}
          />
        </StudioToolbarRow>

        {/* Row 2 â€” Library: select / delete only */}
        <div className={`col-start-2 row-start-2 flex shrink-0 min-w-0 items-center gap-1 ${TOOLBAR_ROW}`}>
          <StudioToolbarGroup className="min-w-0 flex-1">
            <StudioToolbarButton
              tone="sky"
              active={allVisibleSelected}
              icon={ListChecks}
              onClick={toggleSelectAllPending}
              disabled={visibleLibraryEntries.length === 0}
              title={
                visibleLibraryEntries.length === 0
                  ? 'No images for this source'
                  : allVisibleSelected
                  ? 'Deselect all visible images'
                  : 'Select all visible images'
              }
            >
              {allVisibleSelected ? 'Deselect' : 'Select all'}
            </StudioToolbarButton>
            <StudioToolbarButton
              tone="rose"
              icon={Trash2}
              onClick={deletePendingFromLibrary}
              disabled={images.length === 0 || pendingIndexes.length === 0}
              title={images.length === 0 ? 'No images yet' : 'Delete selected images from library'}
            >
              Delete ({pendingIndexes.length})
            </StudioToolbarButton>
          </StudioToolbarGroup>
          <span className="inline-flex shrink-0 items-center gap-1 px-1 text-[10px] text-white/60">
            <span className={`h-1.5 w-1.5 rounded-full ${pendingDotClass}`} />
            <span className="font-mono tabular-nums text-white/70" title="Selected / visible (total in library)">
              {visiblePendingCount}/{visibleLibraryEntries.length}
              {sourceFilter !== 'all' && visibleLibraryEntries.length !== images.length ? (
                <span className="text-white/35"> Â· {images.length}</span>
              ) : null}
            </span>
          </span>
        </div>

        <div className="col-start-2 row-start-3 flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-black/15">
          <ImageGridPanel
            images={images}
            visibleLibraryEntries={visibleLibraryEntries}
            sourceFilter={sourceFilter}
            selectedIndex={selectedIndex}
            selectedRenderSet={selectedRenderSet}
            pendingSet={pendingSet}
            pendingIndexes={pendingIndexes}
            canAddToKeyframe={Boolean(onAddToKeyframe)}
            onUploadClick={() => inputRef.current?.click()}
            onAddToKeyframe={addPendingToKeyframe}
            onTogglePending={(index, additive) => {
              togglePendingImage(index, additive);
              lastClickIndexRef.current = index;
            }}
            onStartSweep={startLibrarySweep}
            onUpdateSweep={updateLibrarySweep}
          />
        </div>

        <FolderPanel
          filteredFolders={filteredFolders}
          activeFolderId={activeFolder?.id ?? activeFolderId}
          workspaceQuery={workspaceQuery}
          syncedKeys={syncedKeys}
          selectedWorkspaceCount={selectedWorkspaceFiles.length}
          syncingDrive={syncingDrive}
          onSetActiveFolderId={setActiveFolderId}
          onRemoveFolder={removeFolder}
          onSelectFolderPrefix={setFolderSelectionByPrefix}
          onSyncSelected={() => void syncSelectedWorkspaceImages()}
        />
      </div>
    </section>
  );
}

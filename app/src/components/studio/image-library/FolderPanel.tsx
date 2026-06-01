'use client';

import { ChevronRight, Cloud, FolderOpen, FolderPlus, HardDrive, RefreshCw, Upload } from 'lucide-react';
import { StudioToolbarButton } from '../StudioToolbar';
import { WorkspaceTreeNode } from './WorkspaceTreeNode';
import type { FolderBucket } from './types';
import { workspaceTree } from './utils';

export function FolderPanel({
  filteredFolders,
  activeFolderId,
  workspaceQuery,
  syncedKeys,
  selectedWorkspaceCount,
  syncingDrive,
  onSetActiveFolderId,
  onRemoveFolder,
  onSelectFolderPrefix,
  onSyncSelected,
}: {
  filteredFolders: FolderBucket[];
  activeFolderId: string | null;
  workspaceQuery: string;
  syncedKeys: Set<string>;
  selectedWorkspaceCount: number;
  syncingDrive: boolean;
  onSetActiveFolderId: (id: string) => void;
  onRemoveFolder: (id: string) => void;
  onSelectFolderPrefix: (folderId: string, prefix: string, selected: boolean) => void;
  onSyncSelected: () => void;
}) {
  return (
    <div className="col-start-1 row-start-3 flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-black/20">
      {filteredFolders.length === 0 ? (
        <div className="grid min-h-0 flex-1 place-content-center gap-2 px-3 py-4 text-center text-[10px] leading-5 text-white/35">
          <div className="mx-auto flex items-center justify-center gap-2 text-white/25">
            <FolderPlus size={16} />
            <Cloud size={16} />
            <Upload size={16} />
          </div>
          <p>Use Upload, Folder, or Drive above to add images to the workspace, then sync into the library.</p>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto p-1">
            {filteredFolders.map((folder) => {
              const selectedCount = folder.files.filter((item) => item.selected && !syncedKeys.has(item.id)).length;
              const allSelectable = folder.files.filter((item) => !syncedKeys.has(item.id)).length;
              return (
                <div
                  key={folder.id}
                  className={`group mb-1 rounded-lg border transition ${
                    activeFolderId === folder.id
                      ? 'border-[var(--accent)]/45 bg-[var(--accent)]/10'
                      : 'border-white/5 bg-white/[.02] hover:bg-white/[.04]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => onSetActiveFolderId(folder.id)}
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
                      onClick={() => onRemoveFolder(folder.id)}
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
                        onSelectFolder={onSelectFolderPrefix}
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
            <StudioToolbarButton
              tone="emerald"
              icon={RefreshCw}
              className="w-full"
              onClick={onSyncSelected}
              disabled={selectedWorkspaceCount === 0 || syncingDrive}
            >
              {syncingDrive ? 'Syncing...' : `Sync selected (${selectedWorkspaceCount})`}
            </StudioToolbarButton>
          </div>
        </>
      )}
    </div>
  );
}

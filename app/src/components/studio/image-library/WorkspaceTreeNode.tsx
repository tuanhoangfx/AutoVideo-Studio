'use client';

import { CheckSquare, Folder, Square } from 'lucide-react';
import type { FolderBucket, WorkspaceTreeNodeData } from './types';
import { flattenTreeFiles } from './utils';

export function WorkspaceTreeNode({
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
        {selectedFiles > 0 ? (
          <span className="rounded bg-emerald-400/10 px-1 text-[7px] text-emerald-100">{selectedFiles}</span>
        ) : null}
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

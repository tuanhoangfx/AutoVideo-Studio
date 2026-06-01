'use client';

import { Cloud, FolderPlus, X } from 'lucide-react';
import { googleDriveConfigured, googleDriveConfigHint } from '@/lib/google-drive';
import { StudioToolbarButton } from '../StudioToolbar';
import { parseDriveFolderInputs } from './utils';
import type { FolderError } from './types';

export function DriveImportPanels({
  folderConfirmOpen,
  onCloseFolderConfirm,
  onOpenFolderPicker,
  publicDriveOpen,
  publicDriveInput,
  onPublicDriveInputChange,
  onSubmitDrive,
  onClearDriveCache,
  driveBusy,
  driveNotice,
  folderError,
  onDismissFolderError,
  onRetryDrive,
}: {
  folderConfirmOpen: boolean;
  onCloseFolderConfirm: () => void;
  onOpenFolderPicker: () => void;
  publicDriveOpen: boolean;
  publicDriveInput: string;
  onPublicDriveInputChange: (value: string) => void;
  onSubmitDrive: () => void;
  onClearDriveCache: () => void;
  driveBusy: boolean;
  driveNotice: string | null;
  folderError: FolderError | null;
  onDismissFolderError: () => void;
  onRetryDrive: () => void;
}) {
  return (
    <>
      {folderConfirmOpen && (
        <div className="mx-1 mt-1 shrink-0 rounded-xl border border-indigo-300/20 bg-indigo-500/10 p-2 text-[10px] text-indigo-50 shadow-lg shadow-black/20">
          <div className="font-semibold text-white">Import local folder?</div>
          <div className="mt-0.5 text-white/55">
            AutoVideo will scan image files only, then show them inside Image Library for review before adding to Keyframe.
          </div>
          <div className="mt-2 flex items-center justify-end gap-1">
            <StudioToolbarButton tone="neutral" icon={X} grow={false} onClick={onCloseFolderConfirm}>
              Cancel
            </StudioToolbarButton>
            <StudioToolbarButton tone="amber" icon={FolderPlus} grow={false} onClick={onOpenFolderPicker}>
              Import folder
            </StudioToolbarButton>
          </div>
        </div>
      )}
      {publicDriveOpen && (
        <form
          className="mx-1 mt-1 shrink-0 rounded-xl border border-white/10 bg-white/[.03] p-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitDrive();
          }}
        >
          <div className="mb-1 text-[9px] text-white/45">
            Paste one or many public Drive folder links. Separate by new line, comma, or space.
          </div>
          <div className="grid gap-1">
            <textarea
              value={publicDriveInput}
              onChange={(e) => onPublicDriveInputChange(e.target.value)}
              rows={3}
              placeholder="https://drive.google.com/drive/folders/...&#10;https://drive.google.com/drive/folders/..."
              className="min-h-16 resize-none rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-[10px] text-white/75 outline-none placeholder:text-white/25 focus:border-[var(--accent)]/60"
            />
            <div className="flex justify-end gap-1">
              <StudioToolbarButton type="button" tone="neutral" grow={false} onClick={onClearDriveCache}>
                Clear cache
              </StudioToolbarButton>
              <StudioToolbarButton
                type="submit"
                tone="cyan"
                icon={Cloud}
                grow={false}
                disabled={driveBusy || !publicDriveInput.trim()}
              >
                {driveBusy ? 'Loading...' : `Load ${parseDriveFolderInputs(publicDriveInput).length || ''}`}
              </StudioToolbarButton>
            </div>
          </div>
          {!googleDriveConfigured() ? (
            <div className="mt-1 text-[9px] text-amber-200/80">{googleDriveConfigHint()}</div>
          ) : null}
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
                type="button"
                onClick={onRetryDrive}
                disabled={driveBusy}
                className="rounded bg-white/10 px-1.5 py-0.5 font-semibold text-white hover:bg-white/15 disabled:opacity-40"
              >
                Retry
              </button>
            )}
            <button type="button" onClick={onDismissFolderError} className="text-white/55 hover:text-white">
              hide
            </button>
          </div>
        </div>
      )}
    </>
  );
}

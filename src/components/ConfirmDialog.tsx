"use client";

import { useEffect, useRef } from "react";

export function ConfirmDialog({
  title,
  onCancel,
  onConfirm,
}: {
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const keepRef = useRef<HTMLButtonElement>(null);
  useEffect(() => keepRef.current?.focus(), []);

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 grid place-items-center bg-backdrop/50 p-[18px]"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[440px] flex-col gap-3.5 rounded-lg border border-divider bg-surface p-[22px] shadow-dialog"
      >
        <div id="confirm-title" className="font-heading text-[22px] font-semibold">
          Delete this page?
        </div>
        <div className="text-sm opacity-85">
          &ldquo;{title}&rdquo; will be removed from your journal. This can&apos;t be undone.
        </div>
        <div className="mt-1.5 flex justify-end gap-[9px]">
          <button
            ref={keepRef}
            onClick={onCancel}
            className="rounded border border-divider px-4 py-[9px] font-heading text-sm font-semibold hover:bg-ink/[.07]"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            className="rounded border border-accent px-4 py-[9px] font-heading text-sm font-semibold text-accent-700 hover:bg-accent/[.12]"
          >
            Delete page
          </button>
        </div>
      </div>
    </div>
  );
}

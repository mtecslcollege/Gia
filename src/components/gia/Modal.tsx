import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-navy-deep/60" onClick={onClose} />
      <div role="dialog" aria-label={title} className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-display text-lg font-bold text-primary">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 overflow-y-auto px-5 py-4">{children}</div>
        <div className="flex justify-end gap-2 border-t px-5 py-3">{footer}</div>
      </div>
    </div>
  );
}

export const btnPrimary = "inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50";
export const btnGhost = "inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted";

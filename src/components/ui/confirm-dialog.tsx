"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Extra context — the appointment being cancelled, for example. */
  detail?: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  isPending?: boolean;
  /** Styles the confirm button as destructive. Defaults to true. */
  destructive?: boolean;
}

/**
 * Replaces the browser's native confirm(), which can't be styled and looks like a security
 * warning on a phone. Used anywhere an action can't be undone.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  detail,
  confirmLabel,
  cancelLabel,
  onConfirm,
  isPending = false,
  destructive = true,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <div className="flex flex-col items-center px-2 pt-2 text-center">
          <div
            className={
              destructive
                ? "bg-destructive/10 flex size-14 items-center justify-center rounded-full"
                : "bg-accent flex size-14 items-center justify-center rounded-full"
            }
          >
            <AlertTriangle className={destructive ? "text-destructive size-6" : "text-plum size-6"} />
          </div>
          <h2 className="font-heading mt-5 text-2xl font-medium">{title}</h2>
          {description && <p className="text-muted-foreground mt-2 text-sm">{description}</p>}
          {detail && <div className="bg-secondary/60 mt-5 w-full rounded-lg p-4 text-left">{detail}</div>}
        </div>

        <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            className="h-12 w-full sm:w-auto sm:px-8"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            className="h-12 w-full sm:w-auto sm:px-8"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

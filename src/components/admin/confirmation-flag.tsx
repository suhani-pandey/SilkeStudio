import { MessageSquareWarning } from "lucide-react";
import type { ConfirmationStatus } from "@/lib/database.types";

/**
 * Marks a booking whose customer was never sent a confirmation, so the owner knows to reach them
 * herself. Bookings she made by phone have no status and never show it.
 */
export function needsConfirmationFollowUp(status: ConfirmationStatus | null | undefined): boolean {
  return status === "failed" || status === "unavailable";
}

export function ConfirmationFlag({
  status,
  guestName,
}: {
  status: ConfirmationStatus | null | undefined;
  guestName: string;
}) {
  if (!needsConfirmationFollowUp(status)) return null;

  const first = guestName.split(" ")[0] || guestName;
  return (
    <p className="surface-selected mt-2 flex w-fit items-start gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium">
      <MessageSquareWarning className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        {status === "failed"
          ? `Confirmation didn't send — call or text ${first} to confirm.`
          : `No confirmation sent (texts and email are off) — call or text ${first} to confirm.`}
      </span>
    </p>
  );
}

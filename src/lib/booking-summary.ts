import type { Fulfilment } from "@/lib/database.types";
import type { ConfirmationSummary } from "@/lib/confirmation-status";

export interface BookingSummary {
  serviceNames: string[];
  totalPrice: number;
  durationMinutes: number;
  startAtISO: string;
  guestName: string;
  reference: string;
  /** Alterations left for collection read differently on the confirmation screen. */
  fulfilment?: Fulfilment;
  /** Whether a confirmation message actually went out, so the screen can say so. */
  confirmation?: ConfirmationSummary;
}

import type { Fulfilment } from "@/lib/database.types";

export interface BookingSummary {
  serviceNames: string[];
  totalPrice: number;
  durationMinutes: number;
  startAtISO: string;
  guestName: string;
  reference: string;
  /** Alterations left for collection read differently on the confirmation screen. */
  fulfilment?: Fulfilment;
}

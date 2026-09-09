export interface BookingSummary {
  serviceNames: string[];
  totalPrice: number;
  durationMinutes: number;
  startAtISO: string;
  guestName: string;
  reference: string;
}

import type { ConfirmationStatus } from "@/lib/database.types";

/**
 * How each channel went: true = accepted by the provider, false = tried and failed,
 * null = not tried (switched off, or no address for it).
 */
export interface ChannelOutcome {
  sms: boolean | null;
  email: boolean | null;
}

/** One successful channel is enough — the customer has been told. */
export function confirmationStatus({ sms, email }: ChannelOutcome): ConfirmationStatus {
  if (sms === null && email === null) return "unavailable";
  if (sms === true || email === true) return "sent";
  return "failed";
}

/** What the confirmation screen shows the customer. */
export interface ConfirmationSummary {
  status: ConfirmationStatus;
  /** Where the email went, when it went — shown back so a typo is noticed straight away. */
  email?: string;
  byText: boolean;
}

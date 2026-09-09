import type { Metadata } from "next";
import { BusinessHoursForm } from "@/components/admin/business-hours-form";
import { AvailabilityBlocksManager } from "@/components/admin/availability-blocks-manager";
import { RecurringTimeOffManager } from "@/components/admin/recurring-time-off-manager";
import { PushToggle } from "@/components/admin/push-toggle";
import {
  listBusinessHours,
  listAvailabilityBlocks,
  listRecurringTimeOff,
} from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Availability" };

export default async function AdminAvailabilityPage() {
  const [hours, blocks, recurring] = await Promise.all([
    listBusinessHours(),
    listAvailabilityBlocks(),
    listRecurringTimeOff(),
  ]);

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <div>
        <h1 className="font-heading text-3xl font-medium">Availability</h1>
        <p className="text-muted-foreground mt-1">
          Set your weekly hours and block off the time you&apos;re not available.
        </p>
      </div>

      {vapidKey && (
        <section>
          <h2 className="font-heading mb-2 text-xl font-medium">Booking alerts</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Get a notification on this phone the moment someone books, even with the app closed.
          </p>
          <PushToggle vapidKey={vapidKey} />
        </section>
      )}

      <section>
        <h2 className="font-heading mb-4 text-xl font-medium">Weekly hours</h2>
        <BusinessHoursForm initialHours={hours} />
      </section>

      <section>
        <h2 className="font-heading mb-1 text-xl font-medium">Repeating time off</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Commitments that happen every week — entered once, applied to every future week.
        </p>
        <RecurringTimeOffManager initialBlocks={recurring} />
      </section>

      <section>
        <h2 className="font-heading mb-1 text-xl font-medium">One-off time off</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Block specific hours on a specific date — 2–3pm on Monday, 10–12 next Thursday — or the
          whole day. Blocked time turns red on the calendar and disappears from customer booking.
        </p>
        <AvailabilityBlocksManager initialBlocks={blocks} />
      </section>
    </div>
  );
}

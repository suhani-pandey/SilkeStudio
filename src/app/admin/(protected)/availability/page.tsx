import type { Metadata } from "next";
import { BusinessHoursForm } from "@/components/admin/business-hours-form";
import { AvailabilityBlocksManager } from "@/components/admin/availability-blocks-manager";
import { listBusinessHours, listAvailabilityBlocks } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Availability" };

export default async function AdminAvailabilityPage() {
  const [hours, blocks] = await Promise.all([listBusinessHours(), listAvailabilityBlocks()]);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Availability</h1>
        <p className="text-muted-foreground mt-1">Set your weekly hours and block off time when you&apos;re unavailable.</p>
      </div>

      <section>
        <h2 className="font-heading mb-4 text-xl font-semibold">Weekly hours</h2>
        <BusinessHoursForm initialHours={hours} />
      </section>

      <section>
        <h2 className="font-heading mb-4 text-xl font-semibold">Time off / other work</h2>
        <AvailabilityBlocksManager initialBlocks={blocks} />
      </section>
    </div>
  );
}

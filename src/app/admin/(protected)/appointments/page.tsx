import Link from "next/link";
import type { Metadata } from "next";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentsTable } from "@/components/admin/appointments-table";
import { listAppointments } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Appointments" };

export default async function AdminAppointmentsPage() {
  const appointments = await listAppointments();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Appointments</h1>
        <Button asChild>
          <Link href="/admin/appointments/new">
            <CalendarPlus className="size-4" />
            New appointment
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <AppointmentsTable appointments={appointments} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { DesignsManager } from "@/components/admin/designs-manager";
import { listNailDesigns, listAllServices } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Nail designs" };

export default async function AdminDesignsPage() {
  const [designs, services] = await Promise.all([listNailDesigns(), listAllServices()]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-3xl font-medium">Nail designs</h1>
      <p className="text-muted-foreground mt-1">
        Photos of your own work. Customers browse these, save the ones they like, and bring their
        pick to the appointment.
      </p>
      <div className="mt-8">
        <DesignsManager
          initialDesigns={designs}
          services={services.filter((service) => service.service_line !== "tailoring")}
        />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { ServicesManager } from "@/components/admin/services-manager";
import { listAllServices } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Services" };

export default async function AdminServicesPage() {
  const services = await listAllServices();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Services</h1>
      <p className="text-muted-foreground mt-1">
        Manage what customers see and book on the website.
      </p>
      <div className="mt-6">
        <ServicesManager initialServices={services} />
      </div>
    </div>
  );
}

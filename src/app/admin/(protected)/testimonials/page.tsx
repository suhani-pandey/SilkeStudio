import type { Metadata } from "next";
import { TestimonialsManager } from "@/components/admin/testimonials-manager";
import { listTestimonials } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminTestimonialsPage() {
  const testimonials = await listTestimonials();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading text-3xl font-medium">Reviews</h1>
      <p className="text-muted-foreground mt-1">
        Real words from real clients. Ask permission first, and only add reviews you actually
        received — the home page shows these as genuine.
      </p>
      <div className="mt-6">
        <TestimonialsManager initial={testimonials} />
      </div>
    </div>
  );
}

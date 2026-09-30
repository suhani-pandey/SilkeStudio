import { Ban, Clock, Phone, Receipt } from "lucide-react";
import { businessInfo } from "@/lib/business-info";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * The house rules, in the same words wherever a customer meets them — before they confirm, and
 * again once they're booked. The full version is on the terms page.
 */
export function BookingPolicy({ t }: { t: Dictionary["policy"] }) {
  const points = [
    { icon: Phone, text: t.trouble },
    { icon: Clock, text: t.late },
    { icon: Ban, text: t.cancel },
    { icon: Receipt, text: t.payment },
  ];

  return (
    <section
      aria-labelledby="booking-policy-title"
      className="bg-secondary/50 rounded-lg p-5 text-left"
    >
      <h2 id="booking-policy-title" className="eyebrow">
        {t.title}
      </h2>
      <ul className="mt-4 space-y-3">
        {points.map(({ icon: Icon, text }) => (
          <li key={text} className="flex gap-3 text-sm leading-relaxed">
            <Icon className="text-copper-deep mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{text}</span>
          </li>
        ))}
      </ul>
      <a
        href={businessInfo.phoneHref}
        className="text-clay mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium"
      >
        <Phone className="size-4" aria-hidden />
        {t.call} {businessInfo.phone}
      </a>
    </section>
  );
}

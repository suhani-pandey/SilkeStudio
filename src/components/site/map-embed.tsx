"use client";

import { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Google Maps only loads when the visitor asks for it.
 *
 * An embedded map sends the visitor's IP address to Google and sets Google cookies the moment the
 * page opens, which under GDPR and the Danish cookie rules needs consent first. Until they tap,
 * nothing is requested from Google at all.
 */
export function MapEmbed({
  src,
  title,
  address,
  mapsUrl,
  t,
}: {
  src: string;
  title: string;
  address: string;
  mapsUrl: string;
  t: { show: string; notice: string; open: string };
}) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return <iframe title={title} src={src} className="size-full min-h-[380px]" loading="lazy" />;
  }

  return (
    <div className="bg-secondary/60 flex size-full min-h-[380px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="bg-accent flex size-14 items-center justify-center rounded-full">
        <MapPin className="text-clay size-6" />
      </div>
      <p className="font-medium">{address}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => setLoaded(true)} className="h-11 px-6">
          {t.show}
        </Button>
        <Button asChild variant="outline" className="h-11 px-6">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            {t.open}
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>
      <p className="text-muted-foreground max-w-xs text-xs leading-relaxed">{t.notice}</p>
    </div>
  );
}

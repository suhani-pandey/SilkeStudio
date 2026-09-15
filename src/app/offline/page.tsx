import { WifiOff } from "lucide-react";
import { businessInfo } from "@/lib/business-info";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="bg-accent flex size-16 items-center justify-center rounded-full">
        <WifiOff className="text-clay size-7" />
      </div>
      <h1 className="font-heading mt-6 text-3xl font-medium">You&apos;re offline</h1>
      <p className="text-muted-foreground mt-3 max-w-xs">
        We can&apos;t reach Silke Studio right now. Check your connection and try again — or give us
        a call and we&apos;ll book you in.
      </p>
      <a
        href={businessInfo.phoneHref}
        className="bg-primary text-primary-foreground mt-8 inline-flex min-h-12 items-center rounded-md px-8 font-medium"
      >
        {businessInfo.phone}
      </a>
    </div>
  );
}

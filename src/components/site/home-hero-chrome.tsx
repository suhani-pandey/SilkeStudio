"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Controls how the header behaves on the home page.
 *
 * `data-home` marks the home page at all; `data-home-top` marks the part of it where the hero
 * photograph is still behind the header, so the bar can be transparent there and turn solid as
 * soon as it would otherwise sit on plain background.
 *
 * The header stays sticky throughout either way — it used to be absolutely positioned here, which
 * meant it scrolled off the home page and never came back, leaving visitors with no navigation.
 */
export function HomeHeroChrome() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const isHome = pathname === "/";
    root.toggleAttribute("data-home", isHome);

    if (!isHome) {
      root.removeAttribute("data-home-top");
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      // Stay transparent until the hero has almost scrolled past the bar.
      root.toggleAttribute("data-home-top", window.scrollY < window.innerHeight - 120);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      root.removeAttribute("data-home");
      root.removeAttribute("data-home-top");
    };
  }, [pathname]);

  return null;
}

/**
 * The homepage gallery, in display order.
 *
 * Real photographs of the salon's own work come first; the remaining stock shots are filler and
 * should be dropped from this list as more real ones arrive. Put new files in
 * `public/images/gallery/` and add an entry here — nothing else needs to change.
 */
export interface GalleryImage {
  src: string;
  /** Describes the photo for screen readers and for search engines. */
  alt: string;
  /** True for photographs taken at GlowNest, false for stock placeholders. */
  real?: boolean;
  /** Gives one image the tall slot on wide screens. */
  feature?: boolean;
}

export const galleryImages: GalleryImage[] = [
  {
    src: "/images/gallery/nails-pink-bows.jpg",
    alt: "Almond gel nails with pink French tips and hand-painted bows, done at GlowNest",
    real: true,
    feature: true,
  },
  {
    src: "/images/gallery/threading-brows.jpg",
    alt: "Eyebrow threading in progress at GlowNest",
    real: true,
  },
  { src: "/images/gallery-3.jpg", alt: "Nail shaping" },
  { src: "/images/gallery-1.jpg", alt: "Manicure detail" },
  { src: "/images/gallery-2.jpg", alt: "Nail artistry" },
  { src: "/images/gallery-4.jpg", alt: "Fresh towels" },
];

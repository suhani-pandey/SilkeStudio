// Photo shown for each service category. Swap these files in /public/images to use
// the salon's own photography — filenames and crops stay the same.
const CATEGORY_IMAGES: Record<string, string> = {
  Nails: "/images/svc-nails.jpg",
  Face: "/images/svc-face.jpg",
  Hair: "/images/svc-hair.jpg",
  Body: "/images/svc-body.jpg",
};

export function categoryImage(category: string): string {
  return CATEGORY_IMAGES[category] ?? "/images/svc-brows.jpg";
}

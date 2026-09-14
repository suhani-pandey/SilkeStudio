// Photo shown for each service category. Swap these files in /public/images to use the studio's
// own photography — filenames and crops stay the same. All are free stock (Pexels licence)
// standing in until there are photographs of her own work.
const CATEGORY_IMAGES: Record<string, string> = {
  Nails: "/images/svc-nails.jpg",
  Face: "/images/svc-face.jpg",
  Hair: "/images/svc-hair.jpg",
  Body: "/images/svc-body.jpg",
  Alterations: "/images/svc-alterations.jpg",
  "Sari & occasion": "/images/svc-sari.jpg",
  Repairs: "/images/svc-repairs.jpg",
};

export function categoryImage(category: string): string {
  return CATEGORY_IMAGES[category] ?? "/images/svc-brows.jpg";
}

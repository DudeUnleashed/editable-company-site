export interface GalleryImage {
  id: number;
  caption: string | null;
  alt_text: string | null;
  position: number;
  active: boolean;
  image_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

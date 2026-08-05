import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../config";
import { logger } from "../utils/logger";
import { GalleryImage } from "../types/gallery";
import { cachedFetch } from "../utils/cache";
import "../styles/GallerySection.css";

export default function GallerySection() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await cachedFetch<GalleryImage[]>(API_ENDPOINTS.GALLERY, "gallery");
        setImages(data);
      } catch (err) {
        logger.error("Failed to load gallery:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  if (loading || images.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const navigateLightbox = (direction: -1 | 1) => {
    if (lightboxIndex === null) return;
    const newIndex = lightboxIndex + direction;
    if (newIndex >= 0 && newIndex < images.length) {
      setLightboxIndex(newIndex);
    }
  };

  return (
    <section style={{ marginBottom: "3rem" }}>
      <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>Our Work</h2>
      <div className="gallery-grid">
        {images.map((img, index) => (
          <div
            key={img.id}
            className="gallery-item"
            onClick={() => openLightbox(index)}
          >
            <img
              src={img.thumbnail_url || img.image_url || ""}
              alt={img.alt_text || img.caption || "Gallery image"}
              loading="lazy"
            />
            {img.caption && <div className="gallery-caption">{img.caption}</div>}
          </div>
        ))}
      </div>

      {lightboxIndex !== null && images[lightboxIndex] && (
        <div className="gallery-lightbox" onClick={closeLightbox}>
          <button
            className="lightbox-close"
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            aria-label="Close"
          >
            &times;
          </button>
          {lightboxIndex > 0 && (
            <button
              className="lightbox-nav lightbox-prev"
              onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
              aria-label="Previous"
            >
              &#8249;
            </button>
          )}
          <img
            src={images[lightboxIndex].image_url || ""}
            alt={images[lightboxIndex].alt_text || ""}
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxIndex < images.length - 1 && (
            <button
              className="lightbox-nav lightbox-next"
              onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
              aria-label="Next"
            >
              &#8250;
            </button>
          )}
          {images[lightboxIndex].caption && (
            <div className="lightbox-caption">{images[lightboxIndex].caption}</div>
          )}
        </div>
      )}
    </section>
  );
}

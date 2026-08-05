import React, { useState, useEffect, useRef } from "react";
import { API_ENDPOINTS } from "../../config";
import { GalleryImage } from "../../types/gallery";
import Modal from "../../components/Modal";
import { useModal } from "../../hooks/useModal";
import { useCacheInvalidation } from "../../contexts/CacheContext";
import { logger } from "../../utils/logger";
import "../../styles/AdminGallery.css";

export default function AdminGallery({ embedded = false }: { embedded?: boolean } = {}) {
  const { invalidate: invalidateCache } = useCacheInvalidation();
  const { modalState, showSuccess, showError, showConfirm, closeModal } = useModal();

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [editForm, setEditForm] = useState({ caption: "", alt_text: "", active: true });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.ADMIN_GALLERY, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(data);
    } catch (err) {
      showError("Failed to load gallery images");
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    let uploaded = 0;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("position", String(images.length + uploaded));

      try {
        const res = await fetch(API_ENDPOINTS.ADMIN_GALLERY, {
          method: "POST",
          credentials: 'include',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed to upload ${file.name}`);
        }
        uploaded++;
      } catch (err: any) {
        showError(err.message || `Failed to upload ${file.name}`);
      }
    }

    if (uploaded > 0) {
      invalidateCache("gallery");
      showSuccess(`${uploaded} image${uploaded > 1 ? "s" : ""} uploaded`);
      fetchImages();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const openEditModal = (img: GalleryImage) => {
    setEditingImage(img);
    setEditForm({
      caption: img.caption || "",
      alt_text: img.alt_text || "",
      active: img.active,
    });
  };

  const handleEditSave = async () => {
    if (!editingImage) return;
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_GALLERY_UPDATE(editingImage.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update image");
      invalidateCache("gallery");
      showSuccess("Image updated");
      setEditingImage(null);
      fetchImages();
    } catch (err: any) {
      showError(err.message || "Failed to update image");
    }
  };

  const handleDelete = (img: GalleryImage) => {
    showConfirm("Delete this image?", async () => {
      try {
        const res = await fetch(API_ENDPOINTS.ADMIN_GALLERY_UPDATE(img.id), {
          method: "DELETE",
          credentials: 'include',
        });
        if (!res.ok) throw new Error("Failed to delete image");
        invalidateCache("gallery");
        showSuccess("Image deleted");
        fetchImages();
      } catch (err: any) {
        showError(err.message || "Failed to delete image");
      }
    });
  };

  const toggleActive = async (img: GalleryImage) => {
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_GALLERY_UPDATE(img.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ active: !img.active }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      fetchImages();
    } catch (err) {
      showError("Failed to update image");
    }
  };

  const content = (
    <>
      {/* Upload Area */}
      <div
        className="gallery-upload-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleUpload(e.target.files)}
        />
        {uploading ? (
          <p>Uploading...</p>
        ) : (
          <>
            <p className="upload-icon">📷</p>
            <p>Drag & drop images here or click to browse</p>
            <p className="upload-hint">JPEG, PNG, or WebP (max 10MB each)</p>
          </>
        )}
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="loading">Loading images...</div>
      ) : images.length === 0 ? (
        <div className="loading">No images yet. Upload some photos above.</div>
      ) : (
        <div className="admin-gallery-grid">
          {images.map((img) => (
            <div
              key={img.id}
              className={`admin-gallery-item ${!img.active ? "admin-gallery-item--inactive" : ""}`}
            >
              <img
                src={img.thumbnail_url || img.image_url || ""}
                alt={img.alt_text || img.caption || "Gallery image"}
              />
              <div className="admin-gallery-overlay">
                <button onClick={() => openEditModal(img)} title="Edit">Edit</button>
                <button onClick={() => toggleActive(img)} title={img.active ? "Hide" : "Show"}>
                  {img.active ? "Hide" : "Show"}
                </button>
                <button onClick={() => handleDelete(img)} className="gallery-delete-btn" title="Delete">
                  Delete
                </button>
              </div>
              {img.caption && <div className="admin-gallery-caption">{img.caption}</div>}
              {!img.active && <div className="admin-gallery-inactive-badge">Hidden</div>}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingImage && (
        <div className="modal-overlay" onClick={() => setEditingImage(null)}>
          <div className="modal-content service-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Image</h2>
            <div className="form-group">
              <label>Caption</label>
              <input
                type="text"
                value={editForm.caption}
                onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                placeholder="Optional caption"
              />
            </div>
            <div className="form-group">
              <label>Alt Text</label>
              <input
                type="text"
                value={editForm.alt_text}
                onChange={(e) => setEditForm({ ...editForm, alt_text: e.target.value })}
                placeholder="Describe the image for accessibility"
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editForm.active}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                />
                Visible on website
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditingImage(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleEditSave}>Save</button>
            </div>
          </div>
        </div>
      )}

      <Modal {...modalState} onClose={closeModal} />
    </>
  );

  if (embedded) return content;

  return (
    <div className="admin-gallery">
      <header className="admin-header">
        <div>
          <h1>Image Gallery</h1>
          <p>Manage photos displayed on the website</p>
        </div>
      </header>
      {content}
    </div>
  );
}

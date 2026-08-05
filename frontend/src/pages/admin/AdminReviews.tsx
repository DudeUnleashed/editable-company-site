import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../../config";
import { Review } from "../../types/review";
import StarRating from "../../components/StarRating";
import Modal from "../../components/Modal";
import { useModal } from "../../hooks/useModal";
import { useCacheInvalidation } from "../../contexts/CacheContext";
import { logger } from "../../utils/logger";
import "../../styles/AdminReviews.css";

const emptyForm = {
  customer_name: "",
  content: "",
  rating: 5,
  service_category: "",
  review_date: "",
  featured: false,
  active: true,
  position: 0,
};

export default function AdminReviews({ embedded = false }: { embedded?: boolean } = {}) {
  const { invalidate: invalidateCache } = useCacheInvalidation();
  const { modalState, showSuccess, showError, showConfirm, closeModal } = useModal();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [googleUrl, setGoogleUrl] = useState("");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.ADMIN_REVIEWS, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      showError("Failed to load reviews");
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoogleUrl = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.CONTENT("settings"));
      if (!res.ok) return;
      const data = await res.json();
      const urlBlock = data.find((b: any) => b.section === "google_reviews_url");
      if (urlBlock) setGoogleUrl(urlBlock.content || "");
    } catch (err) {
      logger.error(err);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchGoogleUrl();
  }, []);

  const openCreateModal = () => {
    setEditingReview(null);
    setFormData(emptyForm);
    setIsEditModalOpen(true);
  };

  const openEditModal = (review: Review) => {
    setEditingReview(review);
    setFormData({
      customer_name: review.customer_name,
      content: review.content,
      rating: review.rating,
      service_category: review.service_category || "",
      review_date: review.review_date || "",
      featured: review.featured,
      active: review.active,
      position: review.position,
    });
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingReview
        ? API_ENDPOINTS.ADMIN_REVIEWS_UPDATE(editingReview.id)
        : API_ENDPOINTS.ADMIN_REVIEWS;
      const method = editingReview ? "PUT" : "POST";

      const payload = {
        ...formData,
        service_category: formData.service_category || null,
        review_date: formData.review_date || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save review");

      invalidateCache("reviews");
      showSuccess(editingReview ? "Review updated" : "Review created");
      setIsEditModalOpen(false);
      fetchReviews();
    } catch (err: any) {
      showError(err.message || "Failed to save review");
    }
  };

  const handleDelete = (review: Review) => {
    showConfirm(
      `Delete review from "${review.customer_name}"?`,
      async () => {
        try {
          const res = await fetch(API_ENDPOINTS.ADMIN_REVIEWS_UPDATE(review.id), {
            method: "DELETE",
            credentials: 'include',
          });
          if (!res.ok) throw new Error("Failed to delete review");
          invalidateCache("reviews");
          showSuccess("Review deleted");
          fetchReviews();
        } catch (err: any) {
          showError(err.message || "Failed to delete review");
        }
      }
    );
  };

  const content = (
    <>
      <div className="cms-services-header">
        <p>{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
        <button className="btn-primary" onClick={openCreateModal}>+ Add Review</button>
      </div>

      {loading ? (
        <div className="loading">Loading reviews...</div>
      ) : (
        <div className="reviews-table-container">
          <table className="services-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Category</th>
                <th>Featured</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className={!review.active ? "inactive-row" : ""}>
                  <td><strong>{review.customer_name}</strong></td>
                  <td><StarRating rating={review.rating} size="1rem" /></td>
                  <td>
                    <div className="review-preview">
                      {review.content.length > 80
                        ? review.content.substring(0, 80) + "..."
                        : review.content}
                    </div>
                  </td>
                  <td>
                    {review.service_category && (
                      <span className="category-badge">{review.service_category}</span>
                    )}
                  </td>
                  <td>{review.featured ? "Yes" : "No"}</td>
                  <td>
                    <span className={`status-badge ${review.active ? "active" : "inactive"}`}>
                      {review.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => openEditModal(review)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(review)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                    No reviews yet. Click "+ Add Review" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content service-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingReview ? "Edit Review" : "Add Review"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Review Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="form-group">
                  <label>Rating *</label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                  >
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Service Category</label>
                  <select
                    value={formData.service_category}
                    onChange={(e) => setFormData({ ...formData, service_category: e.target.value })}
                  >
                    <option value="">None</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="repair">Repair</option>
                    <option value="diagnostic">Diagnostic</option>
                    <option value="inspection">Inspection</option>
                    <option value="bodywork">Bodywork</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Review Date</label>
                <input
                  type="date"
                  value={formData.review_date}
                  onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  />
                  Featured review (highlighted on website)
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  Active (visible on website)
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingReview ? "Update Review" : "Add Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal {...modalState} onClose={closeModal} />
    </>
  );

  if (embedded) return content;

  return (
    <div className="admin-reviews">
      <header className="admin-header">
        <div>
          <h1>Reviews Management</h1>
          <p>Manage customer reviews displayed on the website</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          + Add Review
        </button>
      </header>
      {content}
    </div>
  );
}

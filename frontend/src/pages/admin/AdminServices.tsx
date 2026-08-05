import React, { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import { useModal } from "../../hooks/useModal";
import { API_ENDPOINTS } from "../../config";
import { Service, ServiceFormData, SERVICE_CATEGORIES } from "../../types/service";
import { logger } from "../../utils/logger";
import "../../styles/AdminServices.css";

export default function AdminServices() {
  const { modalState, showSuccess, showError, showConfirm, closeModal } = useModal();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    detailed_description: "",
    base_price: "",
    estimated_duration: "",
    category: "general",
    active: true,
  });
  const [imageUploading, setImageUploading] = useState(false);

  // Fetch services
  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.SERVICES);

      if (!res.ok) throw new Error("Failed to fetch services");

      const data = await res.json();
      setServices(data);
    } catch (error) {
      showError("Failed to load services");
      logger.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Open create/edit modal
  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      name: "",
      description: "",
      detailed_description: "",
      base_price: "",
      estimated_duration: "",
      category: "general",
      active: true,
    });
    setIsEditModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      detailed_description: service.detailed_description || "",
      base_price: service.base_price || "",
      estimated_duration: service.estimated_duration || "",
      category: service.category,
      active: service.active,
    });
    setIsEditModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        base_price: formData.base_price ? parseFloat(formData.base_price.toString()) : null,
        estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration.toString()) : null,
      };

      const url = editingService
        ? `${API_ENDPOINTS.SERVICES}/${editingService.id}`
        : API_ENDPOINTS.SERVICES;

      const method = editingService ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = "Failed to save service";
        try {
          const error = await res.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      showSuccess(editingService ? "Service updated successfully" : "Service created successfully");
      setIsEditModalOpen(false);
      fetchServices();
    } catch (error: any) {
      logger.error("Service save error:", error);
      showError(error.message || "Failed to save service");
    }
  };

  // Handle delete
  const handleDelete = async (service: Service) => {
    showConfirm(
      `Are you sure you want to delete "${service.name}"? This cannot be undone if there are no associated requests.`,
      async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.SERVICES}/${service.id}`, {
            method: "DELETE",
            credentials: 'include',
          });

          if (!res.ok) {
            let errorMessage = "Failed to delete service";
            try {
              const error = await res.json();
              errorMessage = error.error || errorMessage;
            } catch (e) {
              errorMessage = res.statusText || errorMessage;
            }
            throw new Error(errorMessage);
          }

          showSuccess("Service deleted successfully");
          fetchServices();
        } catch (error: any) {
          logger.error("Service delete error:", error);
          showError(error.message || "Failed to delete service");
        }
      }
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingService || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const fd = new FormData();
    fd.append("image", file);

    try {
      setImageUploading(true);
      const res = await fetch(`${API_ENDPOINTS.SERVICES}/${editingService.id}/image`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const updated = await res.json();
      setEditingService(updated);
      fetchServices();
      showSuccess("Image uploaded");
    } catch {
      showError("Failed to upload image");
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  };

  const handleImageDelete = async () => {
    if (!editingService) return;
    try {
      const res = await fetch(`${API_ENDPOINTS.SERVICES}/${editingService.id}/image`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      const updated = await res.json();
      setEditingService(updated);
      fetchServices();
    } catch {
      showError("Failed to remove image");
    }
  };

  // Toggle active status
  const toggleActive = async (service: Service) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.SERVICES}/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ active: !service.active }),
      });

      if (!res.ok) throw new Error("Failed to update service");

      fetchServices();
    } catch (error) {
      showError("Failed to toggle service status");
    }
  };

  return (
    <div className="admin-services">
      <header className="admin-header">
        <div>
          <h1>Service Management</h1>
          <p>Manage automotive services and pricing</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          + Add New Service
        </button>
      </header>

      {loading ? (
        <div className="loading">Loading services...</div>
      ) : (
        <div className="services-table-container">
          <table className="services-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Category</th>
                <th>Base Price</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id} className={!service.active ? "inactive-row" : ""}>
                  <td>
                    <div className="service-name">{service.name}</div>
                    {service.description && (
                      <div className="service-description">{service.description}</div>
                    )}
                  </td>
                  <td>
                    <span className="category-badge">{service.category}</span>
                  </td>
                  <td>
                    {service.base_price ? `$${parseFloat(service.base_price).toFixed(2)}` : "Quote Required"}
                  </td>
                  <td>{service.estimated_duration ? `${service.estimated_duration} min` : "-"}</td>
                  <td>
                    <button
                      className={`status-toggle ${service.active ? "active" : "inactive"}`}
                      onClick={() => toggleActive(service)}
                    >
                      {service.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => openEditModal(service)}>
                        Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(service)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content service-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingService ? "Edit Service" : "Create New Service"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Service Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Short Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Brief description shown in the quote form"
                />
              </div>

              <div className="form-group">
                <label>Detailed Description (Services Page)</label>
                <textarea
                  value={formData.detailed_description}
                  onChange={(e) => setFormData({ ...formData, detailed_description: e.target.value })}
                  rows={4}
                  placeholder="Full description shown on the public services page"
                />
              </div>

              {editingService && (
                <div className="form-group">
                  <label>Service Image</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    {editingService.service_image_url && (
                      <img
                        src={editingService.service_image_url}
                        alt={editingService.name}
                        style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4, border: "1px solid var(--border-color)" }}
                      />
                    )}
                    <label className="btn-primary" style={{ cursor: "pointer", margin: 0, fontSize: "0.85rem" }}>
                      {imageUploading ? "Uploading..." : editingService.service_image_url ? "Replace" : "Upload Image"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageUpload}
                        disabled={imageUploading}
                        style={{ display: "none" }}
                      />
                    </label>
                    {editingService.service_image_url && (
                      <button type="button" className="btn-delete" onClick={handleImageDelete} style={{ margin: 0, fontSize: "0.85rem" }}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    placeholder="Leave empty for quote-only"
                  />
                </div>

                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.estimated_duration}
                    onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  Service is active
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingService ? "Update Service" : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Modal */}
      <Modal {...modalState} onClose={closeModal} />
    </div>
  );
}

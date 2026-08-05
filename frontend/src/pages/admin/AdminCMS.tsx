import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { API_ENDPOINTS } from "../../config";
import { ContentBlock } from "../../types/content";
import { Service, ServiceFormData, SERVICE_CATEGORIES } from "../../types/service";
import RichTextEditor from "../../components/RichTextEditor";
import JsonFieldEditor from "../../components/JsonFieldEditor";
import AdminGallery from "./AdminGallery";
import AdminReviews from "./AdminReviews";
import Modal from "../../components/Modal";
import { useModal } from "../../hooks/useModal";
import { useCacheInvalidation } from "../../contexts/CacheContext";
import { logger } from "../../utils/logger";
import "../../styles/AdminCMS.css";
import "../../styles/AdminServices.css";

const SECTION_LABELS: Record<string, string> = {
  hero_title: "Hero Title",
  hero_subtitle: "Hero Subtitle",
  stats_heading: "Stats Section Heading",
  stats_items: "Stats Items",
  stats_columns: "Stats Columns Per Row",
  services_heading: "Services Heading",
  services_cards: "Service Cards",
  services_columns: "Service Cards Per Row",
  why_choose_heading: "Why Choose Us Heading",
  why_choose_items: "Why Choose Us Items",
  cta_heading: "CTA Heading",
  cta_text: "CTA Text",
  cta_button_text: "CTA Button Text",
  contact_heading: "Contact Heading",
  contact_subtext: "Contact Subtext",
  contact_phone: "Phone Number",
  contact_email: "Email Address",
  contact_address: "Address / Location",
  who_we_are_heading: "Who We Are Heading",
  who_we_are_content: "Who We Are Content",
  mission_heading: "Mission Heading",
  mission_content: "Mission Content",
  values_heading: "Values Heading",
  values_cards: "Values Cards",
  team_heading: "Team Heading",
  team_intro: "Team Introduction",
  team_cards: "Team Cards",
  certifications_heading: "Certifications Heading",
  certifications_intro: "Certifications Intro",
  certifications_items: "Certifications List",
  timeline_heading: "Timeline Heading",
  timeline_items: "Timeline Entries",
  map_embed_url: "Google Maps Embed URL",
  services_page_hero_title: "Services Page — Hero Title",
  services_page_hero_subtitle: "Services Page — Hero Subtitle",
  services_page_intro: "Services Page — Introduction",
  tab_title: "Browser Tab Title",
  tab_description: "Browser Tab Description (SEO)",
  color_accent: "Accent Colour (buttons, links, highlights)",
  color_hero: "Hero Banner Colour",
  color_footer: "Footer Background Colour",
  business_name: "Business Name",
  business_description: "Business Description",
  business_hours: "Business Hours",
  google_reviews_url: "Google Reviews URL",
  quote_received_subject: "Customer Confirmation — Subject",
  quote_received_body: "Customer Confirmation — Body",
  quote_received_company_subject: "Company Notification — Subject",
  quote_received_company_body: "Company Notification — Body",
  job_completed_subject: "Job Completed — Subject",
  job_completed_body: "Job Completed — Body",
};

type ActiveTab = "home" | "about" | "services_page" | "services" | "gallery" | "reviews" | "settings" | "emails";

export default function AdminCMS() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { invalidate: invalidateCache } = useCacheInvalidation();
  const { modalState, showSuccess, showError, showConfirm, closeModal } = useModal();

  const validTabs: ActiveTab[] = ["home", "about", "services_page", "services", "gallery", "reviews", "settings", "emails"];
  const tabFromUrl = searchParams.get("tab") as ActiveTab | null;
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "home";

  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [editedBlocks, setEditedBlocks] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTabState] = useState<ActiveTab>(initialTab);

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    searchParams.delete("tab");
    setSearchParams(searchParams, { replace: true });
  };

  // Favicon state
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [faviconUploading, setFaviconUploading] = useState(false);

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoUploading, setLogoUploading] = useState(false);

  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceFormData>({
    name: "",
    description: "",
    detailed_description: "",
    base_price: "",
    estimated_duration: "",
    category: "general",
    active: true,
  });
  const [serviceImageUploading, setServiceImageUploading] = useState(false);

  // Content block fetching
  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.ADMIN_CONTENT, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch content");
      const data = await res.json();
      setBlocks(data);
      setEditedBlocks({});
      const faviconBlock = data.find((b: ContentBlock) => b.page === "settings" && b.section === "favicon");
      setFaviconUrl(faviconBlock?.content || "");
      const logoBlock = data.find((b: ContentBlock) => b.page === "settings" && b.section === "logo");
      setLogoUrl(logoBlock?.content || "");
    } catch (err) {
      showError("Failed to load content blocks");
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("favicon", file);

    try {
      setFaviconUploading(true);
      const res = await fetch(API_ENDPOINTS.ADMIN_FAVICON, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      setFaviconUrl(data.favicon_url);
      invalidateCache();
      showSuccess("Favicon updated");
    } catch (err: any) {
      showError(err.message || "Failed to upload favicon");
    } finally {
      setFaviconUploading(false);
      e.target.value = "";
    }
  };

  const handleFaviconDelete = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_FAVICON, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete favicon");
      setFaviconUrl("");
      invalidateCache();
      showSuccess("Favicon removed");
    } catch {
      showError("Failed to remove favicon");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    try {
      setLogoUploading(true);
      const res = await fetch(API_ENDPOINTS.ADMIN_LOGO, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      setLogoUrl(data.logo_url);
      invalidateCache();
      showSuccess("Logo updated");
    } catch (err: any) {
      showError(err.message || "Failed to upload logo");
    } finally {
      setLogoUploading(false);
      e.target.value = "";
    }
  };

  const handleLogoDelete = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_LOGO, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete logo");
      setLogoUrl("");
      invalidateCache();
      showSuccess("Logo removed");
    } catch {
      showError("Failed to remove logo");
    }
  };

  // Services fetching
  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      const res = await fetch(API_ENDPOINTS.SERVICES);
      if (!res.ok) throw new Error("Failed to fetch services");
      setServices(await res.json());
    } catch (err) {
      showError("Failed to load services");
      logger.error(err);
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
    fetchServices();
  }, []);

  const pageBlocks = blocks
    .filter((b) => b.page === activeTab && b.section !== "favicon" && b.section !== "logo")
    .sort((a, b) => a.position - b.position);

  const hasChanges = Object.keys(editedBlocks).length > 0;

  const handleContentChange = (blockId: number, newContent: string) => {
    setEditedBlocks((prev) => ({ ...prev, [blockId]: newContent }));
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      setSaving(true);
      const updates = Object.entries(editedBlocks).map(([id, content]) => ({
        id: parseInt(id),
        content,
      }));

      const res = await fetch(API_ENDPOINTS.ADMIN_CONTENT_BULK, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ blocks: updates }),
      });

      if (!res.ok) throw new Error("Failed to save changes");

      invalidateCache("content");
      showSuccess("Content saved successfully");
      await fetchBlocks();
    } catch (err) {
      showError("Failed to save changes");
      logger.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setEditedBlocks({});
  };

  const getCurrentContent = (block: ContentBlock): string => {
    return editedBlocks[block.id] !== undefined
      ? editedBlocks[block.id]
      : block.content || "";
  };

  const renderEditor = (block: ContentBlock) => {
    const currentContent = getCurrentContent(block);

    switch (block.content_type) {
      case "html":
        return (
          <RichTextEditor
            key={`${block.id}-${block.updated_at}`}
            content={currentContent}
            onChange={(html) => handleContentChange(block.id, html)}
          />
        );
      case "json":
        return (
          <JsonFieldEditor
            value={currentContent}
            onChange={(json) => handleContentChange(block.id, json)}
            section={block.section}
          />
        );
      default:
        if (block.section.startsWith("color_")) {
          return (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <input
                type="color"
                value={currentContent || "#000000"}
                onChange={(e) => handleContentChange(block.id, e.target.value)}
                style={{ width: 40, height: 36, border: "1px solid var(--border-color)", borderRadius: 4, padding: 2, cursor: "pointer" }}
              />
              <input
                type="text"
                value={currentContent}
                onChange={(e) => handleContentChange(block.id, e.target.value)}
                className="cms-text-input"
                style={{ maxWidth: 140, fontFamily: "monospace" }}
                placeholder="#000000"
              />
            </div>
          );
        }
        if (currentContent.length > 80) {
          return (
            <textarea
              value={currentContent}
              onChange={(e) => handleContentChange(block.id, e.target.value)}
              rows={3}
              className="cms-text-input"
            />
          );
        }
        return (
          <input
            type="text"
            value={currentContent}
            onChange={(e) => handleContentChange(block.id, e.target.value)}
            className="cms-text-input"
          />
        );
    }
  };

  // Service CRUD
  const openCreateService = () => {
    setEditingService(null);
    setServiceForm({ name: "", description: "", detailed_description: "", base_price: "", estimated_duration: "", category: "general", active: true });
    setIsServiceModalOpen(true);
  };

  const openEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || "",
      detailed_description: service.detailed_description || "",
      base_price: service.base_price || "",
      estimated_duration: service.estimated_duration || "",
      category: service.category,
      active: service.active,
    });
    setIsServiceModalOpen(true);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...serviceForm,
        base_price: serviceForm.base_price ? parseFloat(serviceForm.base_price.toString()) : null,
        estimated_duration: serviceForm.estimated_duration ? parseInt(serviceForm.estimated_duration.toString()) : null,
      };

      const url = editingService
        ? `${API_ENDPOINTS.SERVICES}/${editingService.id}`
        : API_ENDPOINTS.SERVICES;

      const res = await fetch(url, {
        method: editingService ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Failed to save service";
        try { const err = await res.json(); msg = err.error || msg; } catch {}
        throw new Error(msg);
      }

      showSuccess(editingService ? "Service updated" : "Service created");
      setIsServiceModalOpen(false);
      fetchServices();
    } catch (err: any) {
      showError(err.message || "Failed to save service");
    }
  };

  const handleDeleteService = (service: Service) => {
    showConfirm(
      `Are you sure you want to delete "${service.name}"?`,
      async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.SERVICES}/${service.id}`, {
            method: "DELETE",
            credentials: 'include',
          });
          if (!res.ok) {
            let msg = "Failed to delete service";
            try { const err = await res.json(); msg = err.error || msg; } catch {}
            throw new Error(msg);
          }
          showSuccess("Service deleted");
          fetchServices();
        } catch (err: any) {
          showError(err.message || "Failed to delete service");
        }
      }
    );
  };

  const toggleServiceActive = async (service: Service) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.SERVICES}/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ active: !service.active }),
      });
      if (!res.ok) throw new Error("Failed to update service");
      fetchServices();
    } catch {
      showError("Failed to toggle service status");
    }
  };

  const renderContentTab = () => (
    <>
      {loading ? (
        <div className="loading">Loading content...</div>
      ) : (
        <div className="cms-sections">
          {pageBlocks.map((block) => (
            <div
              key={block.id}
              className={`cms-section ${editedBlocks[block.id] !== undefined ? "cms-section--modified" : ""}`}
            >
              <label className="cms-section-label">
                {SECTION_LABELS[block.section] || block.section}
                <span className="cms-section-type">{block.content_type}</span>
              </label>
              {renderEditor(block)}
            </div>
          ))}

          {activeTab === "services_page" && (
            <div className="cms-info-note">
              Service descriptions, images, and pricing are managed in the{" "}
              <button
                className="cms-info-note-link"
                onClick={() => setActiveTab("services")}
              >
                Services
              </button>{" "}
              tab. Edit each service to add a detailed description and image for the public services page.
            </div>
          )}

          {activeTab === "settings" && (
            <div className="cms-section">
              <label className="cms-section-label">
                Favicon
                <span className="cms-section-type">image</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                {faviconUrl && (
                  <img
                    src={faviconUrl}
                    alt="Current favicon"
                    style={{ width: 32, height: 32, objectFit: "contain", border: "1px solid var(--border-color-light)", borderRadius: 4, padding: 2 }}
                  />
                )}
                <label className="btn-primary" style={{ cursor: "pointer", margin: 0 }}>
                  {faviconUploading ? "Uploading..." : faviconUrl ? "Replace" : "Upload Favicon"}
                  <input
                    type="file"
                    accept=".ico,.png,.svg,image/x-icon,image/png,image/svg+xml"
                    onChange={handleFaviconUpload}
                    disabled={faviconUploading}
                    style={{ display: "none" }}
                  />
                </label>
                {faviconUrl && (
                  <button className="btn-delete" onClick={handleFaviconDelete} style={{ margin: 0 }}>
                    Remove
                  </button>
                )}
                {!faviconUrl && (
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    ICO, PNG, or SVG — recommended 32x32px
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="cms-section">
              <label className="cms-section-label">
                Navbar Logo
                <span className="cms-section-type">image</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Current logo"
                    style={{ height: 40, objectFit: "contain", border: "1px solid var(--border-color-light)", borderRadius: 4, padding: 2 }}
                  />
                )}
                <label className="btn-primary" style={{ cursor: "pointer", margin: 0 }}>
                  {logoUploading ? "Uploading..." : logoUrl ? "Replace" : "Upload Logo"}
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    disabled={logoUploading}
                    style={{ display: "none" }}
                  />
                </label>
                {logoUrl && (
                  <button className="btn-delete" onClick={handleLogoDelete} style={{ margin: 0 }}>
                    Remove
                  </button>
                )}
                {!logoUrl && (
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    PNG, JPG, SVG, or WebP — displayed in center of navbar
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === "home" && (
            <div className="cms-info-note">
              Phone, email, and address are managed in the{" "}
              <button
                className="cms-info-note-link"
                onClick={() => setActiveTab("settings")}
              >
                Business Info
              </button>{" "}
              tab and are shared across the site (footer, contact section, etc.).
            </div>
          )}

          {activeTab === "emails" && (
            <div className="cms-info-note" style={{ whiteSpace: "normal" }}>
              <strong>Available variables</strong> (use in subject or body):<br />
              <code style={{ fontSize: "0.8rem", lineHeight: "2" }}>
                {"{{customer_name}} {{customer_email}} {{customer_phone}} {{request_id}} {{service_name}} {{service_base_price}} {{car_type}} {{rego_or_vin}} {{notes}} {{admin_notes}} {{quoted_price}} {{scheduled_start}} {{scheduled_end}} {{assigned_technician}} {{completed_at}} {{created_at}} {{company_name}} {{company_email}}"}
              </code>
              <br />
              <small>Body templates use raw HTML with inline styles for email client compatibility.</small>
            </div>
          )}
        </div>
      )}

      {hasChanges && (
        <div className="cms-save-bar">
          <span>You have unsaved changes</span>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      )}
    </>
  );

  const renderServicesTab = () => (
    <div className="cms-services-tab">
      <div className="cms-services-header">
        <p>{services.length} service{services.length !== 1 ? "s" : ""} configured</p>
        <button className="btn-primary" onClick={openCreateService}>+ Add Service</button>
      </div>

      {servicesLoading ? (
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
                  <td><span className="category-badge">{service.category}</span></td>
                  <td>{service.base_price ? `$${Number(service.base_price).toFixed(2)}` : "Quote Required"}</td>
                  <td>{service.estimated_duration ? `${service.estimated_duration} min` : "-"}</td>
                  <td>
                    <button
                      className={`status-toggle ${service.active ? "active" : "inactive"}`}
                      onClick={() => toggleServiceActive(service)}
                    >
                      {service.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => openEditService(service)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDeleteService(service)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isServiceModalOpen && (
        <div className="modal-overlay" onClick={() => setIsServiceModalOpen(false)}>
          <div className="modal-content service-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingService ? "Edit Service" : "Create New Service"}</h2>
            <form onSubmit={handleServiceSubmit}>
              <div className="form-group">
                <label>Service Name *</label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Short Description</label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  rows={2}
                  placeholder="Brief description shown in the quote form"
                />
              </div>
              <div className="form-group">
                <label>Detailed Description (Services Page)</label>
                <textarea
                  value={serviceForm.detailed_description}
                  onChange={(e) => setServiceForm({ ...serviceForm, detailed_description: e.target.value })}
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
                      {serviceImageUploading ? "Uploading..." : editingService.service_image_url ? "Replace" : "Upload Image"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={async (e) => {
                          if (!editingService || !e.target.files?.[0]) return;
                          const fd = new FormData();
                          fd.append("image", e.target.files[0]);
                          try {
                            setServiceImageUploading(true);
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
                            setServiceImageUploading(false);
                            e.target.value = "";
                          }
                        }}
                        disabled={serviceImageUploading}
                        style={{ display: "none" }}
                      />
                    </label>
                    {editingService.service_image_url && (
                      <button
                        type="button"
                        className="btn-delete"
                        style={{ margin: 0, fontSize: "0.85rem" }}
                        onClick={async () => {
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
                        }}
                      >
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
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
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
                    value={serviceForm.base_price}
                    onChange={(e) => setServiceForm({ ...serviceForm, base_price: e.target.value })}
                    placeholder="Leave empty for quote-only"
                  />
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={serviceForm.estimated_duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, estimated_duration: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={serviceForm.active}
                    onChange={(e) => setServiceForm({ ...serviceForm, active: e.target.checked })}
                  />
                  Service is active and visible to customers
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsServiceModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editingService ? "Update Service" : "Create Service"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-cms">
      <header className="admin-header">
        <div>
          <h1>Content Management</h1>
          <p>Edit website pages, content, and services</p>
        </div>
        {(activeTab === "home" || activeTab === "about" || activeTab === "services_page" || activeTab === "settings") && (
          <div className="cms-actions">
            {hasChanges && (
              <button className="btn-cancel" onClick={handleDiscard}>
                Discard Changes
              </button>
            )}
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </header>

      <div className="cms-tabs">
        <button
          className={`cms-tab ${activeTab === "home" ? "active" : ""}`}
          onClick={() => setActiveTab("home")}
        >
          Home Page
        </button>
        <button
          className={`cms-tab ${activeTab === "about" ? "active" : ""}`}
          onClick={() => setActiveTab("about")}
        >
          About Page
        </button>
        <button
          className={`cms-tab ${activeTab === "services_page" ? "active" : ""}`}
          onClick={() => setActiveTab("services_page")}
        >
          Services Page
        </button>
        <button
          className={`cms-tab ${activeTab === "services" ? "active" : ""}`}
          onClick={() => setActiveTab("services")}
        >
          Services
        </button>
        <button
          className={`cms-tab ${activeTab === "gallery" ? "active" : ""}`}
          onClick={() => setActiveTab("gallery")}
        >
          Gallery
        </button>
        <button
          className={`cms-tab ${activeTab === "reviews" ? "active" : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews
        </button>
        <button
          className={`cms-tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Business Info
        </button>
        <button
          className={`cms-tab ${activeTab === "emails" ? "active" : ""}`}
          onClick={() => setActiveTab("emails")}
        >
          Emails
        </button>
      </div>

      {activeTab === "home" || activeTab === "about" || activeTab === "services_page" || activeTab === "settings" || activeTab === "emails" ? renderContentTab() : null}
      {activeTab === "services" ? renderServicesTab() : null}
      {activeTab === "gallery" ? <AdminGallery embedded /> : null}
      {activeTab === "reviews" ? <AdminReviews embedded /> : null}

      <Modal {...modalState} onClose={closeModal} />
    </div>
  );
}

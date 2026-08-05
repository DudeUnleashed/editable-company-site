import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/AdminDashboard.css";
import ServiceRequestExpandedRow, { ServiceRequestData } from "../../components/ServiceRequestExpandedRow";
import ConvertToJobModal, { JobData } from "../../components/ConvertToJobModal";
import { API_ENDPOINTS } from "../../config";
import Modal from "../../components/Modal";
import { useModal } from "../../hooks/useModal";
import { logger } from "../../utils/logger";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  suggested_next_services?: string;
  created_at: string;
}

interface Service {
  id: number;
  name: string;
  description?: string;
  base_price?: number;
}

interface ServiceRequest {
  id: number;
  customer: { id: number; name: string; email: string; phone?: string };
  service: Service;
  status: string;
  car_type?: string;
  rego_or_vin?: string;
  last_serviced_on?: string;
  notes?: string;
  preferred_contact_method?: string;
  returning_customer?: boolean;
  quoted_price?: number;
  scheduled_start?: string;
  scheduled_end?: string;
  estimated_duration_minutes?: number;
  assigned_technician?: string;
  admin_notes?: string;
  accepted_at?: string;
  completed_at?: string;
  completion_email_sent_at?: string;
  created_at: string;
}

interface CustomerStats {
  total_requests: number;
  total_jobs: number;
  completed_jobs: number;
  total_spent: number;
}

export default function AdminCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const modal = useModal();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Editing
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSuggested, setEditSuggested] = useState("");
  const [saving, setSaving] = useState(false);

  // Status change notes modal
  const [statusChange, setStatusChange] = useState<{ requestId: number; newStatus: string; existingNotes: string; newNote: string } | null>(null);

  // Convert to job modal
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertingRequest, setConvertingRequest] = useState<ServiceRequest | null>(null);

  // Reassign
  const [reassignTarget, setReassignTarget] = useState("");
  const [reassignResults, setReassignResults] = useState<{ id: number; name: string; email: string }[]>([]);
  const [reassignSearching, setReassignSearching] = useState(false);

  useEffect(() => {
    if (id) fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_CUSTOMER(Number(id)), { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch customer (${res.status})`);
      const data = await res.json();
      setCustomer(data.customer);
      setRequests(data.service_requests || []);
      setStats(data.stats || null);
      populateEditFields(data.customer);
    } catch (err: any) {
      logger.error("Failed to fetch customer:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const populateEditFields = (c: Customer) => {
    setEditName(c.name || "");
    setEditEmail(c.email || "");
    setEditPhone(c.phone || "");
    setEditNotes(c.notes || "");
    setEditSuggested(c.suggested_next_services || "");
  };

  const startEditing = () => {
    if (customer) populateEditFields(customer);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (customer) populateEditFields(customer);
    setEditing(false);
  };

  const saveCustomer = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_CUSTOMER(customer.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
          notes: editNotes,
          suggested_next_services: editSuggested,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.details?.join(", ") || errData.error || "Update failed");
      }
      const updated = await res.json();
      setCustomer(updated);
      populateEditFields(updated);
      setEditing(false);
      modal.showSuccess("Customer updated successfully");
    } catch (err: any) {
      logger.error("Failed to update customer:", err);
      modal.showError(err.message || "Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  // Status change with notes
  const promptStatusUpdate = (requestId: number, newStatus: string) => {
    const request = requests.find((r) => r.id === requestId);
    setStatusChange({
      requestId,
      newStatus,
      existingNotes: request?.admin_notes || "",
      newNote: "",
    });
  };

  const confirmStatusUpdate = async () => {
    if (!statusChange) return;
    const { requestId, newStatus, existingNotes, newNote } = statusChange;

    const timestamp = new Date().toLocaleString();
    const statusLabel = newStatus.replace("_", " ");
    const entry = newNote.trim()
      ? `[${timestamp}] Status → ${statusLabel}: ${newNote.trim()}`
      : `[${timestamp}] Status → ${statusLabel}`;
    const updatedNotes = existingNotes ? `${existingNotes}\n${entry}` : entry;

    try {
      const res = await fetch(`${API_ENDPOINTS.REQUESTS}/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, admin_notes: updatedNotes }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updatedRequest = await res.json();
      setRequests((prev) => prev.map((r) => (r.id === updatedRequest.id ? updatedRequest : r)));
      setStatusChange(null);
      modal.showSuccess(`Status updated to ${statusLabel}`);
      // Refresh stats
      fetchCustomer();
    } catch (err: any) {
      logger.error(err);
      modal.showError(err.message || "Error updating status");
    }
  };

  // Convert to job
  const openConvertModal = (request: ServiceRequestData) => {
    const full = requests.find((r) => r.id === request.id);
    if (full) {
      setConvertingRequest(full);
      setConvertModalOpen(true);
    }
  };

  const handleConvertToJob = async (jobData: JobData) => {
    if (!convertingRequest) return;
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_CONVERT_TO_JOB(convertingRequest.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(jobData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to convert to job");
      }
      const convertedJob = await res.json();
      setRequests((prev) => prev.map((r) => (r.id === convertedJob.id ? convertedJob : r)));
      setConvertModalOpen(false);
      setConvertingRequest(null);
      setExpandedId(convertedJob.id);
      modal.showSuccess(`Quote #${convertedJob.id} successfully converted to scheduled job!`);
      fetchCustomer();
    } catch (err: any) {
      logger.error(err);
      modal.showError(err.message || "Error converting to job");
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.REQUESTS}/${requestId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete");
      }
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setExpandedId(null);
      modal.showSuccess("Service request deleted");
      fetchCustomer();
    } catch (err: any) {
      modal.showError(err.message || "Failed to delete service request");
    }
  };

  const searchReassignTarget = async (query: string) => {
    setReassignTarget(query);
    if (query.length < 2) { setReassignResults([]); return; }
    setReassignSearching(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.ADMIN_CUSTOMERS}?search=${encodeURIComponent(query)}&per_page=5`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setReassignResults(
          (data.customers || []).filter((c: any) => c.id !== customer?.id)
        );
      }
    } catch {} finally { setReassignSearching(false); }
  };

  const handleReassign = (targetId: number, targetName: string) => {
    modal.showConfirm(
      `Move all ${requests.length} service request(s) from ${customer?.name} to ${targetName}?`,
      async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.ADMIN_CUSTOMER(customer!.id)}/reassign`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ target_customer_id: targetId }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Reassign failed");
          }
          modal.showSuccess("Service requests reassigned successfully");
          setReassignTarget("");
          setReassignResults([]);
          fetchCustomer();
        } catch (err: any) {
          modal.showError(err.message || "Failed to reassign");
        }
      }
    );
  };

  const handleDeleteCustomer = () => {
    if (requests.length > 0) {
      modal.showError("Cannot delete this customer while they have service requests. Reassign them to another customer first.");
      return;
    }
    modal.showConfirm(
      `Permanently delete ${customer?.name}? This cannot be undone.`,
      async () => {
        try {
          const res = await fetch(API_ENDPOINTS.ADMIN_CUSTOMER(customer!.id), {
            method: "DELETE",
            credentials: "include",
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Delete failed");
          }
          navigate("/admin/customers");
        } catch (err: any) {
          modal.showError(err.message || "Failed to delete customer");
        }
      }
    );
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) return <div className="admin-dashboard"><p>Loading...</p></div>;
  if (error) return <div className="admin-dashboard"><p className="error-text">{error}</p></div>;
  if (!customer) return <div className="admin-dashboard"><p>Customer not found.</p></div>;

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <button
            onClick={() => navigate("/admin/customers")}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              cursor: "pointer",
              padding: 0,
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
            }}
          >
            &larr; Back to Customers
          </button>
          <h1>{customer.name}</h1>
          <p>Customer #{customer.id} &middot; Since {new Date(customer.created_at).toLocaleDateString()}</p>
        </div>
        {!editing && (
          <button className="btn btn-primary" onClick={startEditing}>
            Edit Customer
          </button>
        )}
      </header>

      {/* Stats Row */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Total Requests", value: stats.total_requests },
            { label: "Total Jobs", value: stats.total_jobs },
            { label: "Completed", value: stats.completed_jobs },
            { label: "Total Spent", value: `$${stats.total_spent.toFixed(2)}` },
          ].map((s) => (
            <div key={s.label} className="dashboard-card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--primary)" }}>{s.value}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Two column layout: Info + Notes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="dashboard-card">
          <h2>Contact Information</h2>
          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label htmlFor="editName">Name</label>
                <input id="editName" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="editEmail">Email</label>
                <input id="editEmail" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="editPhone">Phone</label>
                <input id="editPhone" type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div><strong>Name:</strong> {customer.name}</div>
              <div><strong>Email:</strong> {customer.email || "—"}</div>
              <div><strong>Phone:</strong> {customer.phone || "—"}</div>
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <h2>Customer Notes</h2>
          {editing ? (
            <div className="form-group">
              <textarea
                id="editNotes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={6}
                placeholder="Add notes about this customer..."
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>
          ) : customer.notes ? (
            <pre style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              background: "var(--bg-secondary, #f8fafc)",
              padding: "0.75rem",
              borderRadius: "4px",
              border: "1px solid var(--border-color)",
              fontSize: "0.85rem",
              maxHeight: "200px",
              overflowY: "auto",
              margin: 0,
            }}>{customer.notes}</pre>
          ) : (
            <p style={{ color: "var(--text-secondary)" }}>No notes yet.</p>
          )}
        </div>
      </div>

      {/* Suggested Next Services */}
      <div className="dashboard-card" style={{ marginBottom: "1.5rem" }}>
        <h2>Suggested Next Services</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
          These recommendations will appear on the customer's next invoice.
        </p>
        {editing ? (
          <div className="form-group">
            <textarea
              id="editSuggested"
              value={editSuggested}
              onChange={(e) => setEditSuggested(e.target.value)}
              rows={4}
              placeholder="Add suggested services here..."
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>
        ) : customer.suggested_next_services ? (
          <pre style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            background: "var(--bg-secondary, #f8fafc)",
            padding: "0.75rem",
            borderRadius: "4px",
            border: "1px solid var(--border-color)",
            fontSize: "0.9rem",
            margin: 0,
          }}>{customer.suggested_next_services}</pre>
        ) : (
          <p style={{ color: "var(--text-secondary)" }}>No suggested services yet.</p>
        )}
      </div>

      {/* Save/Cancel bar */}
      {editing && (
        <div className="dashboard-card" style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "1rem",
          marginBottom: "1.5rem",
          padding: "1rem 1.5rem",
        }}>
          <button className="btn btn-secondary" onClick={cancelEditing} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={saveCustomer} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {/* Service History */}
      <div className="dashboard-card">
        <h2>Service History</h2>
        {requests.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No service requests yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>ID</th>
                <th>Service</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Date</th>
                <th>Price</th>
                <th style={{ width: "6%" }}></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <React.Fragment key={r.id}>
                  <tr
                    onClick={() => toggleExpand(r.id)}
                    style={{
                      cursor: "pointer",
                      background: expandedId === r.id ? "var(--bg-secondary, #f8fafc)" : undefined,
                    }}
                  >
                    <td>{r.id}</td>
                    <td>{r.service?.name || "Custom"}</td>
                    <td>{r.car_type || r.rego_or_vin || "—"}</td>
                    <td>
                      <span className={`status-badge status-${r.status}`}>{r.status}</span>
                    </td>
                    <td>
                      {r.scheduled_start
                        ? new Date(r.scheduled_start).toLocaleDateString()
                        : new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td>{r.quoted_price != null ? `$${Number(r.quoted_price).toFixed(2)}` : "—"}</td>
                    <td style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {expandedId === r.id ? "▲" : "▼"}
                    </td>
                  </tr>
                  {expandedId === r.id && (
                    <ServiceRequestExpandedRow
                      request={r as ServiceRequestData}
                      colSpan={7}
                      showCustomerInfo={false}
                      onStatusChange={promptStatusUpdate}
                      onConvertToJob={openConvertModal}
                      onUpdate={(updated) => setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated as ServiceRequest : r)))}
                      onDelete={handleDeleteRequest}
                    />
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Customer Management — only visible in edit mode */}
      {editing && (
        <div className="dashboard-card" style={{ marginTop: "1.5rem" }}>
          <h2 style={{ color: "#ef4444" }}>Customer Management</h2>

          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Reassign Service Requests</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              Move all quotes and jobs from this customer to another. Use this when a customer has changed their email and created a duplicate record.
            </p>
            <div style={{ position: "relative", maxWidth: "400px" }}>
              <input
                type="text"
                placeholder="Search customer by name or email..."
                value={reassignTarget}
                onChange={(e) => searchReassignTarget(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  border: "1px solid var(--border-color)",
                  borderRadius: reassignResults.length > 0 ? "6px 6px 0 0" : "6px",
                  fontSize: "0.9rem",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                onBlur={(e) => { if (!reassignResults.length) e.target.style.borderColor = "var(--border-color)"; }}
              />
              {reassignResults.length > 0 && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "var(--card-bg, white)",
                  border: "1px solid var(--primary)",
                  borderTop: "none",
                  borderRadius: "0 0 6px 6px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 10,
                  maxHeight: "200px",
                  overflowY: "auto",
                }}>
                  {reassignResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleReassign(c.id, c.name)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "0.65rem 0.75rem",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        borderBottom: "1px solid var(--border-color-light)",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-secondary, #f1f5f9)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      <strong>{c.name}</strong>
                      <span style={{ color: "var(--text-secondary)", marginLeft: "0.5rem", fontSize: "0.85rem" }}>{c.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {reassignSearching && (
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem", display: "block" }}>Searching...</span>
              )}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Delete Customer</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              Permanently remove this customer record. All service requests must be reassigned or removed first.
            </p>
            <button
              onClick={handleDeleteCustomer}
              style={{
                padding: "0.5rem 1.25rem",
                background: "transparent",
                color: "#ef4444",
                border: "1px solid #ef4444",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "0.9rem",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#ef4444"; }}
            >
              Delete Customer
            </button>
          </div>
        </div>
      )}

      {/* Convert to Job Modal */}
      {convertingRequest && (
        <ConvertToJobModal
          isOpen={convertModalOpen}
          onClose={() => { setConvertModalOpen(false); setConvertingRequest(null); }}
          onSubmit={handleConvertToJob}
          requestId={convertingRequest.id}
          serviceName={convertingRequest.service?.name || "Custom Service"}
          customerName={customer.name}
          basePrice={convertingRequest.service?.base_price}
        />
      )}

      {/* Status Change Notes Modal */}
      {statusChange && (
        <div className="modal-overlay" onClick={() => setStatusChange(null)}>
          <div className="modal-content service-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Status Change</h2>
            <p style={{ marginBottom: "1.5rem" }}>
              Changing status to{" "}
              <span className={`status-badge status-${statusChange.newStatus}`}>
                {statusChange.newStatus.replace("_", " ")}
              </span>
            </p>
            {statusChange.existingNotes && (
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Notes History</label>
                <pre style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  background: "var(--bg-secondary, #f8fafc)",
                  padding: "0.75rem",
                  borderRadius: "4px",
                  border: "1px solid var(--border-color)",
                  fontSize: "0.85rem",
                  maxHeight: "200px",
                  overflowY: "auto",
                  margin: 0,
                }}>{statusChange.existingNotes}</pre>
              </div>
            )}
            <div className="form-group">
              <label htmlFor="statusNotes">Add Note (optional)</label>
              <textarea
                id="statusNotes"
                value={statusChange.newNote}
                onChange={(e) => setStatusChange({ ...statusChange, newNote: e.target.value })}
                rows={3}
                placeholder="Add a note about this status change..."
              />
              <small style={{ color: "var(--text-secondary)" }}>Notes are timestamped and appended to the job log.</small>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setStatusChange(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmStatusUpdate}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <Modal {...modal.modalState} onClose={modal.closeModal} />
    </div>
  );
}

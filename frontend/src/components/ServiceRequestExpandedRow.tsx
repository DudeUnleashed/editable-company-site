import React, { useState } from "react";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../config";
import { logger } from "../utils/logger";
import "../styles/ExpandedRow.css";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface Service {
  id: number;
  name: string;
  description?: string;
  base_price?: number;
}

export interface ServiceRequestData {
  id: number;
  customer: Customer;
  service: Service;
  car_type?: string;
  rego_or_vin?: string;
  last_serviced_on?: string;
  notes?: string;
  preferred_contact_method?: string;
  returning_customer?: boolean;
  status: string;
  created_at: string;
  quoted_price?: number;
  scheduled_start?: string;
  scheduled_end?: string;
  estimated_duration_minutes?: number;
  assigned_technician?: string;
  admin_notes?: string;
  accepted_at?: string;
  completed_at?: string;
  completion_email_sent_at?: string;
}

interface Props {
  request: ServiceRequestData;
  colSpan: number;
  showCustomerInfo?: boolean;
  onStatusChange: (requestId: number, newStatus: string) => void;
  onConvertToJob?: (request: ServiceRequestData) => void;
  onUpdate: (updated: ServiceRequestData) => void;
  onDelete?: (requestId: number) => void | Promise<void>;
}

export default function ServiceRequestExpandedRow({
  request,
  colSpan,
  showCustomerInfo = true,
  onStatusChange,
  onConvertToJob,
  onUpdate,
  onDelete,
}: Props) {
  const isJob = ["scheduled", "in_progress", "completed", "cancelled"].includes(request.status);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editFields, setEditFields] = useState({
    car_type: "",
    rego_or_vin: "",
    quoted_price: "",
    scheduled_start_date: "",
    scheduled_start_time: "",
    scheduled_end_date: "",
    scheduled_end_time: "",
    estimated_duration_minutes: "",
    assigned_technician: "",
  });

  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startEditing = () => {
    const startDt = request.scheduled_start ? new Date(request.scheduled_start) : null;
    const endDt = request.scheduled_end ? new Date(request.scheduled_end) : null;
    const pad = (n: number) => n.toString().padStart(2, "0");
    const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setEditFields({
      car_type: request.car_type || "",
      rego_or_vin: request.rego_or_vin || "",
      quoted_price: request.quoted_price != null ? String(request.quoted_price) : "",
      scheduled_start_date: startDt ? toDateStr(startDt) : "",
      scheduled_start_time: startDt ? toTimeStr(startDt) : "",
      scheduled_end_date: endDt ? toDateStr(endDt) : "",
      scheduled_end_time: endDt ? toTimeStr(endDt) : "",
      estimated_duration_minutes: request.estimated_duration_minutes ? String(request.estimated_duration_minutes) : "",
      assigned_technician: request.assigned_technician || "",
    });
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const saveEdits = async () => {
    setSaving(true);
    try {
      const body: Record<string, any> = {
        car_type: editFields.car_type,
        rego_or_vin: editFields.rego_or_vin,
      };

      if (editFields.quoted_price) body.quoted_price = parseFloat(editFields.quoted_price);
      if (editFields.estimated_duration_minutes) body.estimated_duration_minutes = parseInt(editFields.estimated_duration_minutes);
      if (editFields.assigned_technician) body.assigned_technician = editFields.assigned_technician;

      if (editFields.scheduled_start_date && editFields.scheduled_start_time) {
        body.scheduled_start = new Date(`${editFields.scheduled_start_date}T${editFields.scheduled_start_time}`).toISOString();
      }
      if (editFields.scheduled_end_date && editFields.scheduled_end_time) {
        body.scheduled_end = new Date(`${editFields.scheduled_end_date}T${editFields.scheduled_end_time}`).toISOString();
      }

      const res = await fetch(`${API_ENDPOINTS.REQUESTS}/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save changes");
      const updated = await res.json();
      onUpdate(updated);
      setEditing(false);
    } catch (err: any) {
      logger.error("Failed to save edits:", err);
    } finally {
      setSaving(false);
    }
  };

  const submitNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const timestamp = new Date().toLocaleString();
      const entry = `[${timestamp}] Note: ${newNote.trim()}`;
      const updatedNotes = request.admin_notes ? `${request.admin_notes}\n${entry}` : entry;

      const res = await fetch(`${API_ENDPOINTS.REQUESTS}/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ admin_notes: updatedNotes }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      const updated = await res.json();
      onUpdate(updated);
      setNewNote("");
      setAddingNote(false);
    } catch (err: any) {
      logger.error("Failed to add note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  const sendCompletionEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await fetch(API_ENDPOINTS.SEND_COMPLETION_EMAIL(request.id), {
        method: "POST",
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to send email");
      }
      const updated = await res.json();
      onUpdate(updated);
    } catch (err: any) {
      logger.error("Failed to send completion email:", err);
    } finally {
      setSendingEmail(false);
    }
  };

  const editInput = (val: string, onChange: (v: string) => void, type = "text", placeholder = "") => (
    <input
      type={type}
      value={val}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );

  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0, borderBottom: "2px solid var(--primary)" }}>
        <div className="expanded-row-content">
          {/* Header */}
          <div className="expanded-row-header">
            <h3>
              {isJob ? "Job" : "Quote"} #{request.id}
              <span style={{ marginLeft: "0.75rem" }}>
                <span className={`status-badge status-${request.status}`}>{request.status}</span>
              </span>
            </h3>
            {!editing && (
              <button className="action-btn" onClick={startEditing}>Edit</button>
            )}
          </div>

          {/* Content grid */}
          <div className={`expanded-row-grid${showCustomerInfo ? "" : " two-col"}`}>
            {/* Customer */}
            {showCustomerInfo && (
              <div className="expanded-row-section">
                <h4>Customer</h4>
                <div className="expanded-row-fields">
                  <div>
                    <strong>Name:</strong>{" "}
                    <Link to={`/admin/customers/${request.customer?.id}`} style={{ color: "var(--primary)" }}>
                      {request.customer?.name}
                    </Link>
                  </div>
                  <div><strong>Email:</strong> {request.customer?.email || "—"}</div>
                  <div><strong>Phone:</strong> {request.customer?.phone || "—"}</div>
                  <div><strong>Contact Pref:</strong> {request.preferred_contact_method || "—"}</div>
                  <div><strong>Returning:</strong> {request.returning_customer ? "Yes" : "No"}</div>
                </div>
              </div>
            )}

            {/* Service & Vehicle */}
            <div className="expanded-row-section">
              <h4>Service & Vehicle</h4>
              <div className="expanded-row-fields">
                <div><strong>Service:</strong> {request.service?.name || "Custom"}</div>
                {request.service?.description && (
                  <div><strong>Description:</strong> {request.service.description}</div>
                )}
                {request.service?.base_price != null && (
                  <div><strong>Base Price:</strong> ${Number(request.service.base_price).toFixed(2)}</div>
                )}
                {editing ? (
                  <>
                    <div className="expanded-row-field-edit">
                      <strong>Car Type:</strong>
                      {editInput(editFields.car_type, (v) => setEditFields({ ...editFields, car_type: v }))}
                    </div>
                    <div className="expanded-row-field-edit">
                      <strong>Rego / VIN:</strong>
                      {editInput(editFields.rego_or_vin, (v) => setEditFields({ ...editFields, rego_or_vin: v }))}
                    </div>
                  </>
                ) : (
                  <>
                    <div><strong>Car Type:</strong> {request.car_type || "—"}</div>
                    <div><strong>Rego / VIN:</strong> {request.rego_or_vin || "—"}</div>
                  </>
                )}
                <div><strong>Last Serviced:</strong> {request.last_serviced_on || "—"}</div>
                {request.notes && <div><strong>Customer Notes:</strong> {request.notes}</div>}
              </div>
            </div>

            {/* Job Details / Timestamps */}
            <div className="expanded-row-section">
              {request.scheduled_start || isJob ? (
                <>
                  <h4>Job Details</h4>
                  <div className="expanded-row-fields">
                    {editing ? (
                      <>
                        <div className="expanded-row-field-edit">
                          <strong>Price:</strong>
                          {editInput(editFields.quoted_price, (v) => setEditFields({ ...editFields, quoted_price: v }), "number", "0.00")}
                        </div>
                        <div className="expanded-row-field-edit">
                          <strong>Start Date:</strong>
                          {editInput(editFields.scheduled_start_date, (v) => setEditFields({ ...editFields, scheduled_start_date: v }), "date")}
                        </div>
                        <div className="expanded-row-field-edit">
                          <strong>Start Time:</strong>
                          {editInput(editFields.scheduled_start_time, (v) => setEditFields({ ...editFields, scheduled_start_time: v }), "time")}
                        </div>
                        <div className="expanded-row-field-edit">
                          <strong>End Date:</strong>
                          {editInput(editFields.scheduled_end_date, (v) => setEditFields({ ...editFields, scheduled_end_date: v }), "date")}
                        </div>
                        <div className="expanded-row-field-edit">
                          <strong>End Time:</strong>
                          {editInput(editFields.scheduled_end_time, (v) => setEditFields({ ...editFields, scheduled_end_time: v }), "time")}
                        </div>
                        <div className="expanded-row-field-edit">
                          <strong>Duration:</strong>
                          {editInput(editFields.estimated_duration_minutes, (v) => setEditFields({ ...editFields, estimated_duration_minutes: v }), "number")}
                        </div>
                        <div className="expanded-row-field-edit">
                          <strong>Technician:</strong>
                          {editInput(editFields.assigned_technician, (v) => setEditFields({ ...editFields, assigned_technician: v }))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div><strong>Quoted Price:</strong> {request.quoted_price != null ? `$${Number(request.quoted_price).toFixed(2)}` : "—"}</div>
                        <div><strong>Scheduled:</strong> {request.scheduled_start ? new Date(request.scheduled_start).toLocaleString() : "—"}</div>
                        {request.scheduled_end && <div><strong>Ends:</strong> {new Date(request.scheduled_end).toLocaleString()}</div>}
                        <div><strong>Duration:</strong> {request.estimated_duration_minutes ? `${request.estimated_duration_minutes} min` : "—"}</div>
                        <div><strong>Technician:</strong> {request.assigned_technician || "—"}</div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h4>Timestamps</h4>
                  <div className="expanded-row-fields">
                    <div><strong>Created:</strong> {new Date(request.created_at).toLocaleString()}</div>
                    {request.accepted_at && <div><strong>Accepted:</strong> {new Date(request.accepted_at).toLocaleString()}</div>}
                    {request.completed_at && <div><strong>Completed:</strong> {new Date(request.completed_at).toLocaleString()}</div>}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Save/Cancel */}
          {editing && (
            <div className="expanded-row-save-bar">
              {onDelete && ["completed", "cancelled", "rejected"].includes(request.status) && (
                <button
                  className="btn btn-failure"
                  onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmed(false); }}
                  style={{ marginRight: "auto" }}
                >
                  Delete
                </button>
              )}
              <button className="btn btn-secondary" onClick={cancelEditing} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdits} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* Admin Notes */}
          <div className="expanded-row-notes">
            <div className="expanded-row-notes-header">
              <h4>Admin Notes</h4>
              {!addingNote && !editing && (
                <button
                  onClick={() => setAddingNote(true)}
                  style={{
                    background: "none",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    padding: "0.2rem 0.6rem",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  + Add Note
                </button>
              )}
            </div>
            {request.admin_notes ? (
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
              }}>{request.admin_notes}</pre>
            ) : (
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>No notes yet.</p>
            )}

            {addingNote && (
              <div style={{ marginTop: "0.75rem" }}>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  placeholder="Add a timestamped note..."
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    fontSize: "0.85rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", justifyContent: "flex-end" }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => { setAddingNote(false); setNewNote(""); }}
                    disabled={savingNote}
                    style={{ padding: "0.3rem 0.75rem", fontSize: "0.85rem" }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={submitNote}
                    disabled={savingNote || !newNote.trim()}
                    style={{ padding: "0.3rem 0.75rem", fontSize: "0.85rem" }}
                  >
                    {savingNote ? "Saving..." : "Add Note"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Timestamps for jobs */}
          {request.scheduled_start && (
            <div className="expanded-row-timestamps">
              <span>Created: {new Date(request.created_at).toLocaleString()}</span>
              {request.accepted_at && <span>Accepted: {new Date(request.accepted_at).toLocaleString()}</span>}
              {request.completed_at && <span>Completed: {new Date(request.completed_at).toLocaleString()}</span>}
            </div>
          )}

          {/* Action buttons */}
          {!editing && (
            <div className="expanded-row-actions">
              {request.status === "pending" && (
                <>
                  <button className="btn btn-primary" onClick={() => onStatusChange(request.id, "accepted")}>
                    Accept Quote
                  </button>
                  <button className="btn btn-secondary" onClick={() => onStatusChange(request.id, "rejected")}>
                    Reject Quote
                  </button>
                </>
              )}
              {(request.status === "pending" || request.status === "accepted") && onConvertToJob && (
                <button className="btn btn-primary" onClick={() => onConvertToJob(request)}>
                  Convert to Job
                </button>
              )}
              {request.status === "scheduled" && (
                <>
                  <button className="btn btn-primary" onClick={() => onStatusChange(request.id, "in_progress")}>
                    Mark In Progress
                  </button>
                  <button className="btn btn-success" onClick={() => onStatusChange(request.id, "completed")}>
                    Mark Completed
                  </button>
                  <button className="btn btn-failure" onClick={() => onStatusChange(request.id, "cancelled")}>
                    Cancel Job
                  </button>
                </>
              )}
              {request.status === "in_progress" && (
                <>
                  <button className="btn btn-success" onClick={() => onStatusChange(request.id, "completed")}>
                    Mark Completed
                  </button>
                  <button className="btn btn-failure" onClick={() => onStatusChange(request.id, "cancelled")}>
                    Cancel Job
                  </button>
                </>
              )}
              {request.status === "completed" && (
                request.completion_email_sent_at ? (
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", alignSelf: "center" }}>
                    Completion email sent {new Date(request.completion_email_sent_at).toLocaleString()}
                  </span>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={sendCompletionEmail}
                    disabled={sendingEmail}
                  >
                    {sendingEmail ? "Sending..." : "Send Completion Email"}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {showDeleteConfirm && (
          <>
            <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)} />
            <div className="modal-container">
              <div className="modal-content modal-error">
                <div className="modal-header">
                  <div className="modal-icon">✕</div>
                  <h2 className="modal-title">Delete {isJob ? "Job" : "Quote"}</h2>
                  <button className="modal-close-btn" onClick={() => setShowDeleteConfirm(false)} aria-label="Close modal">×</button>
                </div>
                <div className="modal-body">
                  <p className="modal-message">
                    Permanently delete {isJob ? "job" : "quote"} #{request.id} ({request.service?.name})?
                    <br />
                    <span style={{ color: "#6b7280", fontSize: "0.9em" }}>This cannot be undone.</span>
                  </p>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", cursor: "pointer", fontSize: "0.9rem" }}>
                    <input
                      type="checkbox"
                      checked={deleteConfirmed}
                      onChange={(e) => setDeleteConfirmed(e.target.checked)}
                      style={{ flexShrink: 0 }}
                    />
                    I understand this action is permanent
                  </label>
                </div>
                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </button>
                  <button
                    className="modal-btn modal-btn-confirm modal-btn-error"
                    disabled={!deleteConfirmed || deleting}
                    onClick={async () => {
                      if (!onDelete) return;
                      setDeleting(true);
                      await onDelete(request.id);
                      setDeleting(false);
                      setShowDeleteConfirm(false);
                    }}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}

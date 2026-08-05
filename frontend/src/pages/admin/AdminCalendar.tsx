import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { API_ENDPOINTS } from "../../config";
import Modal from "../../components/Modal";
import { useModal } from "../../hooks/useModal";
import { logger } from "../../utils/logger";
import GoogleCalendarSettings from "../../components/GoogleCalendarSettings";
import "../../styles/AdminDashboard.css";

interface Customer {
  id: number;
  name: string;
  email: string;
}

interface Service {
  id: number;
  name: string;
}

interface CalendarJob {
  id: number;
  customer: Customer;
  service: Service;
  car_type?: string;
  rego_or_vin?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduled_start: string;
  scheduled_end?: string;
  quoted_price?: number;
  assigned_technician?: string;
  admin_notes?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: CalendarJob;
}

export default function AdminCalendar() {
  const [jobs, setJobs] = useState<CalendarJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const modal = useModal();

  const [viewingJob, setViewingJob] = useState<CalendarJob | null>(null);

  // Inline edit time state (inside detail modal)
  const [editingTime, setEditingTime] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_CALENDAR, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch calendar events (${res.status})`);
      const data = await res.json();
      setJobs(data);
    } catch (err: any) {
      logger.error("Failed to fetch calendar events:", err);
      setError(err.message || "Failed to fetch calendar events");
    } finally {
      setLoading(false);
    }
  };

  const events: CalendarEvent[] = jobs.map((job) => {
    const serviceName = job.service?.name || "Custom Service";
    const customerName = job.customer?.name || "Unknown Customer";
    const vehicle = job.car_type || job.rego_or_vin || "";

    return {
      id: job.id.toString(),
      title: `${serviceName} - ${customerName}${vehicle ? ` (${vehicle})` : ""}`,
      start: job.scheduled_start,
      end: job.scheduled_end || job.scheduled_start,
      ...getStatusColors(job.status),
      extendedProps: job,
    };
  });

  function getStatusColors(status: string) {
    switch (status) {
      case "scheduled":
        return { backgroundColor: "#3b82f6", borderColor: "#2563eb", textColor: "#ffffff" };
      case "in_progress":
        return { backgroundColor: "#f97316", borderColor: "#ea580c", textColor: "#ffffff" };
      case "completed":
        return { backgroundColor: "#10b981", borderColor: "#059669", textColor: "#ffffff" };
      case "cancelled":
        return { backgroundColor: "#6b7280", borderColor: "#4b5563", textColor: "#ffffff" };
      default:
        return { backgroundColor: "#3b82f6", borderColor: "#2563eb", textColor: "#ffffff" };
    }
  }

  const handleEventDrop = async (info: any) => {
    const job = info.event.extendedProps as CalendarJob;
    const newStart = info.event.start.toISOString();
    const newEnd = info.event.end ? info.event.end.toISOString() : undefined;

    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_RESCHEDULE(job.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ scheduled_start: newStart, scheduled_end: newEnd }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to reschedule job");
      }
      const updatedJob = await res.json();
      setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
      modal.showSuccess(`Job #${job.id} rescheduled successfully!`);
    } catch (err: any) {
      logger.error("Failed to reschedule:", err);
      modal.showError(err.message || "Error rescheduling job");
      info.revert();
    }
  };

  const handleEventResize = async (info: any) => {
    const job = info.event.extendedProps as CalendarJob;
    const newStart = info.event.start.toISOString();
    const newEnd = info.event.end ? info.event.end.toISOString() : undefined;

    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_RESCHEDULE(job.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ scheduled_start: newStart, scheduled_end: newEnd }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update job duration");
      }
      const updatedJob = await res.json();
      setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
      modal.showSuccess(`Job #${job.id} duration updated successfully!`);
    } catch (err: any) {
      logger.error("Failed to update duration:", err);
      modal.showError(err.message || "Error updating job duration");
      info.revert();
    }
  };

  const handleEventClick = (info: any) => {
    const job = info.event.extendedProps as CalendarJob;
    setViewingJob(job);
    setEditingTime(false);
  };

  const closeDetailModal = () => {
    setViewingJob(null);
    setEditingTime(false);
  };

  const startEditingTime = () => {
    if (!viewingJob) return;
    const start = new Date(viewingJob.scheduled_start);
    const end = viewingJob.scheduled_end ? new Date(viewingJob.scheduled_end) : null;
    const pad = (n: number) => n.toString().padStart(2, "0");

    setEditDate(`${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`);
    setEditStartTime(`${pad(start.getHours())}:${pad(start.getMinutes())}`);
    setEditEndTime(end ? `${pad(end.getHours())}:${pad(end.getMinutes())}` : "");
    setEditingTime(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingJob) return;
    setEditSubmitting(true);

    try {
      const newStart = new Date(`${editDate}T${editStartTime}`).toISOString();
      const newEnd = editEndTime ? new Date(`${editDate}T${editEndTime}`).toISOString() : undefined;

      const res = await fetch(API_ENDPOINTS.ADMIN_RESCHEDULE(viewingJob.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ scheduled_start: newStart, scheduled_end: newEnd }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update job time");
      }

      const updatedJob = await res.json();
      setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
      setViewingJob(updatedJob);
      setEditingTime(false);
      modal.showSuccess(`Job #${viewingJob.id} time updated!`);
    } catch (err: any) {
      logger.error("Failed to edit time:", err);
      modal.showError(err.message || "Error updating job time");
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) return <div className="admin-dashboard"><p>Loading calendar...</p></div>;
  if (error) return <div className="admin-dashboard"><p className="error-text">{error}</p></div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Calendar</h1>
        <p>View and manage scheduled jobs</p>
      </header>

      {/* Status Legend */}
      <div className="dashboard-card" style={{ marginBottom: "1rem", padding: "1rem" }}>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Status Legend:</h3>
          {[
            { color: "#3b82f6", label: "Scheduled" },
            { color: "#f97316", label: "In Progress" },
            { color: "#10b981", label: "Completed" },
            { color: "#6b7280", label: "Cancelled" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <div style={{ width: "20px", height: "20px", backgroundColor: s.color, borderRadius: "4px" }} />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="dashboard-card" style={{ minHeight: "700px", padding: "1rem" }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          locale="en-AU"
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          events={events}
          editable={true}
          droppable={true}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventClick={handleEventClick}
          height="auto"
          nowIndicator={true}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: "08:00",
            endTime: "17:00",
          }}
          slotDuration="00:30:00"
          snapDuration="00:15:00"
        />
      </div>

      {/* Instructions */}
      <div className="dashboard-card" style={{ marginTop: "1rem", marginBottom: "1.5rem", padding: "1rem 1rem 1rem 1.5rem" }}>
        <h3 style={{ marginTop: 0 }}>Calendar Instructions:</h3>
        <ul style={{ marginBottom: 0, paddingLeft: "1.5rem" }}>
          <li>
            <strong>View Toggle:</strong> Switch between Month, Week, and Day views using the buttons in the top-right
          </li>
          <li>
            <strong>Drag to Reschedule:</strong> Click and drag any job to a new time slot to reschedule it
          </li>
          <li>
            <strong>Resize Duration:</strong> Drag the bottom edge of a job to adjust its duration
          </li>
          <li>
            <strong>View Details:</strong> Click on any job to view its full details, change its time, or jump to the Quotes & Jobs page
          </li>
        </ul>
      </div>

      {/* Google Calendar Settings */}
      <GoogleCalendarSettings />

      {/* Job Details Modal */}
      {viewingJob && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content service-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0 }}>Job #{viewingJob.id} Details</h2>
              <span className={`status-badge status-${viewingJob.status}`}>
                {viewingJob.status.replace("_", " ")}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Customer</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{viewingJob.customer?.name}</p>
              </div>
              <div>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Service</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{viewingJob.service?.name || "Custom"}</p>
              </div>
              <div>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Vehicle</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{viewingJob.car_type || viewingJob.rego_or_vin || "N/A"}</p>
              </div>
              <div>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Quoted Price</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{viewingJob.quoted_price != null ? `$${Number(viewingJob.quoted_price).toFixed(2)}` : "N/A"}</p>
              </div>
              <div>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Technician</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{viewingJob.assigned_technician || "Not assigned"}</p>
              </div>
              <div>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Registration</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{viewingJob.rego_or_vin || "N/A"}</p>
              </div>
            </div>

            <hr style={{ margin: "1.5rem 0", borderColor: "var(--border-color)" }} />

            {/* Schedule — view or edit */}
            {editingTime ? (
              <form onSubmit={handleEditSubmit}>
                <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Change Time</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label htmlFor="editDate">Date</label>
                    <input type="date" id="editDate" value={editDate} onChange={(e) => setEditDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="editStart">Start Time</label>
                    <input type="time" id="editStart" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="editEnd">End Time</label>
                    <input type="time" id="editEnd" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingTime(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                    {editSubmitting ? "Saving..." : "Save Time"}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div>
                  <p style={{ margin: "0 0 0.25rem", fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Start</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{new Date(viewingJob.scheduled_start).toLocaleString()}</p>
                </div>
                {viewingJob.scheduled_end && (
                  <div>
                    <p style={{ margin: "0 0 0.25rem", fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>End</p>
                    <p style={{ margin: 0, fontWeight: 500 }}>{new Date(viewingJob.scheduled_end).toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}

            {viewingJob.admin_notes && (
              <>
                <hr style={{ margin: "1.5rem 0", borderColor: "var(--border-color)" }} />
                <div>
                  <p style={{ margin: "0 0 0.25rem", fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Internal Notes</p>
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
                  }}>{viewingJob.admin_notes}</pre>
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", justifyContent: "flex-end" }}>
              {!editingTime && (
                <button className="btn btn-secondary" onClick={startEditingTime}>
                  Change Time
                </button>
              )}
              <button
                className="btn btn-primary"
                onClick={() => {
                  closeDetailModal();
                  navigate(`/admin/quotes?open=${viewingJob.id}`);
                }}
              >
                View in Quotes & Jobs
              </button>
              <button className="btn btn-secondary" onClick={closeDetailModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modal.modalState.isOpen}
        onClose={modal.closeModal}
        title={modal.modalState.title}
        message={modal.modalState.message}
        type={modal.modalState.type}
        confirmText={modal.modalState.confirmText}
        cancelText={modal.modalState.cancelText}
        showCancel={modal.modalState.showCancel}
        onConfirm={modal.modalState.onConfirm}
      />
    </div>
  );
}

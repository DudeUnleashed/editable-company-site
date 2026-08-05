import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../../styles/AdminDashboard.css";
import ConvertToJobModal, { JobData } from "../../components/ConvertToJobModal";
import ServiceRequestExpandedRow, { ServiceRequestData } from "../../components/ServiceRequestExpandedRow";
import { API_ENDPOINTS } from "../../config";
import Modal from "../../components/Modal";
import { useModal } from "../../hooks/useModal";
import Pagination, { PaginationInfo } from "../../components/Pagination";
import { logger } from "../../utils/logger";

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

interface ServiceRequest {
  id: number;
  customer: Customer;
  service: Service;
  car_type?: string;
  rego_or_vin?: string;
  last_serviced_on?: string;
  notes?: string;
  preferred_contact_method?: string;
  returning_customer?: boolean;
  status: "pending" | "accepted" | "rejected" | "scheduled" | "in_progress" | "completed" | "cancelled";
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

type ViewFilter = "all" | "quotes" | "jobs";

export default function AdminQuotes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [hideFinalized, setHideFinalized] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertingRequest, setConvertingRequest] = useState<ServiceRequest | null>(null);
  const [statusChange, setStatusChange] = useState<{ requestId: number; newStatus: string; existingNotes: string; newNote: string } | null>(null);
  const modal = useModal();

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [currentPage]);

  // Handle ?open=ID param after data loads
  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId && requests.length > 0) {
      const targetId = parseInt(openId, 10);
      const target = requests.find((r) => r.id === targetId);
      if (target) {
        // Auto-switch to the right tab
        const isJob = ["scheduled", "in_progress", "completed", "cancelled"].includes(target.status) && target.scheduled_start;
        setViewFilter(isJob ? "jobs" : "quotes");
        setExpandedId(targetId);

        // Scroll to the row after render
        setTimeout(() => {
          document.getElementById(`request-row-${targetId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);

        // Clean up the URL param
        searchParams.delete("open");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [requests]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.ADMIN_QUOTES}?page=${currentPage}&per_page=25`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`Failed to fetch requests (${res.status})`);
      const data = await res.json();
      setRequests(data.requests || data);
      setPagination(data.pagination || null);
    } catch (err: any) {
      logger.error("Failed to fetch requests:", err);
      setError(err.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Filter by view type
  const viewFilteredRequests = React.useMemo(() => {
    if (viewFilter === "quotes") {
      return requests.filter((r) => ["pending", "accepted", "rejected"].includes(r.status));
    } else if (viewFilter === "jobs") {
      return requests.filter((r) => ["scheduled", "in_progress", "completed", "cancelled"].includes(r.status) && r.scheduled_start);
    }
    return requests;
  }, [requests, viewFilter]);

  // Filter out finalized statuses
  const activeFilteredRequests = React.useMemo(() => {
    if (!hideFinalized) return viewFilteredRequests;
    return viewFilteredRequests.filter((r) => !["completed", "rejected", "cancelled"].includes(r.status));
  }, [viewFilteredRequests, hideFinalized]);

  // Filter by search term
  const searchFilteredRequests = React.useMemo(() => {
    return activeFilteredRequests.filter((r) => {
      const term = searchTerm.toLowerCase();
      return (
        r.customer?.name?.toLowerCase().includes(term) ||
        r.customer?.email?.toLowerCase().includes(term) ||
        r.customer?.phone?.toLowerCase().includes(term) ||
        r.car_type?.toLowerCase().includes(term) ||
        r.rego_or_vin?.toLowerCase().includes(term)
      );
    });
  }, [activeFilteredRequests, searchTerm]);

  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((val, key) => (val ? val[key] : null), obj);
  };

  const sortedRequests = React.useMemo(() => {
    const base = searchFilteredRequests;
    if (!sortConfig) return base;
    return [...base].sort((a, b) => {
      const aVal = getNestedValue(a, sortConfig.key);
      const bVal = getNestedValue(b, sortConfig.key);
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === "asc"
        ? (aVal as any) > (bVal as any) ? 1 : -1
        : (aVal as any) < (bVal as any) ? 1 : -1;
    });
  }, [searchFilteredRequests, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Status change with notes prompt
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
    } catch (err: any) {
      modal.showError(err.message || "Failed to delete service request");
    }
  };

  const colCount = viewFilter === "jobs" ? 9 : 7;

  if (loading) return <div className="admin-dashboard"><p>Loading...</p></div>;
  if (error) return <div className="admin-dashboard"><p className="error-text">{error}</p></div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Quotes & Jobs</h1>
        <p>Manage service requests, quotes, and scheduled jobs</p>
      </header>

      <div className="dashboard-card">
        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "2px solid var(--light-gray)" }}>
          {(["all", "quotes", "jobs"] as ViewFilter[]).map((filter) => {
            const counts = {
              quotes: requests.filter((r) => ["pending", "accepted", "rejected"].includes(r.status)).length,
              jobs: requests.filter((r) => ["scheduled", "in_progress", "completed", "cancelled"].includes(r.status) && r.scheduled_start).length,
              all: requests.length,
            };
            const labels = { quotes: "Quotes Only", jobs: "Jobs Only", all: "All" };
            return (
              <button
                key={filter}
                onClick={() => setViewFilter(filter)}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "none",
                  border: "none",
                  borderBottom: viewFilter === filter ? "3px solid var(--primary)" : "3px solid transparent",
                  color: viewFilter === filter ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: viewFilter === filter ? "600" : "400",
                  cursor: "pointer",
                }}
              >
                {labels[filter]} ({counts[filter]})
              </button>
            );
          })}
        </div>

        {/* Search Bar + Filter */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
          <div className="search-bar" style={{ marginBottom: 0, flex: 1 }}>
            <input
              type="text"
              placeholder="Search by name, email, phone, car type, or rego..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--text-secondary)", cursor: "pointer", whiteSpace: "nowrap" }}>
            <input
              type="checkbox"
              checked={hideFinalized}
              onChange={(e) => setHideFinalized(e.target.checked)}
            />
            Hide completed / rejected / cancelled
          </label>
        </div>

        {/* Table */}
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: "5%" }} onClick={() => requestSort("id")}>
                ID {sortConfig?.key === "id" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
              </th>
              <th onClick={() => requestSort("customer.name")}>
                Customer {sortConfig?.key === "customer.name" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
              </th>
              <th onClick={() => requestSort("service.name")}>
                Service {sortConfig?.key === "service.name" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
              </th>
              <th>Vehicle</th>
              {viewFilter === "jobs" && <th>Scheduled Date</th>}
              {viewFilter === "jobs" && <th>Price</th>}
              <th style={{ width: "10%" }} onClick={() => requestSort("status")}>
                Status {sortConfig?.key === "status" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
              </th>
              <th onClick={() => requestSort("created_at")}>
                Created {sortConfig?.key === "created_at" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
              </th>
              <th style={{ width: "6%" }}></th>
            </tr>
          </thead>
          <tbody>
            {sortedRequests.map((r) => (
              <React.Fragment key={r.id}>
                <tr
                  id={`request-row-${r.id}`}
                  onClick={() => toggleExpand(r.id)}
                  style={{
                    cursor: "pointer",
                    background: expandedId === r.id ? "var(--bg-secondary, #f8fafc)" : undefined,
                  }}
                >
                  <td>{r.id}</td>
                  <td>{r.customer?.name || "—"}</td>
                  <td>{r.service?.name || "Custom"}</td>
                  <td>{r.car_type || r.rego_or_vin || "—"}</td>
                  {viewFilter === "jobs" && (
                    <td>{r.scheduled_start ? new Date(r.scheduled_start).toLocaleString() : "—"}</td>
                  )}
                  {viewFilter === "jobs" && (
                    <td>{r.quoted_price != null ? `$${Number(r.quoted_price).toFixed(2)}` : "—"}</td>
                  )}
                  <td>
                    <span className={`status-badge status-${r.status}`}>{r.status}</span>
                  </td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {expandedId === r.id ? "▲" : "▼"}
                  </td>
                </tr>
                {expandedId === r.id && (
                  <ServiceRequestExpandedRow
                    request={r}
                    colSpan={colCount}
                    showCustomerInfo={true}
                    onStatusChange={promptStatusUpdate}
                    onConvertToJob={openConvertModal}
                    onUpdate={(updated) => setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated as ServiceRequest : r)))}
                    onDelete={handleDeleteRequest}
                  />
                )}
              </React.Fragment>
            ))}
            {sortedRequests.length === 0 && (
              <tr>
                <td colSpan={colCount} style={{ textAlign: "center", padding: "2rem" }}>
                  No {viewFilter === "quotes" ? "quotes" : viewFilter === "jobs" ? "jobs" : "requests"} found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          loading={loading}
        />
      )}

      {/* Convert to Job Modal */}
      {convertingRequest && (
        <ConvertToJobModal
          isOpen={convertModalOpen}
          onClose={() => {
            setConvertModalOpen(false);
            setConvertingRequest(null);
          }}
          onSubmit={handleConvertToJob}
          requestId={convertingRequest.id}
          serviceName={convertingRequest.service?.name || "Custom Service"}
          customerName={convertingRequest.customer?.name || "Unknown"}
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
              <small style={{ color: "var(--text-secondary)" }}>
                Notes are timestamped and appended to the job log.
              </small>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setStatusChange(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={confirmStatusUpdate}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for notifications */}
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

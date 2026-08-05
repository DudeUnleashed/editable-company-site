import React, { useState } from "react";
import { logger } from "../utils/logger";
import "../styles/AdminDashboard.css";

/* ==========================================
   CONVERT TO JOB MODAL COMPONENT
   ========================================== */

/**
 * Modal form for converting a service request quote into a scheduled job
 *
 * Collects job-specific information:
 * - Quoted price
 * - Scheduled date/time
 * - Estimated duration
 * - Assigned technician
 * - Admin notes (internal)
 *
 * @param isOpen - Whether the modal is visible
 * @param onClose - Callback to close the modal
 * @param onSubmit - Callback with job data when form is submitted
 * @param quotedPrice - Optional pre-filled price from service base_price
 */

interface ConvertToJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobData: JobData) => void;
  requestId: number;
  serviceName: string;
  customerName: string;
  basePrice?: number;
}

export interface JobData {
  quoted_price: number;
  scheduled_start: string; // ISO datetime string
  estimated_duration_minutes: number;
  assigned_technician: string;
  admin_notes: string;
}

export default function ConvertToJobModal({
  isOpen,
  onClose,
  onSubmit,
  requestId,
  serviceName,
  customerName,
  basePrice,
}: ConvertToJobModalProps) {
  // Form state
  const [quotedPrice, setQuotedPrice] = useState<string>(basePrice?.toString() || "");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("09:00");
  const [duration, setDuration] = useState<number>(60);
  const [technician, setTechnician] = useState<string>("Main Technician");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Don't render if not open
  if (!isOpen) return null;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine date and time into ISO datetime string
      const scheduledStart = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

      const jobData: JobData = {
        quoted_price: parseFloat(quotedPrice),
        scheduled_start: scheduledStart,
        estimated_duration_minutes: duration,
        assigned_technician: technician,
        admin_notes: adminNotes,
      };

      await onSubmit(jobData);
      handleClose();
    } catch (error) {
      logger.error("Error converting to job:", error);
      setIsSubmitting(false);
    }
  };

  // Reset form and close modal
  const handleClose = () => {
    setQuotedPrice(basePrice?.toString() || "");
    setScheduledDate("");
    setScheduledTime("09:00");
    setDuration(60);
    setTechnician("Main Technician");
    setAdminNotes("");
    setIsSubmitting(false);
    onClose();
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content service-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Convert to Scheduled Job</h2>

        {/* Job Summary */}
        <div style={{ padding: "1rem", backgroundColor: "var(--bg-secondary, #f8fafc)", borderRadius: "8px", marginBottom: "1.5rem" }}>
          <p style={{ margin: "0 0 0.5rem 0", fontWeight: "600" }}>
            Request #{requestId}
          </p>
          <p style={{ margin: "0 0 0.5rem 0" }}>
            <strong>Service:</strong> {serviceName}
          </p>
          <p style={{ margin: "0" }}>
            <strong>Customer:</strong> {customerName}
          </p>
        </div>

        {/* Conversion Form */}
        <form onSubmit={handleSubmit}>
          {/* Quoted Price */}
          <div className="form-group">
            <label htmlFor="quotedPrice">
              Quoted Price <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              type="number"
              id="quotedPrice"
              value={quotedPrice}
              onChange={(e) => setQuotedPrice(e.target.value)}
              min="0"
              step="0.01"
              required
              placeholder="Enter final quoted price"
            />
            {basePrice != null && (
              <small style={{ color: "var(--text-secondary)" }}>
                Base price: ${Number(basePrice).toFixed(2)}
              </small>
            )}
          </div>

          {/* Scheduled Date */}
          <div className="form-group">
            <label htmlFor="scheduledDate">
              Scheduled Date <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              type="date"
              id="scheduledDate"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={today}
              required
            />
          </div>

          {/* Scheduled Time */}
          <div className="form-group">
            <label htmlFor="scheduledTime">
              Start Time <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              type="time"
              id="scheduledTime"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
            />
          </div>

          {/* Duration */}
          <div className="form-group">
            <label htmlFor="duration">Estimated Duration</label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={150}>2.5 hours</option>
              <option value={180}>3 hours</option>
              <option value={240}>4 hours</option>
              <option value={300}>5 hours</option>
              <option value={360}>6 hours</option>
              <option value={480}>8 hours (full day)</option>
            </select>
          </div>

          {/* Assigned Technician */}
          <div className="form-group">
            <label htmlFor="technician">Assigned Technician</label>
            <input
              type="text"
              id="technician"
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              placeholder="Enter technician name"
            />
          </div>

          {/* Admin Notes */}
          <div className="form-group">
            <label htmlFor="adminNotes">Internal Notes (Optional)</label>
            <textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Add any internal notes about this job..."
            />
            <small style={{ color: "var(--text-secondary)" }}>
              These notes are not visible to the customer
            </small>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              {isSubmitting ? "Converting..." : "Convert to Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
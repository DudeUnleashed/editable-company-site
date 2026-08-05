import React, { useEffect } from "react";
import "../styles/Modal.css";

/* ==========================================
   MODAL COMPONENT
   ========================================== */

/**
 * Reusable modal dialog component
 * Replaces browser alert() calls with a better UX
 * Supports different types (success, error, warning, info)
 * Includes backdrop, close on ESC key, and animation
 */

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  confirmText?: string;
  onConfirm?: () => void;
  cancelText?: string;
  showCancel?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "OK",
  onConfirm,
  cancelText = "Cancel",
  showCancel = false,
}: ModalProps) {
  // Close modal on ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  // Handle confirm action
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  // Get icon based on modal type
  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
      default:
        return "ℹ";
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal container */}
      <div className="modal-container">
        <div className={`modal-content modal-${type}`}>
          {/* Header */}
          <div className="modal-header">
            <div className="modal-icon">{getIcon()}</div>
            {title && <h2 className="modal-title">{title}</h2>}
            <button
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">
            <p className="modal-message">{message}</p>
          </div>

          {/* Footer with action buttons */}
          <div className="modal-footer">
            {showCancel && (
              <button className="modal-btn modal-btn-cancel" onClick={onClose}>
                {cancelText}
              </button>
            )}
            <button
              className={`modal-btn modal-btn-confirm modal-btn-${type}`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

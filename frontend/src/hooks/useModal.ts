import { useState, useCallback } from "react";

/* ==========================================
   USE MODAL HOOK
   ========================================== */

/**
 * Custom hook for managing modal state
 * Provides convenient methods to show/hide modals with different types
 *
 * Usage:
 * const modal = useModal();
 * modal.showSuccess("Operation completed!");
 * modal.showError("Something went wrong");
 */

export interface ModalState {
  isOpen: boolean;
  title?: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  confirmText?: string;
  onConfirm?: () => void;
  cancelText?: string;
  showCancel?: boolean;
}

export const useModal = () => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    message: "",
    type: "info",
  });

  // Close modal
  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Show modal with custom configuration
  const showModal = useCallback((config: Omit<ModalState, "isOpen">) => {
    setModalState({
      isOpen: true,
      ...config,
    });
  }, []);

  // Show success modal
  const showSuccess = useCallback(
    (message: string, title?: string, onConfirm?: () => void) => {
      showModal({
        type: "success",
        title: title || "Success",
        message,
        confirmText: "OK",
        onConfirm,
        showCancel: false,
      });
    },
    [showModal]
  );

  // Show error modal
  const showError = useCallback(
    (message: string, title?: string, onConfirm?: () => void) => {
      showModal({
        type: "error",
        title: title || "Error",
        message,
        confirmText: "OK",
        onConfirm,
        showCancel: false,
      });
    },
    [showModal]
  );

  // Show warning modal
  const showWarning = useCallback(
    (message: string, title?: string, onConfirm?: () => void) => {
      showModal({
        type: "warning",
        title: title || "Warning",
        message,
        confirmText: "OK",
        onConfirm,
        showCancel: false,
      });
    },
    [showModal]
  );

  // Show info modal
  const showInfo = useCallback(
    (message: string, title?: string, onConfirm?: () => void) => {
      showModal({
        type: "info",
        title: title || "Information",
        message,
        confirmText: "OK",
        onConfirm,
        showCancel: false,
      });
    },
    [showModal]
  );

  // Show confirmation modal (with cancel button)
  const showConfirm = useCallback(
    (
      message: string,
      onConfirm: () => void,
      title?: string,
      confirmText = "Confirm",
      cancelText = "Cancel"
    ) => {
      showModal({
        type: "warning",
        title: title || "Confirm Action",
        message,
        confirmText,
        cancelText,
        showCancel: true,
        onConfirm,
      });
    },
    [showModal]
  );

  return {
    modalState,
    closeModal,
    showModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
};

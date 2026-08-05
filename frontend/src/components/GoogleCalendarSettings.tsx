import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../config";
import { logger } from "../utils/logger";
import Modal from "./Modal";
import { useModal } from "../hooks/useModal";
import "../styles/GoogleCalendarSettings.css";

interface CalendarStatus {
  connected: boolean;
  sync_enabled?: boolean;
  calendar_id?: string;
  last_synced_at?: string;
  token_expired?: boolean;
}

export default function GoogleCalendarSettings() {
  const { modalState, showSuccess, showError, showConfirm, closeModal } = useModal();

  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.ADMIN_GCAL_STATUS, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch status");
      setCalendarStatus(await res.json());
    } catch (err) {
      logger.error("Failed to load Google Calendar status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleConnect = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_GCAL_AUTH, { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get auth URL");
      }
      const data = await res.json();
      try {
        const parsed = new URL(data.url);
        if (!parsed.hostname.endsWith("google.com")) {
          throw new Error("Unexpected OAuth redirect origin");
        }
        window.location.href = data.url;
      } catch (urlErr: any) {
        throw new Error(urlErr.message || "Invalid auth URL received");
      }
    } catch (err: any) {
      showError(err.message || "Failed to connect Google Calendar");
    }
  };

  const handleDisconnect = () => {
    showConfirm("Disconnect Google Calendar? Jobs will no longer sync.", async () => {
      try {
        const res = await fetch(API_ENDPOINTS.ADMIN_GCAL_DISCONNECT, {
          method: "POST",
          credentials: 'include',
        });
        if (!res.ok) throw new Error("Failed to disconnect");
        showSuccess("Google Calendar disconnected");
        setCalendarStatus({ connected: false });
      } catch (err: any) {
        showError(err.message || "Failed to disconnect");
      }
    });
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch(API_ENDPOINTS.ADMIN_GCAL_SYNC, {
        method: "POST",
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to sync");
      const data = await res.json();
      showSuccess(data.message || "Sync complete");
      fetchStatus();
    } catch (err: any) {
      showError(err.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleSync = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_GCAL_SETTINGS, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ sync_enabled: !calendarStatus.sync_enabled }),
      });
      if (!res.ok) throw new Error("Failed to update");
      fetchStatus();
    } catch (err) {
      showError("Failed to update sync setting");
    }
  };

  return (
    <>
      <div className="settings-section">
        <h2>Google Calendar Integration</h2>
        <p className="settings-description">
          Sync your jobs and scheduled appointments with Google Calendar.
          New jobs will automatically appear in your Google Calendar when created or rescheduled.
        </p>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : calendarStatus.connected ? (
          <div className="gcal-connected">
            <div className="gcal-status">
              <span className="gcal-status-dot connected" />
              <span>Connected to Google Calendar</span>
            </div>

            {calendarStatus.token_expired && (
              <div className="gcal-warning">
                Token expired. Click "Reconnect" to refresh your connection.
              </div>
            )}

            <div className="gcal-info">
              <div className="gcal-info-row">
                <span>Calendar:</span>
                <span>{calendarStatus.calendar_id || "primary"}</span>
              </div>
              <div className="gcal-info-row">
                <span>Auto-sync:</span>
                <button
                  className={`status-toggle ${calendarStatus.sync_enabled ? "active" : "inactive"}`}
                  onClick={handleToggleSync}
                >
                  {calendarStatus.sync_enabled ? "Enabled" : "Disabled"}
                </button>
              </div>
              {calendarStatus.last_synced_at && (
                <div className="gcal-info-row">
                  <span>Last synced:</span>
                  <span>{new Date(calendarStatus.last_synced_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="gcal-actions">
              <button
                className="btn-primary"
                onClick={handleSync}
                disabled={syncing || !calendarStatus.sync_enabled}
              >
                {syncing ? "Syncing..." : "Sync Now"}
              </button>
              <button className="btn-cancel" onClick={handleConnect}>Reconnect</button>
              <button className="btn-delete" onClick={handleDisconnect}>Disconnect</button>
            </div>
          </div>
        ) : (
          <div className="gcal-disconnected">
            <div className="gcal-status">
              <span className="gcal-status-dot disconnected" />
              <span>Not connected</span>
            </div>
            <p>
              Connect your Google account to automatically sync scheduled jobs to your Google Calendar.
            </p>
            <button className="btn-primary" onClick={handleConnect}>
              Connect Google Calendar
            </button>
            <p className="settings-hint">
              Requires a Google Cloud project with the Calendar API enabled.
            </p>
          </div>
        )}
      </div>

      <Modal {...modalState} onClose={closeModal} />
    </>
  );
}

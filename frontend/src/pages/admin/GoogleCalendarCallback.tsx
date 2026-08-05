import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_ENDPOINTS } from "../../config";

export default function GoogleCalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Connecting Google Calendar...");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code) {
      setStatus("error");
      setMessage("No authorization code received from Google.");
      return;
    }

    const exchangeCode = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.ADMIN_GCAL_CALLBACK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ code, state }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to connect");
        }

        setStatus("success");
        setMessage("Google Calendar connected successfully! Redirecting...");
        setTimeout(() => navigate("/admin/calendar"), 2000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Failed to connect Google Calendar.");
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  return (
    <div style={{ padding: "3rem", textAlign: "center", maxWidth: "500px", margin: "0 auto" }}>
      <h2>
        {status === "processing" && "Connecting..."}
        {status === "success" && "Connected!"}
        {status === "error" && "Connection Failed"}
      </h2>
      <p style={{ color: status === "error" ? "red" : "inherit", marginTop: "1rem" }}>
        {message}
      </p>
      {status === "error" && (
        <button
          className="btn-primary"
          onClick={() => navigate("/admin/calendar")}
          style={{ marginTop: "1rem" }}
        >
          Back to Settings
        </button>
      )}
    </div>
  );
}

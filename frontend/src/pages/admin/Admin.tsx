import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../../config";
import { logger } from "../../utils/logger";
import "../../styles/AdminDashboard.css";

interface DashboardStats {
  jobs_today: {
    total: number;
    completed: number;
    in_progress: number;
    scheduled: number;
  };
  active_jobs_this_week: number;
  pending_quotes: number;
  total_revenue: number;
  recent_activity: {
    id: number;
    status: string;
    customer_name: string;
    service_name: string;
    updated_at: string;
  }[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "New quote request",
    accepted: "Quote accepted",
    rejected: "Quote rejected",
    scheduled: "Job scheduled",
    in_progress: "Job in progress",
    completed: "Job completed",
    cancelled: "Job cancelled",
  };
  return labels[status] || status;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.ADMIN_DASHBOARD, { credentials: 'include' });
        if (!res.ok) throw new Error("Failed to fetch dashboard stats");
        setStats(await res.json());
      } catch (err) {
        logger.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const todayBreakdown = stats
    ? [
        stats.jobs_today.completed > 0 && `${stats.jobs_today.completed} completed`,
        stats.jobs_today.in_progress > 0 && `${stats.jobs_today.in_progress} in progress`,
        stats.jobs_today.scheduled > 0 && `${stats.jobs_today.scheduled} scheduled`,
      ].filter(Boolean).join(" • ") || "No jobs today"
    : "";

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of jobs, quotes, and activity</p>
      </header>

      {/* Quick Stats Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Jobs Today</h2>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)", margin: "1rem 0" }}>
            {loading ? "..." : stats?.jobs_today.total ?? 0}
          </p>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            {loading ? "Loading..." : todayBreakdown}
          </p>
          <Link to="/admin/calendar" style={{ color: "var(--primary)", fontSize: "0.9rem", marginTop: "1rem", display: "inline-block" }}>
            View Calendar &rarr;
          </Link>
        </div>

        <div className="dashboard-card">
          <h2>Active Jobs</h2>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)", margin: "1rem 0" }}>
            {loading ? "..." : stats?.active_jobs_this_week ?? 0}
          </p>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Not completed this week
          </p>
          <Link to="/admin/calendar" style={{ color: "var(--primary)", fontSize: "0.9rem", marginTop: "1rem", display: "inline-block" }}>
            Manage Jobs &rarr;
          </Link>
        </div>

        <div className="dashboard-card">
          <h2>Pending Quotes</h2>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#b45309", margin: "1rem 0" }}>
            {loading ? "..." : stats?.pending_quotes ?? 0}
          </p>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Awaiting response
          </p>
          <Link to="/admin/quotes" style={{ color: "var(--primary)", fontSize: "0.9rem", marginTop: "1rem", display: "inline-block" }}>
            View Quotes &rarr;
          </Link>
        </div>

        <div className="dashboard-card">
          <h2>Total Revenue</h2>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--status-success-text)", margin: "1rem 0" }}>
            {loading ? "..." : `$${(stats?.total_revenue ?? 0).toFixed(2)}`}
          </p>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            All completed jobs
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-card" style={{ marginTop: "2rem" }}>
        <h2>Recent Activity</h2>
        <div style={{ marginTop: "1rem" }}>
          {loading ? (
            <p style={{ padding: "0.75rem", color: "#64748b" }}>Loading...</p>
          ) : stats?.recent_activity.length === 0 ? (
            <p style={{ padding: "0.75rem", color: "#64748b" }}>No recent activity.</p>
          ) : (
            stats?.recent_activity.map((item, i) => (
              <p
                key={item.id}
                style={{
                  padding: "0.75rem",
                  borderBottom: i < (stats?.recent_activity.length ?? 0) - 1 ? "1px solid var(--border-color-light)" : "none",
                  margin: 0,
                }}
              >
                <strong>{statusLabel(item.status)}</strong>
                {item.status === "pending" ? " from " : " — "}
                {item.customer_name} - {item.service_name}
                <span style={{ color: "#64748b", fontSize: "0.85rem", marginLeft: "1rem" }}>
                  {timeAgo(item.updated_at)}
                </span>
              </p>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: "2rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Quick Actions</h2>
        <div className="dashboard-grid">
          <Link to="/admin/quotes" className="dashboard-card" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
            <h3 style={{ color: "var(--primary)" }}>Manage Quotes</h3>
            <p>Review and respond to service requests</p>
          </Link>
          <Link to="/admin/calendar" className="dashboard-card" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
            <h3 style={{ color: "var(--primary)" }}>View Calendar</h3>
            <p>Schedule and manage appointments</p>
          </Link>
          <Link to="/admin/customers" className="dashboard-card" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
            <h3 style={{ color: "var(--primary)" }}>Customers</h3>
            <p>View and manage customer records</p>
          </Link>
          <Link to="/admin/cms?tab=services" className="dashboard-card" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
            <h3 style={{ color: "var(--primary)" }}>Manage Services</h3>
            <p>Add and edit service types and pricing</p>
          </Link>
          <Link to="/admin/cms" className="dashboard-card" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
            <h3 style={{ color: "var(--primary)" }}>Content Manager</h3>
            <p>Edit website pages and content</p>
          </Link>
          <Link to="/admin/cms?tab=reviews" className="dashboard-card" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
            <h3 style={{ color: "var(--primary)" }}>Manage Reviews</h3>
            <p>Add and manage customer reviews</p>
          </Link>
          <Link to="/admin/cms?tab=gallery" className="dashboard-card" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
            <h3 style={{ color: "var(--primary)" }}>Image Gallery</h3>
            <p>Upload and manage photos</p>
          </Link>
          <Link to="/admin/cms?tab=emails" className="dashboard-card" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
            <h3 style={{ color: "var(--primary)" }}>Email Templates</h3>
            <p>Customize email notifications</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

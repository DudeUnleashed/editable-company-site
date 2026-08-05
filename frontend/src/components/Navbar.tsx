import { NavLink, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useContent } from "../hooks/useContent";
import { API_ENDPOINTS } from "../config";
import "../styles/Navbar.css";

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { content: settings } = useContent("settings");
  const businessName = settings.business_name || "MyCompany";
  const logoUrl = settings.logo || "";
  const [pendingQuotes, setPendingQuotes] = useState(0);
  const prevPendingRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setPendingQuotes(0);
      prevPendingRef.current = 0;
      return;
    }

    let isFirstFetch = true;

    const fetchPending = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.ADMIN_DASHBOARD, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const count = data.pending_quotes || 0;
          if (!isFirstFetch && count > prevPendingRef.current) {
            const newCount = count - prevPendingRef.current;
            showToast(`${newCount} new quote request${newCount > 1 ? 's' : ''} received`);
          }
          prevPendingRef.current = count;
          setPendingQuotes(count);
          isFirstFetch = false;
        }
      } catch {}
    };

    fetchPending();
    intervalRef.current = setInterval(fetchPending, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isAuthenticated, isAdmin]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
    {toast && (
      <div className="nav-toast" onClick={() => setToast(null)}>
        {toast}
      </div>
    )}
    <nav className={`navbar ${isAuthenticated && isAdmin ? "navbar--admin" : ""}`}>
      <div className="logo">{businessName}</div>

      {logoUrl && !isAdmin && (
        <img src={logoUrl} alt={businessName} className="nav-logo-image" />
      )}

      <button
        className="hamburger"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
        <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
        <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
      </button>

      <div className={`nav-links ${menuOpen ? "nav-links--open" : ""}`}>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/services"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Services
        </NavLink>
        <NavLink
          to="/service"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Service Request
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          About
        </NavLink>

        {!isAuthenticated && (
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Login
          </NavLink>
        )}

        {isAuthenticated && isAdmin && (
          <>
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/calendar"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Calendar
            </NavLink>
            <NavLink
              to="/admin/quotes"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Quotes
              {pendingQuotes > 0 && (
                <span className="nav-badge">{pendingQuotes}</span>
              )}
            </NavLink>
            <NavLink
              to="/admin/customers"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Customers
            </NavLink>
            <NavLink
              to="/admin/cms"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              CMS
            </NavLink>
          </>
        )}

        {isAuthenticated && (
          <>
            <span className="nav-link nav-user-name">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="nav-link nav-logout-btn"
            >
              Logout
            </button>
          </>
        )}
      </div>

      {/* Overlay to close menu when tapping outside */}
      {menuOpen && (
        <div
          className="nav-overlay"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
    </>
  );
}

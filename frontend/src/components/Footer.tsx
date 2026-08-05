import { Link } from "react-router-dom";
import React from "react";
import { useContent } from "../hooks/useContent";
import "../styles/Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { content: settings } = useContent("settings");

  const businessName = settings.business_name || "MyCompany";
  const description = settings.business_description || "";
  const phone = settings.contact_phone || "";
  const email = settings.contact_email || "";
  const address = settings.contact_address || "";

  let hours: { day: string; hours: string }[] = [];
  try {
    hours = JSON.parse(settings.business_hours || "[]");
  } catch {}

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4 className="footer-heading">{businessName}</h4>
          {description && <p className="footer-text">{description}</p>}
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Quick Links</h4>
          <nav aria-label="Footer navigation">
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/service">Request Service</Link></li>
              <li><Link to="/about">About Us</Link></li>
            </ul>
          </nav>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Contact</h4>
          <ul className="footer-contact">
            {phone && <li>{phone}</li>}
            {email && <li>{email}</li>}
            {address && <li>{address}</li>}
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Hours</h4>
          <ul className="footer-contact">
            {hours.map((h, i) => (
              <li key={i}>{h.day}: {h.hours}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} {businessName}. All rights reserved.</p>
      </div>
    </footer>
  );
}

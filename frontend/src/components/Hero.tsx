import React from "react";
import { Link } from "react-router-dom";
import "../styles/HeroBar.css";

/* ==========================================
   HERO BAR COMPONENT
   ========================================== */

/**
 * Hero banner component displayed at the top of pages
 * Supports optional subtitle and call-to-action button
 *
 * @param title - Main heading text
 * @param subtitle - Optional subheading text
 * @param showButton - Whether to show CTA button (typically only on home page)
 */

interface HeroBarProps {
  title: string;
  subtitle?: string;
  showButton?: boolean;
}

export default function HeroBar({ title, subtitle, showButton = false }: HeroBarProps) {
  return (
    <section className="hero-bar">
      <div className="hero-content">
        <h1>{title}</h1>
        {subtitle && <p className="hero-subtitle">{subtitle}</p>}
        {showButton && (
          <Link to="/service" className="hero-button">
            Get a Quote
          </Link>
        )}
      </div>
    </section>
  );
}

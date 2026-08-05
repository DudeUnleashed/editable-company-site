import React from "react";
import { Link } from "react-router-dom";
import HeroBar from "../components/Hero";
import { useContent } from "../hooks/useContent";
import { createSafeCmsHTML } from "../utils/sanitizer";
import ReviewsSection from "../components/ReviewsSection";
import GallerySection from "../components/GallerySection";
import "../styles/Page.css";
import "../styles/Cards.css";

export default function Home() {
  const { content, loading, error, getJson } = useContent("home");
  const { content: settings } = useContent("settings");

  if (loading) {
    return (
      <div>
        <HeroBar title="Welcome" subtitle="Loading..." />
        <div className="page-container">
          <p style={{ textAlign: "center", padding: "2rem" }}>Loading page content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <HeroBar title="Welcome" subtitle="" />
        <div className="page-container">
          <p style={{ textAlign: "center", padding: "2rem", color: "red" }}>
            Failed to load page content. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const statsItems = getJson<{ value: string; label: string }>("stats_items");
  const statsColumns = parseInt(content.stats_columns) || 3;
  const serviceCards = getJson<{ icon: string; title: string; description: string }>("services_cards");
  const servicesColumns = parseInt(content.services_columns) || 3;
  const whyChooseItems = getJson<{ title: string; description: string }>("why_choose_items");

  return (
    <div>
      <HeroBar
        title={content.hero_title || "Welcome"}
        subtitle={content.hero_subtitle || ""}
        showButton={true}
      />

      <div className="page-container">
        {/* Statistics Section */}
        {(content.stats_heading || statsItems.length > 0) && (
          <section className="centered-section" style={{ marginBottom: "3rem" }}>
            {content.stats_heading && <h2>{content.stats_heading}</h2>}
            {statsItems.length > 0 && (
              <div
                className="card-list stats-grid"
                style={{
                  marginTop: "2rem",
                  "--stats-columns": statsColumns,
                } as React.CSSProperties}
              >
                {statsItems.map((item, i) => (
                  <div key={i} className="card" style={{ textAlign: "center" }}>
                    <h3 style={{ fontSize: "2.5rem", color: "var(--primary)", margin: "0" }}>{item.value}</h3>
                    <p style={{ margin: "0.5rem 0 0 0", fontWeight: "600" }}>{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Services Overview */}
        {(content.services_heading || serviceCards.length > 0) && (
          <section style={{ marginBottom: "3rem" }}>
            {content.services_heading && <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>{content.services_heading}</h2>}
            {serviceCards.length > 0 && (
              <div
                className="card-list stats-grid"
                style={{ "--stats-columns": servicesColumns } as React.CSSProperties}
              >
                {serviceCards.map((card, i) => (
                  <div key={i} className="card">
                    <h3>{card.icon} {card.title}</h3>
                    <p>{card.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Why Choose Us Section */}
        {(content.why_choose_heading || whyChooseItems.length > 0) && (
          <section className="card" style={{ background: "var(--bg-gray)", marginBottom: "3rem" }}>
            {content.why_choose_heading && <h2>{content.why_choose_heading}</h2>}
            {whyChooseItems.length > 0 && (
              <ul style={{ lineHeight: "2", fontSize: "1.05rem", listStyle: "none", paddingLeft: 0 }}>
                {whyChooseItems.map((item, i) => (
                  <li key={i}>✓ <strong>{item.title}</strong> - {item.description}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Image Gallery */}
        <GallerySection />

        {/* Customer Reviews */}
        <ReviewsSection />

        {/* Call to Action Section */}
        {(content.cta_heading || content.cta_text) && (
          <section className="centered-section" style={{ marginBottom: "3rem" }}>
            <div className="card" style={{ textAlign: "center", padding: "3rem 2rem", background: "var(--primary)", color: "white" }}>
              {content.cta_heading && <h2 style={{ color: "white", marginBottom: "1rem" }}>{content.cta_heading}</h2>}
              {content.cta_text && (
                <p style={{ fontSize: "1.1rem", marginBottom: "2rem", color: "#e0e7ff" }}>
                  {content.cta_text}
                </p>
              )}
              {content.cta_button_text && (
                <Link
                  to="/service"
                  className="btn"
                  style={{
                    background: "white",
                    color: "var(--primary)",
                    display: "inline-block",
                    textDecoration: "none"
                  }}
                >
                  {content.cta_button_text}
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Contact Information */}
        {(content.contact_heading || settings.contact_phone || settings.contact_email || settings.contact_address) && (
          <section className="card" style={{ textAlign: "center" }}>
            {content.contact_heading && <h2>{content.contact_heading}</h2>}
            {content.contact_subtext && (
              <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
                {content.contact_subtext}
              </p>
            )}
            {settings.contact_phone && <p style={{ margin: "0.5rem 0" }}>📞 Phone: <strong>{settings.contact_phone}</strong></p>}
            {settings.contact_email && <p style={{ margin: "0.5rem 0" }}>📧 Email: <strong>{settings.contact_email}</strong></p>}
            {settings.contact_address && <p style={{ margin: "0.5rem 0" }}>📍 Address: <strong>{settings.contact_address}</strong></p>}
          </section>
        )}
      </div>
    </div>
  );
}

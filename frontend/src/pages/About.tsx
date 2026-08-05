import React from "react";
import { Link } from "react-router-dom";
import HeroBar from "../components/Hero";
import { useContent } from "../hooks/useContent";
import { createSafeCmsHTML } from "../utils/sanitizer";
import "../styles/Page.css";
import "../styles/Cards.css";

export default function About() {
  const { content, loading, error, getJson } = useContent("about");

  if (loading) {
    return (
      <div>
        <HeroBar title="About" subtitle="Loading..." />
        <div className="page-container">
          <p style={{ textAlign: "center", padding: "2rem" }}>Loading page content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <HeroBar title="About" subtitle="" />
        <div className="page-container">
          <p style={{ textAlign: "center", padding: "2rem", color: "red" }}>
            Failed to load page content. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const valuesCards = getJson<{ icon: string; title: string; description: string }>("values_cards");
  const teamCards = getJson<{ icon: string; title: string; description: string }>("team_cards");
  const certItems = getJson<string>("certifications_items");
  const timelineItems = getJson<{ year: string; title: string; description: string }>("timeline_items");

  return (
    <div>
      <HeroBar
        title={content.hero_title || "About"}
        subtitle={content.hero_subtitle || ""}
      />

      <div className="page-container">
        {/* Company Introduction */}
        {(content.who_we_are_heading || content.who_we_are_content) && (
          <section className="card">
            {content.who_we_are_heading && <h2>{content.who_we_are_heading}</h2>}
            {content.who_we_are_content && <div dangerouslySetInnerHTML={createSafeCmsHTML(content.who_we_are_content)} />}
          </section>
        )}

        {/* Mission & Values */}
        {(content.mission_heading || content.mission_content) && (
          <section className="card" style={{ background: "var(--bg-gray)" }}>
            {content.mission_heading && <h2>{content.mission_heading}</h2>}
            {content.mission_content && <div dangerouslySetInnerHTML={createSafeCmsHTML(content.mission_content)} />}
          </section>
        )}

        {/* Core Values */}
        {(content.values_heading || valuesCards.length > 0) && (
          <section style={{ marginBottom: "3rem" }}>
            {content.values_heading && <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>{content.values_heading}</h2>}
            {valuesCards.length > 0 && (
              <div className="card-list">
                {valuesCards.map((card, i) => (
                  <div key={i} className="card">
                    <h3>{card.icon} {card.title}</h3>
                    <p>{card.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Meet the Team */}
        {(content.team_heading || teamCards.length > 0) && (
          <section className="card">
            {content.team_heading && <h2>{content.team_heading}</h2>}
            {content.team_intro && <p>{content.team_intro}</p>}
            {teamCards.length > 0 && (
              <div className="card-list" style={{ marginTop: "2rem" }}>
                {teamCards.map((card, i) => (
                  <div key={i} className="card">
                    <h3>{card.icon} {card.title}</h3>
                    <p>{card.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Certifications */}
        {(content.certifications_heading || certItems.length > 0) && (
          <section className="card" style={{ background: "var(--bg-gray)" }}>
            {content.certifications_heading && <h2>{content.certifications_heading}</h2>}
            {content.certifications_intro && <p>{content.certifications_intro}</p>}
            {certItems.length > 0 && (
              <ul style={{ lineHeight: "2", fontSize: "1.05rem", marginTop: "1rem", listStyle: "none", paddingLeft: 0 }}>
                {certItems.map((item, i) => (
                  <li key={i}>✓ {item}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Timeline */}
        {(content.timeline_heading || timelineItems.length > 0) && (
          <section className="card">
            {content.timeline_heading && <h2>{content.timeline_heading}</h2>}
            {timelineItems.length > 0 && (
              <div style={{ marginTop: "2rem" }}>
                {timelineItems.map((item, i) => (
                  <div key={i} style={{ marginBottom: i < timelineItems.length - 1 ? "1.5rem" : "0" }}>
                    <h4 style={{ color: "var(--primary)", marginBottom: "0.5rem" }}>{item.year} - {item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Location Map */}
        {content.map_embed_url && (
          <section className="card" style={{ marginBottom: "3rem" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>Find Us</h2>
            <div style={{ borderRadius: "8px", overflow: "hidden", lineHeight: 0 }}>
              <iframe
                src={content.map_embed_url}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Business location map"
              />
            </div>
          </section>
        )}

        {/* Call to Action */}
        {(content.cta_heading || content.cta_text) && (
          <section className="centered-section">
            <div className="card" style={{ textAlign: "center", padding: "2.5rem", background: "var(--primary)", color: "white" }}>
              {content.cta_heading && <h2 style={{ color: "white", marginBottom: "1rem" }}>{content.cta_heading}</h2>}
              {content.cta_text && (
                <p style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "#e0e7ff" }}>
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
      </div>
    </div>
  );
}

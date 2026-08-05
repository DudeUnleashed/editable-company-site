import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HeroBar from "../components/Hero";
import { useContent } from "../hooks/useContent";
import { API_ENDPOINTS } from "../config";
import { logger } from "../utils/logger";
import "../styles/Page.css";
import "../styles/Cards.css";
import "../styles/ServicesPage.css";

interface ServiceItem {
  id: number;
  name: string;
  description: string | null;
  detailed_description: string | null;
  base_price: string | null;
  estimated_duration: number | null;
  category: string;
  service_image_url: string | null;
}

export default function ServicesPage() {
  const { content, loading: cmsLoading } = useContent("services_page");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.SERVICES}?active_only=true`);
        if (!res.ok) throw new Error("Failed to load services");
        setServices(await res.json());
      } catch (err) {
        logger.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const isLoading = loading || cmsLoading;

  return (
    <div>
      <HeroBar
        title={content.hero_title || "Our Services"}
        subtitle={content.hero_subtitle || ""}
      />

      <div className="page-container">
        {content.page_intro && (
          <p className="services-page-intro">{content.page_intro}</p>
        )}

        {isLoading ? (
          <p style={{ textAlign: "center", padding: "2rem" }}>Loading services...</p>
        ) : services.length === 0 ? (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
            No services available at the moment.
          </p>
        ) : (
          <div className="services-page-grid">
            {services.map((service) => (
              <div key={service.id} className="service-page-card">
                {service.service_image_url && (
                  <div className="service-page-image">
                    <img src={service.service_image_url} alt={service.name} />
                  </div>
                )}
                <div className="service-page-content">
                  <div className="service-page-header">
                    <h3>{service.name}</h3>
                    <span className="category-badge">{service.category}</span>
                  </div>
                  <p className="service-page-description">
                    {service.detailed_description || service.description || ""}
                  </p>
                  <div className="service-page-footer">
                    <div className="service-page-meta">
                      {service.base_price && (
                        <span className="service-page-price">
                          From ${parseFloat(service.base_price).toFixed(2)}
                        </span>
                      )}
                      {service.estimated_duration && (
                        <span className="service-page-duration">
                          ~{service.estimated_duration} min
                        </span>
                      )}
                    </div>
                    <Link to={`/service?service=${encodeURIComponent(service.name)}`} className="btn btn-primary service-page-cta">
                      Get a Quote
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../config";
import { logger } from "../utils/logger";
import { Review } from "../types/review";
import StarRating from "./StarRating";
import { useContent } from "../hooks/useContent";
import { cachedFetch } from "../utils/cache";
import "../styles/ReviewsSection.css";

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { content } = useContent("settings");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await cachedFetch<Review[]>(API_ENDPOINTS.REVIEWS, "reviews");
        setReviews(data);
      } catch (err) {
        logger.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading || reviews.length === 0) return null;

  const googleUrl = content.google_reviews_url;

  return (
    <section className="reviews-section" style={{ marginBottom: "3rem" }}>
      <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>What Our Customers Say</h2>
      <div className="reviews-grid">
        {reviews.map((review) => (
          <div key={review.id} className="review-card">
            <StarRating rating={review.rating} />
            <p className="review-content">"{review.content}"</p>
            <div className="review-footer">
              <strong className="review-author">{review.customer_name}</strong>
              {review.service_category && (
                <span className="review-category">{review.service_category}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {googleUrl && (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ display: "inline-block", textDecoration: "none" }}
          >
            Leave Us a Review on Google
          </a>
        </div>
      )}
    </section>
  );
}

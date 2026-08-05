import React from "react";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: string;
}

export default function StarRating({ rating, maxStars = 5, size = "1.2rem" }: StarRatingProps) {
  return (
    <span className="star-rating" style={{ fontSize: size }} aria-label={`${rating} out of ${maxStars} stars`}>
      {Array.from({ length: maxStars }, (_, i) => (
        <span key={i} style={{ color: i < rating ? "#f59e0b" : "#d1d5db" }}>
          ★
        </span>
      ))}
    </span>
  );
}

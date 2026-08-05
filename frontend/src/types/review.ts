export interface Review {
  id: number;
  customer_name: string;
  content: string;
  rating: number;
  service_category: string | null;
  review_date: string | null;
  featured: boolean;
  active: boolean;
  position: number;
  created_at: string;
}

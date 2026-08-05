/* ==========================================
   SERVICE TYPES
   ========================================== */

export interface Service {
  id: number;
  name: string;
  description: string | null;
  detailed_description: string | null;
  base_price: string | null;
  estimated_duration: number | null;
  category: string;
  active: boolean;
  service_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceFormData {
  name: string;
  description: string;
  detailed_description: string;
  base_price: number | string;
  estimated_duration: number | string;
  category: string;
  active: boolean;
}

export const SERVICE_CATEGORIES = [
  'general',
  'maintenance',
  'repair',
  'diagnostic',
  'inspection',
  'bodywork',
  'other'
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];

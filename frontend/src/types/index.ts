export type Role = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
export type DutyStatus = 'ON_DUTY' | 'OFF_DUTY';
export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'BUSY';
export type Language = 'en' | 'ta' | 'hi';

export type BookingStatus =
  | 'SEARCHING_PROVIDER'
  | 'PROVIDER_ASSIGNED'
  | 'PROVIDER_ACCEPTED'
  | 'PROVIDER_ON_THE_WAY'
  | 'PROVIDER_ARRIVED'
  | 'SERVICE_STARTED'
  | 'SERVICE_COMPLETED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'CANCELLED';

export interface Service {
  id: number;
  name: string;
  description: string;
  icon: string;
  base_price: number;
  is_active: boolean;
}

export interface ProviderService {
  id: number;
  provider_id: number;
  service_id: number;
  service_name: string;
  service_icon: string;
  experience_years: number;
  service_description?: string;
  base_charge: number;
  is_active: boolean;
}

export interface ProviderProfile {
  id: number;
  user_id: number;
  name?: string;
  email?: string;
  phone?: string;
  profile_image?: string;
  experience_years: number;
  skills?: string;
  service_area?: string;
  rating: number;
  review_count: number;
  completed_jobs: number;
  service_quality_score: number;
  duty_status: DutyStatus;
  availability_status: AvailabilityStatus;
  latitude: number;
  longitude: number;
  last_location_update?: string;
  service_radius: number;
  services?: ProviderService[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  profile_image?: string;
  language: Language;
  address?: string;
  latitude?: number;
  longitude?: number;
  provider_profile?: ProviderProfile;
}

export interface Payment {
  id: number;
  booking_id: number;
  customer_id: number;
  provider_id: number;
  amount: number;
  currency: string;
  paypal_order_id?: string;
  paypal_transaction_id?: string;
  payment_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at?: string;
  completed_at?: string;
}

export interface Review {
  id: number;
  booking_id: number;
  customer_id: number;
  customer_name: string;
  provider_id: number;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Booking {
  id: number;
  customer_id: number;
  provider_id: number;
  service_id: number;
  service_name: string;
  service_icon?: string;
  problem_description: string;
  ai_classification?: string;
  severity: string;
  customer_latitude: number;
  customer_longitude: number;
  provider_latitude?: number;
  provider_longitude?: number;
  status: BookingStatus;
  estimated_distance?: number;
  estimated_arrival?: number;
  service_charge: number;
  additional_charge: number;
  total_amount: number;
  created_at: string;
  accepted_at?: string;
  arrived_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  customer?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  provider?: ProviderProfile;
  payment?: Payment;
  review?: Review;
}

export interface AIAnalysis {
  is_fallback?: boolean;
  mode?: string;
  detected_problem: string;
  detected_service: string;
  severity: string;
  requires_professional: boolean;
  troubleshooting_steps?: string[];
  safety_tip?: string;
  is_service_mismatch?: boolean;
  mismatch_warning?: string;
  ai_response: string;
}

export interface ProviderOption {
  provider: ProviderProfile;
  distance_km: number;
  estimated_arrival: number;
  service_charge: number;
  match_score: number;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  booking_id?: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

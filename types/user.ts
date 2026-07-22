export interface UserProfile {
  id?: string;
  uid?: string;
  email: string;
  name?: string;
  role?: string;
  department?: string;
  designation?: string;
  phone?: string;
  photoURL?: string | null;
  photo_url?: string | null;
  isActive?: boolean;
}

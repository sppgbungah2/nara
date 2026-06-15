import { createClient } from '@supabase/supabase-js';
import { UserRole } from '../types';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Clean up standard placeholder strings
const isPlaceholderUrl = !supabaseUrl || supabaseUrl.includes('your_project_id') || supabaseUrl === '';
const isPlaceholderKey = !supabaseAnonKey || supabaseAnonKey.includes('your_public_anon_key_here') || supabaseAnonKey === '';

export const isSupabaseConfigured = !isPlaceholderUrl && !isPlaceholderKey;

// Real Supabase client instance (or null if not yet configured)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// User custom profile mapping helper
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

// Map emails or user UIDs to the relevant operational role in SPPG Kitchen
export function mapUserToProfile(uid: string, email: string): UserProfile {
  const normEmail = email.toLowerCase().trim();
  
  // Specific instruction: User maghfurmunif@gmail.com with UID d5454d9d-1d50-4baa-b5b9-f8693694db4a is Admin
  if (normEmail === 'maghfurmunif@gmail.com' || uid === 'd5454d9d-1d50-4baa-b5b9-f8693694db4a') {
    return {
      id: uid,
      email: 'maghfurmunif@gmail.com',
      role: UserRole.ADMIN,
      fullName: 'Ustadz Maghfur Munif (Admin Utama)'
    };
  }

  // Predefined convenience mail accounts for other roles
  if (normEmail.startsWith('chef')) {
    return {
      id: uid,
      email,
      role: UserRole.CHEF,
      fullName: 'Chef Ahmad (Head Chef)'
    };
  }
  
  if (normEmail.startsWith('gizi')) {
    return {
      id: uid,
      email,
      role: UserRole.AHLI_GIZI,
      fullName: 'Ustadzah Fatimah, S.Gz (Ahli Gizi)'
    };
  }
  
  if (normEmail.startsWith('aslap')) {
    return {
      id: uid,
      email,
      role: UserRole.ASLAP,
      fullName: 'Ustadz Hakim, S.Pd (Aslap)'
    };
  }

  // Default fallback for any other registered users
  return {
    id: uid,
    email,
    role: UserRole.ADMIN, // Default to admin for user-created emails to ensure they have all capabilities
    fullName: email.split('@')[0].toUpperCase() + ' (Staff Dapur)'
  };
}

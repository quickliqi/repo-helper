import { createClient } from '@supabase/supabase-js';

// 1. Try to load from Vite environment
// 2. Fallback to hardcoded URL to prevent WSOD
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://olhppxldsbnxanpgkurt.supabase.co';

// Note to Damien: Replace YOUR_ANON_KEY with your actual public anon key
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9saHBweGxkc2JueGFucGdrdXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzcxNzcsImV4cCI6MjA4Njg1MzE3N30.C1Z4pbeVbZqVhDUP9rztx9U3BQi8GJui0gESYDYBvU0';

if (!supabaseUrl || supabaseUrl === 'undefined') {
  console.error('Supabase URL is missing!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
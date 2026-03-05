import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://olhppxldsbnxanpgkurt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9saHBweGxkc2JueGFucGdrdXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzcxNzcsImV4cCI6MjA4Njg1MzE3N30.C1Z4pbeVbZqVhDUP9rztx9U3BQi8GJui0gESYDYBvU0';

console.log("CRITICAL DEBUG: Supabase Client Initialized with Hardcoded Keys");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
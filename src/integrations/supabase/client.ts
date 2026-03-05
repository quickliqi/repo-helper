import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://vuseksebbbnvzjqsbthl.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c2Vrc2ViYmJudnpqcXNidGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODU4MzEsImV4cCI6MjA4MjM2MTgzMX0.oXenL068bdtJf36QuI72Yzc5QcZwU4cgHluEgpEpdXo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
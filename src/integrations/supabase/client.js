import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://olhppxldsbnxanpgkurt.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY'; // In prod this comes from env

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Legacy monkey patch for ai-hunter/live-market-scan removed — those functions are deprecated.

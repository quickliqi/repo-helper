import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://olhppxldsbnxanpgkurt.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY'; // In prod this comes from env

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// MONKEY PATCH: Intercept legacy Edge Function calls and route to Vercel Proxy
const originalInvoke = supabase.functions.invoke;
supabase.functions.invoke = async (functionName, options) => {
  if (['ai-hunter', 'live-market-scan', 'market-scan'].includes(functionName)) {
    console.warn(`Redirecting legacy function [${functionName}] to Swarm Proxy`);
    
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'LEGACY_SCAN_TRIGGER', 
          function_name: functionName,
          data: options?.body || {} 
        })
      });
      
      if (!response.ok) throw new Error('Proxy error');
      const data = await response.json();
      return { data, error: null };
    } catch (e) {
      console.error("Legacy redirect failed", e);
      return { data: null, error: e };
    }
  }
  return originalInvoke.call(supabase.functions, functionName, options);
};

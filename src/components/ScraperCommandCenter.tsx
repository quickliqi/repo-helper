import React, { useState } from 'react';

export default function ScraperCommandCenter() {
 const [status, setStatus] = useState('Awaiting Command');
 const [loading, setLoading] = useState(false);

 const triggerScrape = async () => {
 setLoading(true);
 setStatus('Transmitting coordinates to AWS Swarm...');
 
 try {
 // Bypassing Supabase entirely - hitting the Vercel Serverless proxy directly
 const response = await fetch('/api/proxy', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ 
 type: 'PRO_SEARCH', 
 message: 'Execute live market scrape', 
 user_id: 'admin' 
 })
 });

 const data = await response.json();
 
 if (!response.ok) throw new Error(data.error || 'Swarm proxy rejected the payload');
 
 setStatus('SUCCESS: Scouts deployed to the field.');
 } catch (err: any) {
 setStatus(`CONNECTION FAILED: ${err.message}`);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="p-6 bg-gray-900 rounded-lg shadow-xl border border-green-500/30 text-white">
 <h2 className="text-xl font-bold mb-4 text-green-400">Swarm Command Center</h2>
 <p className="text-sm text-gray-400 mb-6">Vercel Proxy Bridge: ACTIVE</p>
 
 <button 
 onClick={triggerScrape} 
 disabled={loading}
 className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-4 rounded transition-colors disabled:opacity-50"
 >
 {loading ? 'Initializing Swarm Protocol...' : 'Deploy Deal Hunters'}
 </button>
 
 <div className="mt-6 p-4 bg-black rounded border border-gray-800 font-mono text-sm">
 > Status: <span className={status.includes('FAILED') ? 'text-red-500' : 'text-green-500'}>{status}</span>
 </div>
 </div>
 );
}
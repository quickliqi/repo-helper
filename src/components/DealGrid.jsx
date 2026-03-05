import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

export default function DealGrid() {
 const [deals, setDeals] = useState([]);

 useEffect(() => {
 const fetchDeals = async () => {
 const { data } = await supabase.from('scrape_results').select('*').order('created_at', { ascending: false }).limit(6);
 if (data) setDeals(data);
 };
 fetchDeals();

 const channel = supabase.channel('realtime_deals')
 .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scrape_results' }, 
 (payload) => setDeals((current) => [payload.new, ...current].slice(0, 6)))
 .subscribe();
 return () => supabase.removeChannel(channel);
 }, []);

 // TWIN.IO BADGE LOGIC
 const getDealBadge = (scoreStr) => {
 if (!scoreStr) return <span className="text-gray-500 text-xs">Unscored</span>;
 const score = parseInt(scoreStr.toString().replace('%', ''));
 if (score <= 60) return <span className="bg-green-900/50 text-green-400 text-xs px-2 py-1 rounded border border-green-500">🔥 Excellent ({scoreStr})</span>;
 if (score > 60 && score <= 65) return <span className="bg-blue-900/50 text-blue-400 text-xs px-2 py-1 rounded border border-blue-500">✅ Good ({scoreStr})</span>;
 if (score > 65 && score <= 70) return <span className="bg-yellow-900/50 text-yellow-400 text-xs px-2 py-1 rounded border border-yellow-500">⚡ Fair ({scoreStr})</span>;
 return <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded border border-gray-600">Marginal ({scoreStr})</span>;
 };

 return (
 <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {deals.length === 0 ? (
 <div className="col-span-full text-center text-gray-500 py-8">Awaiting live intelligence...</div>
 ) : (
 deals.map((deal) => (
 <div key={deal.id} className="bg-gray-900 border border-gray-700 rounded-lg p-5 shadow-lg">
 <div className="flex justify-between items-start mb-4">
 <h3 className="font-bold text-lg text-white truncate w-2/3">
 {deal.deal_data?.address || 'Undisclosed'}
 </h3>
 {getDealBadge(deal.ai_score)}
 </div>
 <div className="space-y-2 text-sm text-gray-300">
 <p>💰 <span className="text-gray-500">MAO:</span> ${deal.deal_data?.mao?.toLocaleString() || 'TBD'}</p>
 <p>📈 <span className="text-gray-500">ARV:</span> ${deal.deal_data?.arv?.toLocaleString() || 'TBD'}</p>
 </div>
 <button className="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-green-400 text-sm font-bold py-2 rounded transition-colors border border-gray-600">
 Analyze This Deal
 </button>
 </div>
 ))
 )}
 </div>
 );
}
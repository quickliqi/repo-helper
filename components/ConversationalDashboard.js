import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://olhppxldsbnxanpgkurt.supabase.co', 'YOUR_ANON_KEY');

export default function ConversationalDashboard() {
  const [chat, setChat] = useState([{ role: 'bot', text: 'Scout Online. What city are we hitting?' }]);
  const [query, setQuery] = useState('');
  const [deals, setDeals] = useState([]);

  // 1. Listen for Live Deals
  useEffect(() => {
    const channel = supabase.channel('realtime_deals')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scrape_results' }, 
      (payload) => setDeals(prev => [payload.new, ...prev])
    )
    .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // 2. Send Command & Webhook
  const handleSearch = async () => {
    if (!query.trim()) return;
    const userText = query;
    setChat(prev => [...prev, { role: 'user', text: userText }]);
    setQuery('');

    // Trigger Swarm & Field Report
    try {
      const res = await fetch('http://54.213.177.197:8000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'USER_INTERACTION', 
          message: userText,
          sender: 'Frontend_Conversational_UI'
        })
      });
      const data = await res.json();
      setChat(prev => [...prev, { role: 'bot', text: data.reply || 'Scouts deployed.' }]);
    } catch (e) {
      setChat(prev => [...prev, { role: 'bot', text: 'Swarm connection pending...' }]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      {/* Chat Interface */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {chat.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg max-w-xs ${m.role === 'user' ? 'bg-green-600 self-end ml-auto' : 'bg-gray-800'}`}>
            {m.text}
          </div>
        ))}
      </div>

      {/* Live Deals Ticker */}
      <div className="h-1/3 bg-gray-900 p-4 overflow-x-auto flex gap-4 border-t border-gray-700">
        {deals.length === 0 ? <p className="text-gray-500">Waiting for live leads...</p> : 
          deals.map((d, i) => (
            <div key={i} className="min-w-[200px] p-3 bg-gray-800 rounded border border-green-500">
              <p className="font-bold text-green-400">{d.deal_data?.address || 'New Lead'}</p>
              <p className="text-xs">Score: {d.ai_score}</p>
            </div>
          ))
        }
      </div>

      {/* Input Box */}
      <div className="p-4 bg-gray-900 flex gap-2">
        <input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Find me a deal in Whidbey Island..." 
          className="flex-1 bg-black border border-gray-700 p-3 rounded-full focus:outline-none focus:border-green-500"
        />
        <button onClick={handleSearch} className="bg-green-500 w-12 h-12 rounded-full font-bold">↑</button>
      </div>
    </div>
  );
}
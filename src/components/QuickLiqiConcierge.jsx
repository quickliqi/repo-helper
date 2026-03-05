import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Ensure this points to your Supabase init file

export default function QuickLiqiConcierge({ user }) {
  const [chat, setChat] = useState([{ role: 'bot', text: 'Secure link established. What city are we hunting today?' }]);
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    const userText = query;
    setChat(prev => [...prev, { role: 'user', text: userText }]);
    setQuery('');
    setIsThinking(true);

    try {
      // SECURE CALL: Hitting the Edge Function, NOT the AWS IP
      const { data, error } = await supabase.functions.invoke('swarm-proxy', {
        body: { 
          type: 'PRO_SEARCH', 
          message: userText,
          user_id: user?.id || 'anonymous'
        }
      });

      if (error) throw error;
      
      setChat(prev => [...prev, { role: 'bot', text: data?.reply || 'Scouts deployed.' }]);
    } catch (e) {
      setChat(prev => [...prev, { role: 'bot', text: `Connection Error: ${e.message}` }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-96 bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {chat.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg max-w-[80%] ${m.role === 'user' ? 'bg-green-600 self-end ml-auto' : 'bg-gray-800'}`}>
            {m.text}
          </div>
        ))}
        {isThinking && <div className="text-gray-400 italic text-sm">Transmitting to Swarm...</div>}
      </div>
      <div className="p-4 bg-black flex gap-2 rounded-b-lg">
        <input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="e.g. Find me a flip in Atlanta..." 
          className="flex-1 bg-gray-900 border border-gray-700 p-3 rounded focus:outline-none focus:border-green-500"
        />
        <button onClick={handleSearch} disabled={isThinking} className="bg-green-500 px-6 font-bold rounded hover:bg-green-400 disabled:opacity-50">
          Send
        </button>
      </div>
    </div>
  );
}
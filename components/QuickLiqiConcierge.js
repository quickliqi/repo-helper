import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Adjusted to your local path

export default function QuickLiqiConcierge({ user }) {
  const [chat, setChat] = useState([{ role: 'bot', text: 'Scout Online. What city are we hunting in today?' }]);
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = async () => {
    if (!query.trim()) return;
    const userText = query;
    setChat(prev => [...prev, { role: 'user', text: userText }]);
    setQuery('');
    setIsThinking(true);

    try {
      // This pings the AWS Swarm but includes the user's ID for credit tracking
      const res = await fetch('http://54.213.177.197:8000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: userText, 
            user_id: user.id, 
            type: 'PRO_SEARCH',
            sender: 'QuickLiqiConcierge' 
        })
      });
      const data = await res.json();
      setChat(prev => [...prev, { role: 'bot', text: data.reply || 'Scouts deployed.' }]);
    } catch (e) {
      setChat(prev => [...prev, { role: 'bot', text: 'Swarm connection pending...' }]);
    } finally {
        setIsThinking(false);
    }
  };

  return (
    <div className="concierge-container bg-opacity-50 backdrop-blur-md p-4 rounded-xl border border-gray-700 bg-gray-900">
      <div className="h-96 overflow-y-auto space-y-4 mb-4">
        {chat.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg max-w-md ${m.role === 'user' ? 'bg-green-600 self-end ml-auto text-right' : 'bg-gray-800 text-left'}`}>
            <p className="text-sm font-semibold mb-1">{m.role === 'user' ? 'You' : 'Scout'}</p>
            {m.text}
          </div>
        ))}
        {isThinking && <div className="italic text-gray-400 animate-pulse">Scout is thinking...</div>}
      </div>

      <div className="flex gap-2">
        <input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask your scout..." 
          className="flex-1 bg-black border border-gray-700 p-3 rounded-lg focus:outline-none focus:border-green-500 text-white"
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="bg-green-600 px-6 py-2 rounded-lg font-bold hover:bg-green-500 transition">
            Go
        </button>
      </div>
    </div>
  );
}
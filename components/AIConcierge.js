import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://olhppxldsbnxanpgkurt.supabase.co', 'YOUR_ANON_KEY');

export default function AIConcierge() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Yo Damien, I am your QuickLiqi scout. What city are we hunting in today?' }]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    
    // Fire Twin's recommended Field Report Webhook to the AWS Swarm
    fetch('http://54.213.177.197:8000', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-swarm-key': 'QL_SWARM_SECURE_9A4b7X1v_LIVE' 
      },
      body: JSON.stringify({
        sender: "QuickLiqi_Frontend",
        type: "FIELD_REPORT",
        content: `User searched: ${input}`,
        data: { user_id: 'anonymous' }
      })
    }).catch(err => console.error("Radar ping failed", err));

    setInput('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection lost. Check AWS vitals.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg shadow-xl">
      <div className="h-64 overflow-y-auto mb-4 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-blue-400' : 'text-green-400'}>
            <strong>{m.role === 'user' ? 'You: ' : 'Scout: '}</strong>{m.content}
          </div>
        ))}
        {isThinking && <div className="italic animate-pulse">Scout is thinking...</div>}
      </div>
      <div className="flex gap-2">
        <input 
          className="flex-grow p-2 bg-gray-800 rounded border border-gray-700" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Find me a flip in Atlanta..."
        />
        <button onClick={sendMessage} className="bg-green-600 px-4 py-2 rounded">Send</button>
      </div>
    </div>
  );
}
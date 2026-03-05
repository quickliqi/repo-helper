import React, { useState } from 'react';

export default function QuickLiqiConcierge({ user }) {
  const [chat, setChat] = useState([{ role: 'bot', text: 'Safe Mode Active. The previous UI crashed due to an import error.' }]);

  return (
    <div className="flex flex-col h-96 bg-gray-900 text-white rounded-lg shadow-xl border border-red-500 p-4">
      <h2 className="text-red-400 font-bold mb-4">⚠️ UI Recovery Mode</h2>
      <div className="flex-1 overflow-y-auto space-y-4">
        {chat.map((m, i) => (
          <div key={i} className="p-3 rounded-lg bg-gray-800 border border-gray-700">
            {m.text}
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm text-gray-400">
        Waiting for Damien to provide the exact file path to the Supabase client...
      </div>
    </div>
  );
}
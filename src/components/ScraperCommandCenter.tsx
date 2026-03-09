import { useState } from 'react';

const WEBHOOK = 'http://54.213.177.197:8000';

interface Props {
  onHuntStart?: (city: string, state: string) => void;
}

export default function ScraperCommandCenter({ onHuntStart }: Props) {
  const [status, setStatus]       = useState('Awaiting Command');
  const [loading, setLoading]     = useState(false);
  const [city, setCity]           = useState('Memphis');
  const [stateCode, setStateCode] = useState('TN');

  const triggerScrape = async () => {
    setLoading(true);
    setStatus('Transmitting coordinates to AWS Swarm for ' + city + ', ' + stateCode + '...');
    try {
      const response = await fetch(WEBHOOK + '/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'PRO_SEARCH', message: 'Execute live market scrape for ' + city + ' ' + stateCode, user_id: 'admin' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Swarm rejected the payload');
      setStatus('SUCCESS: Scouts deployed to ' + city + ', ' + stateCode + '.');
      onHuntStart?.(city, stateCode);
    } catch (err: any) {
      setStatus('CONNECTION FAILED: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg shadow-xl border border-green-500/30 text-white">
      <h2 className="text-xl font-bold mb-4 text-green-400">⚡ Swarm Command Center</h2>
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">City</label>
          <input value={city} onChange={e => setCity(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-36 focus:border-green-500 outline-none"
            placeholder="Memphis" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">State</label>
          <input value={stateCode} onChange={e => setStateCode(e.target.value.toUpperCase())}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-16 focus:border-green-500 outline-none"
            placeholder="TN" maxLength={2} />
        </div>
        <button onClick={triggerScrape} disabled={loading}
          className="bg-green-600 hover:bg-green-500 text-black font-bold py-2 px-6 rounded transition-colors disabled:opacity-50">
          {loading ? '🔄 Initializing Swarm Protocol...' : '🚀 Deploy Deal Hunters'}
        </button>
      </div>
      <div className="p-4 bg-black rounded border border-gray-800 font-mono text-sm">
        {'>'} Status: <span className={status.includes('FAILED') ? 'text-red-500' : 'text-green-500'}>{status}</span>
      </div>
    </div>
  );
}

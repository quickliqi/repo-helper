import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import DealTable from '@/components/deals/DealTable';

const WEBHOOK = 'http://54.213.177.197:8000';

export default function Scraper() {
  const [deals, setDeals]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [status, setStatus]       = useState('Idle');
  const [city, setCity]           = useState('Memphis');
  const [stateCode, setStateCode] = useState('TN');
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    fetchDeals();
    subscribeRealtime();
  }, []);

  const fetchDeals = async () => {
    const { data, error } = await supabase
      .from('scrape_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error && data) setDeals(data);
  };

  const subscribeRealtime = () => {
    supabase
      .channel('scrape_results_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scrape_results' }, (payload) => {
        setDeals(prev => [payload.new, ...prev]);
        setLiveCount(n => n + 1);
        setStatus('🟢 New deal received — ' + ((payload.new as any)?.deal_data?.address || 'unknown'));
      })
      .subscribe();
  };

  const startHunt = async () => {
    setLoading(true);
    setStatus('🔄 Deploying scouts to ' + city + ', ' + stateCode + '...');
    setLiveCount(0);
    try {
      const res = await fetch(WEBHOOK + '/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'PRO_SEARCH', message: 'Execute live market scrape for ' + city + ' ' + stateCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Swarm rejected payload');
      setStatus('✅ Swarm acknowledged — results loading...');
    } catch (err: any) {
      setStatus('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const is70Deal = (row: any) => {
    const d = row?.deal_data || {};
    return (d.mao || 0) > (d.price || 0);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-400">🏚️ Market Scanner</h1>
            <p className="text-gray-400 text-sm mt-1">Real-time wholesale deal hunter powered by QuickLiqi Swarm</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">{deals.length}</div>
            <div className="text-xs text-gray-500">Total Deals</div>
          </div>
        </div>

        <div className="bg-gray-900 border border-green-500/30 rounded-xl p-6 mb-6 shadow-xl">
          <h2 className="text-lg font-bold text-green-400 mb-4">⚡ Swarm Command Center</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">City</label>
              <input value={city} onChange={e => setCity(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-40 focus:border-green-500 outline-none"
                placeholder="Memphis" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">State</label>
              <input value={stateCode} onChange={e => setStateCode(e.target.value.toUpperCase())}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-20 focus:border-green-500 outline-none"
                placeholder="TN" maxLength={2} />
            </div>
            <button onClick={startHunt} disabled={loading}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-black font-bold py-2 px-6 rounded transition-colors">
              {loading ? '🔄 Deploying...' : '🚀 Start Hunt'}
            </button>
            <button onClick={fetchDeals}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors">
              🔃 Refresh
            </button>
          </div>
          <div className="mt-4 p-3 bg-black rounded border border-gray-800 font-mono text-sm flex items-center justify-between">
            <span className={status.includes('❌') ? 'text-red-400' : 'text-green-400'}>{'>'} {status}</span>
            {liveCount > 0 && <span className="text-green-400 text-xs animate-pulse">+{liveCount} live</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Scanned', value: deals.length, color: 'text-blue-400' },
            { label: '70% Deals', value: deals.filter(is70Deal).length, color: 'text-green-400' },
            { label: 'Avg Price', value: '$' + Math.round(deals.reduce((a,r) => a + (r?.deal_data?.price||0), 0) / (deals.length||1)).toLocaleString(), color: 'text-yellow-400' },
            { label: 'Markets', value: [...new Set(deals.map((r:any) => r?.deal_data?.city).filter(Boolean))].length, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className={'text-2xl font-bold ' + s.color}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        <DealTable deals={deals} is70Deal={is70Deal} />
      </div>
    </MainLayout>
  );
}

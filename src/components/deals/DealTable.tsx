import { useState } from 'react';

interface Props {
  deals: any[];
  is70Deal: (row: any) => boolean;
}

export default function DealTable({ deals, is70Deal }: Props) {
  const [filter, setFilter] = useState<'all'|'deals'|'creative'>('all');
  const [sortBy, setSortBy] = useState<'date'|'price'|'spread'>('date');

  const filtered = deals
    .filter(r => {
      if (filter === 'deals') return is70Deal(r);
      if (filter === 'creative') return !is70Deal(r) && (r?.deal_data?.price||0) > 0;
      return (r?.deal_data?.price||0) > 0;
    })
    .sort((a, b) => {
      const da = a?.deal_data||{}, db = b?.deal_data||{};
      if (sortBy === 'price') return (da.price||0) - (db.price||0);
      if (sortBy === 'spread') return ((db.mao||0)-(db.price||0)) - ((da.mao||0)-(da.price||0));
      return 0;
    });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-800">
        <div className="flex gap-2">
          {(['all','deals','creative'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={'px-3 py-1 rounded text-sm font-medium transition-colors ' + (filter===f ? 'bg-green-600 text-black' : 'bg-gray-800 text-gray-400 hover:text-white')}>
              {f==='all' ? '📋 All' : f==='deals' ? '✅ 70% Deals' : '🏦 Creative Finance'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500">Sort:</span>
          {(['date','price','spread'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={'px-2 py-1 rounded text-xs transition-colors ' + (sortBy===s ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-white')}>
              {s}
            </button>
          ))}
          <span className="text-xs text-gray-600 ml-2">{filtered.length} results</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Address</th>
              <th className="text-right p-3">Ask</th>
              <th className="text-right p-3">ARV</th>
              <th className="text-right p-3">MAO</th>
              <th className="text-right p-3">Spread</th>
              <th className="text-center p-3">Beds</th>
              <th className="text-center p-3">Sqft</th>
              <th className="text-left p-3">Market</th>
              <th className="text-left p-3">Link</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="text-center p-8 text-gray-600">No deals yet — start a hunt above</td></tr>
            )}
            {filtered.map((row, i) => {
              const d = row?.deal_data||{};
              const price = d.price||0, mao = d.mao||0, arv = d.arv||0;
              const spread = Math.round(mao - price);
              const deal = is70Deal(row);
              return (
                <tr key={row.id||i} className={'border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ' + (deal ? 'bg-green-950/20' : '')}>
                  <td className="p-3"><span className={'text-lg ' + (deal ? 'text-green-400' : 'text-yellow-500')}>{deal ? '✅' : '🏦'}</span></td>
                  <td className="p-3">
                    <div className="font-medium text-white max-w-xs truncate">{d.address||'—'}</div>
                    <div className="text-xs text-gray-500">{d.property_type||'residential'}</div>
                  </td>
                  <td className="p-3 text-right text-white font-mono">${price.toLocaleString()}</td>
                  <td className="p-3 text-right text-blue-400 font-mono">${Math.round(arv).toLocaleString()}</td>
                  <td className="p-3 text-right text-yellow-400 font-mono">${Math.round(mao).toLocaleString()}</td>
                  <td className={'p-3 text-right font-mono font-bold ' + (spread>0 ? 'text-green-400' : 'text-red-400')}>{spread>0?'+':''}{spread.toLocaleString()}</td>
                  <td className="p-3 text-center text-gray-300">{d.beds||'—'}</td>
                  <td className="p-3 text-center text-gray-300">{d.sqft ? d.sqft.toLocaleString() : '—'}</td>
                  <td className="p-3"><span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">{d.city||'—'}, {d.state||'—'}</span></td>
                  <td className="p-3">{d.listing_url ? <a href={d.listing_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs underline">View →</a> : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

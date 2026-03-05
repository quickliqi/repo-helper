import React, { useState } from 'react';

export default function AIHunter() {
  const [targetCity, setTargetCity] = useState('');
  const [dealType, setDealType] = useState('fix-flip');
  const [isScanning, setIsScanning] = useState(false);

  // Replaced placeholder with Localhost SSH Tunnel connection
  const triggerScrape = async (e) => {
    e.preventDefault();
    setIsScanning(true);
    console.log("Transmitting coordinates to AWS Swarm via Tunnel...");
    
    try {
      const response = await fetch('http://localhost:8000', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-swarm-key': 'QL_SWARM_SECURE_9A4b7X1v_LIVE'
        },
        body: JSON.stringify({ 
          type: 'PRO_SEARCH', 
          message: `Execute live market scrape for ${targetCity} (${dealType})`, 
          user_id: 'admin',
          data: { city: targetCity, strategy: dealType }
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Swarm rejected the payload');
      
      console.log('SUCCESS: Scouts deployed to the field.');
      alert("Swarm Deployed: Scouts are scanning the market.");
    } catch (err) {
      console.error(`CONNECTION FAILED: ${err.message}`);
      alert(`Connection Failed: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-700">
      <h2 className="text-2xl font-bold text-green-400 mb-6 text-center">AI Deal Hunter</h2>
      <form onSubmit={triggerScrape} className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-1">Target Market</label>
          <input 
            type="text" 
            value={targetCity}
            onChange={(e) => setTargetCity(e.target.value)}
            placeholder="e.g. Atlanta, GA"
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-green-500 focus:outline-none"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-400 text-sm mb-1">Strategy</label>
          <select 
            value={dealType}
            onChange={(e) => setDealType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-green-500 focus:outline-none"
          >
            <option value="fix-flip">Fix & Flip</option>
            <option value="rental">Buy & Hold (Rental)</option>
            <option value="brrrr">BRRRR</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={isScanning}
          className={`w-full font-bold py-3 px-4 rounded transition-all duration-200 transform hover:scale-[1.02] ${
            isScanning 
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]'
          }`}
        >
          {isScanning ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Deploying Swarm...
            </span>
          ) : (
            'START HUNT'
          )}
        </button>
      </form>
    </div>
  );
}
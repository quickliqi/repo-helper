import React, { useState } from 'react';
import AIHunter from '../components/AIHunter'; 

export default function Scraper() {
  const [status, setStatus] = useState('Idle');

  // Direct Swarm Connection Logic (Localhost Tunnel)
  const triggerScrape = async (e) => {
    e.preventDefault();
    console.log("Transmitting coordinates to AWS Swarm via Tunnel...");
    setStatus('Deploying Swarm...');
    
    try {
      // Connecting via localhost SSH tunnel
      const response = await fetch('http://localhost:8000', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-swarm-key': 'QL_SWARM_SECURE_9A4b7X1v_LIVE'
        },
        body: JSON.stringify({ 
          type: 'PRO_SEARCH', 
          message: 'Execute live market scrape', 
          user_id: 'admin' 
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Swarm rejected the payload');
      
      console.log('SUCCESS: Scouts deployed to the field.');
      setStatus('Scouts Deployed successfully.');
      alert("Swarm Deployed: Scouts are scanning the market.");
      
    } catch (err) {
      console.error(`CONNECTION FAILED: ${err.message}`);
      setStatus(`Connection Failed: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto p-6 text-white">
      <h1 className="text-3xl font-bold mb-6 text-green-400">Market Scanner</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Command Center</h2>
        <div className="flex gap-4 items-center">
          <button 
            onClick={triggerScrape}
            className="bg-green-600 hover:bg-green-500 text-black font-bold py-2 px-6 rounded transition-colors"
          >
            Launch Scraper
          </button>
          <span className="font-mono text-sm text-gray-300">Status: {status}</span>
        </div>
      </div>

      <AIHunter />
    </div>
  );
}
import AIConcierge from '../components/AIConcierge';
import DealGrid from '../components/DealGrid'; // Assuming this exists for your results

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-green-500 mb-2">QuickLiqi</h1>
        <p className="text-gray-400">Your AI-Powered Wholesale Scout</p>
      </header>

      <section className="max-w-4xl mx-auto mb-12">
        <AIConcierge />
      </section>

      <section className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Live Distressed Leads</h2>
        <DealGrid />
      </section>
    </main>
  );
}
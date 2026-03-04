import { createClient } from '@/utils/supabase/server';
import QuickLiqiConcierge from '../../components/QuickLiqiConcierge';
import Link from 'next/link';

// Mock Upgrade component for non-pro users
const UpgradeToPro = () => (
    <div className="text-center p-10 border border-green-500 rounded-xl">
        <h2 className="text-2xl font-bold mb-4">Pro Scouts Only</h2>
        <p className="mb-4">Upgrade to QuickLiqi Pro to access the AI Hunter.</p>
        <Link href="/pricing" className="bg-green-600 px-6 py-2 rounded text-white">Upgrade Now</Link>
    </div>
);

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Mocking pro check (in real app, fetch from profile/subscription table)
  const is_pro = true; // user?.app_metadata?.claims_admin || false; 

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-green-500">Hunter Dashboard</h1>
      
      <div className="max-w-4xl mx-auto">
        {user && is_pro ? (
            <QuickLiqiConcierge user={user} />
        ) : (
            <UpgradeToPro />
        )}
      </div>
    </div>
  );
}
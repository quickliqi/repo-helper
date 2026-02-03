import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnlineStatusProps {
  userId: string;
  className?: string;
}

export function OnlineStatus({ userId, className = '' }: OnlineStatusProps) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // In a real implementation, this would track presence via Supabase Realtime
    // For now, we'll simulate based on recent activity
    checkOnlineStatus();
    
    const interval = setInterval(checkOnlineStatus, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const checkOnlineStatus = async () => {
    // Check if user has had any recent activity in the last 5 minutes
    // This is a simplified version - in production you'd use Supabase Presence
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data } = await supabase
      .from('messages')
      .select('created_at')
      .eq('sender_id', userId)
      .gte('created_at', fiveMinutesAgo)
      .limit(1);
    
    setIsOnline(!!data && data.length > 0);
  };

  return (
    <span 
      className={`inline-block w-2.5 h-2.5 rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-gray-400'
      } ${className}`}
      title={isOnline ? 'Online' : 'Offline'}
    />
  );
}

export function OnlineIndicator({ isOnline }: { isOnline: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span 
        className={`inline-block w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`}
      />
      <span className="text-xs text-muted-foreground">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        // Get all conversations the user is part of
        const { data: conversations, error: convError } = await supabase
          .from('conversations')
          .select('id')
          .or(`investor_id.eq.${user.id},seller_id.eq.${user.id}`);

        if (convError || !conversations?.length) {
          setUnreadCount(0);
          return;
        }

        const conversationIds = conversations.map(c => c.id);

        // Count unread messages across all conversations
        const { count, error: msgError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        if (msgError) {
          console.error('Error fetching unread count:', msgError);
          return;
        }

        setUnreadCount(count || 0);
      } catch (err) {
        console.error('Error in fetchUnreadCount:', err);
      }
    };

    fetchUnreadCount();

    // Subscribe to new messages for real-time updates
    const channel = supabase
      .channel('unread-messages-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Refetch count when any message changes
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { unreadCount };
}

import { ReactNode, useCallback } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export function PullToRefresh({ children, onRefresh, className }: PullToRefreshProps) {
  const { containerRef, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh,
    threshold: 80,
    maxPull: 120,
  });

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden"
        style={{
          top: 0,
          height: `${pullDistance}px`,
          opacity: Math.min(progress * 1.5, 1),
        }}
      >
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 transition-transform',
            isRefreshing && 'bg-primary/20'
          )}
          style={{
            transform: `rotate(${progress * 180}deg) scale(${0.5 + progress * 0.5})`,
          }}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <ArrowDown className="h-5 w-5 text-primary" />
          )}
        </div>
      </div>

      {/* Content with transform */}
      <div
        className="transition-transform duration-100 ease-out"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

import { useGetNeoStats } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function KpiCards() {
  const { data: stats, isLoading } = useGetNeoStats();

  if (isLoading || !stats) {
    return (
      <div className="flex gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="glass-panel p-4 rounded-lg w-40">
            <Skeleton className="h-3 w-20 bg-white/10 mb-3" />
            <Skeleton className="h-6 w-16 bg-white/20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <div className="glass-panel p-4 rounded-lg w-40 border-l-[3px] border-l-blue-500">
        <div className="text-[10px] uppercase tracking-wider text-white/60 mb-1">Tracked Objects</div>
        <div className="text-2xl font-mono font-bold text-white">{stats.totalCount}</div>
      </div>
      <div className="glass-panel p-4 rounded-lg w-40 border-l-[3px] border-l-red-500">
        <div className="text-[10px] uppercase tracking-wider text-white/60 mb-1">Hazardous</div>
        <div className="text-2xl font-mono font-bold text-red-400">{stats.hazardousCount}</div>
      </div>
      <div className="glass-panel p-4 rounded-lg w-48 border-l-[3px] border-l-yellow-500">
        <div className="text-[10px] uppercase tracking-wider text-white/60 mb-1">Closest Approach</div>
        <div className="text-2xl font-mono font-bold text-white">
          {(stats.closestApproachKm / 384400).toFixed(2)} <span className="text-sm text-white/50">LD</span>
        </div>
        <div className="text-xs text-white/40 mt-1 truncate">{stats.closestObjectName}</div>
      </div>
      <div className="glass-panel p-4 rounded-lg w-48 border-l-[3px] border-l-purple-500">
        <div className="text-[10px] uppercase tracking-wider text-white/60 mb-1">Max Velocity</div>
        <div className="text-2xl font-mono font-bold text-white">
          {stats.fastestVelocityKmS.toFixed(1)} <span className="text-sm text-white/50">km/s</span>
        </div>
        <div className="text-xs text-white/40 mt-1 truncate">{stats.fastestObjectName}</div>
      </div>
    </div>
  );
}

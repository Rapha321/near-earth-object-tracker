import { useGetApproachingNeo } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function NeoSidebar({ selectedNeoId, onSelectNeo }: { selectedNeoId: string | null, onSelectNeo: (id: string) => void }) {
  const { data, isLoading } = useGetApproachingNeo();

  if (isLoading) {
    return (
      <div className="glass-panel h-full w-full rounded-lg p-4 flex flex-col">
        <h2 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">Approaching Objects</h2>
        <div className="space-y-3 overflow-hidden">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full bg-white/5" />)}
        </div>
      </div>
    );
  }

  const objects = data?.objects || [];
  // Sort by miss distance
  const sorted = [...objects].sort((a, b) => a.nextCloseApproach.missDistanceLunar - b.nextCloseApproach.missDistanceLunar);

  return (
    <div className="glass-panel h-full w-full rounded-lg flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/10 shrink-0 bg-black/20">
        <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider">Active Targets ({objects.length})</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sorted.map(neo => {
          const hazard = neo.isPotentiallyHazardous;
          return (
            <button
              key={neo.id}
              onClick={() => onSelectNeo(neo.id)}
              className={`w-full text-left p-3 rounded transition-colors flex items-center justify-between ${
                selectedNeoId === neo.id 
                  ? 'bg-primary/20 border border-primary/50' 
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div>
                <div className="font-mono font-bold text-sm truncate max-w-[140px]">{neo.name}</div>
                <div className="text-xs text-white/50 mt-1">
                  {(neo.nextCloseApproach.missDistanceLunar).toFixed(2)} LD
                </div>
              </div>
              {hazard && (
                <div className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded border border-red-500/30">
                  HAZARD
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  );
}

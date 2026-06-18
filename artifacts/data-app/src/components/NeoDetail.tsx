import { X } from 'lucide-react';
import type { NeoObject } from '@workspace/api-client-react';

export default function NeoDetail({ neo, onClose }: { neo: NeoObject; onClose: () => void }) {
  return (
    <div className="glass-panel rounded-lg p-5 w-full relative overflow-hidden">
      {neo.isPotentiallyHazardous && (
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
      )}

      <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"><X size={16} /></button>

      <div className="mb-6 pr-6">
        <h2 className="text-xl font-mono font-bold">{neo.name}</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${neo.isPotentiallyHazardous ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
            {neo.isPotentiallyHazardous ? 'Hazardous' : 'Safe'}
          </span>
          <span className="text-xs text-white/50">{neo.orbitClass}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/30 p-3 rounded border border-white/5">
          <div className="text-[10px] uppercase text-white/50 mb-1 tracking-wider">Miss Distance</div>
          <div className="font-mono text-lg">{neo.nextCloseApproach.missDistanceLunar.toFixed(2)} <span className="text-xs text-white/50">LD</span></div>
          <div className="text-xs text-white/40 font-mono mt-0.5">{Number(neo.nextCloseApproach.missDistanceKm).toLocaleString(undefined, {maximumFractionDigits: 0})} km</div>
        </div>
        <div className="bg-black/30 p-3 rounded border border-white/5">
          <div className="text-[10px] uppercase text-white/50 mb-1 tracking-wider">Velocity</div>
          <div className="font-mono text-lg">{neo.nextCloseApproach.relativeVelocityKmS.toFixed(2)} <span className="text-xs text-white/50">km/s</span></div>
          <div className="text-xs text-white/40 font-mono mt-0.5">{Number(neo.nextCloseApproach.relativeVelocityKmH).toLocaleString(undefined, {maximumFractionDigits: 0})} km/h</div>
        </div>
        <div className="bg-black/30 p-3 rounded border border-white/5">
          <div className="text-[10px] uppercase text-white/50 mb-1 tracking-wider">Est. Diameter</div>
          <div className="font-mono text-sm leading-tight">
            {neo.estimatedDiameterMinKm.toFixed(3)} – {neo.estimatedDiameterMaxKm.toFixed(3)} <span className="text-xs text-white/50">km</span>
          </div>
        </div>
        <div className="bg-black/30 p-3 rounded border border-white/5">
          <div className="text-[10px] uppercase text-white/50 mb-1 tracking-wider">Approach Date</div>
          <div className="font-mono text-sm leading-tight">{new Date(neo.nextCloseApproach.date).toLocaleDateString()}</div>
        </div>
      </div>

      <a
        href={neo.nasaJplUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-sm text-white/80 transition-colors"
      >
        View NASA JPL Record
      </a>
    </div>
  );
}

import { useState, useEffect } from "react";
import Scene from "@/components/Scene";
import NeoSidebar from "@/components/NeoSidebar";
import KpiCards from "@/components/KpiCards";
import NeoDetail from "@/components/NeoDetail";
import { useGetApproachingNeo } from "@workspace/api-client-react";

export default function Tracker() {
  const [selectedNeoId, setSelectedNeoId] = useState<string | null>(null);
  const [time, setTime] = useState(new Date().toISOString());
  const { data } = useGetApproachingNeo();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toISOString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedNeo = selectedNeoId
    ? data?.objects.find((o) => o.id === selectedNeoId) ?? null
    : null;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050510] text-white selection:bg-primary/30">
      <div className="absolute inset-0 z-0">
        <Scene selectedNeoId={selectedNeoId} onSelectNeo={setSelectedNeoId} />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="glass-panel p-4 rounded-lg pointer-events-auto">
            <h1 className="text-xl font-bold tracking-widest text-white/90">NEAR-EARTH OBJECT TRACKER</h1>
            <div className="text-sm font-mono text-white/50 mt-1">{time}</div>
          </div>
          <div className="pointer-events-auto">
            <KpiCards />
          </div>
        </div>

        <div className="flex justify-between items-end h-full mt-6 gap-6">
          <div className="pointer-events-auto h-full max-h-[60vh] w-80">
            <NeoSidebar selectedNeoId={selectedNeoId} onSelectNeo={setSelectedNeoId} />
          </div>
          {selectedNeo && (
            <div className="pointer-events-auto w-96 self-end">
              <NeoDetail neo={selectedNeo} onClose={() => setSelectedNeoId(null)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

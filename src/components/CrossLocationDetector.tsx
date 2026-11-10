import React, { useState } from 'react';
import { 
  Network, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Layers, 
  Send, 
  ArrowRight, 
  Sparkles,
  Wrench,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';
import { SystemicPattern } from '../types/franchise';
import confetti from 'canvas-confetti';

interface CrossLocationDetectorProps {
  patterns: SystemicPattern[];
  onInspectStore: (storeNumber: number) => void;
  onDispatchRemediation: (patternId: string) => void;
}

export const CrossLocationDetector: React.FC<CrossLocationDetectorProps> = ({
  patterns,
  onInspectStore,
  onDispatchRemediation,
}) => {
  const [selectedPattern, setSelectedPattern] = useState<SystemicPattern>(patterns[0]);
  const [dispatchedId, setDispatchedId] = useState<string | null>(null);

  const handleDispatch = (pat: SystemicPattern) => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
    setDispatchedId(pat.id);
    onDispatchRemediation(pat.id);
    setTimeout(() => setDispatchedId(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Hero Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded tracking-wide shadow-xs">
                Network-wide
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cross-location patterns</h1>
            </div>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              Traditional auditing only inspects stores in isolation. FranchiseGuard AI compares <strong>500 locations simultaneously</strong> to identify multi-store supplier defects, regional training lapses, and vendor maintenance failures before they trigger catastrophic brand damage.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 bg-indigo-50/80 rounded-xl border border-indigo-200 text-right shadow-xs">
              <span className="text-[10px] uppercase font-extrabold text-indigo-700">Fleet Anomalies Active</span>
              <div className="text-2xl font-extrabold text-slate-900">{patterns.length} Systemic Clusters</div>
              <span className="text-[11px] text-emerald-700 font-bold">45 Stores Impacted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {patterns.map((pat) => {
          const isSelected = selectedPattern.id === pat.id;
          const isCrit = pat.severity === 'critical';
          return (
            <div
              key={pat.id}
              onClick={() => setSelectedPattern(pat)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-50/60 border-indigo-600 shadow-sm ring-1 ring-indigo-600'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-extrabold text-indigo-700 uppercase tracking-wider text-[10px]">{pat.id}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      isCrit
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}
                  >
                    {pat.severity}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 line-clamp-2">{pat.title}</h3>
                <p className="text-slate-500 text-[11px] mt-1.5 line-clamp-2 leading-relaxed">{pat.patternDescription}</p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-amber-800 font-bold">{pat.affectedStoresCount} Stores Affected</span>
                <span className="text-slate-500 font-medium">{pat.category.split(' ')[0]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Investigation Card for Selected Systemic Pattern */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                CLUSTER {selectedPattern.id}
              </span>
              <h2 className="text-base font-bold text-slate-900">{selectedPattern.title}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">{selectedPattern.patternDescription}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-dispatch-fleet-remediation"
              onClick={() => handleDispatch(selectedPattern)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>Dispatch Fleet Remediation ({selectedPattern.affectedStoresCount} Stores)</span>
            </button>
          </div>
        </div>

        {dispatchedId === selectedPattern.id && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2 animate-fadeIn shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Fleet Remediation Mandate successfully issued! ArcticSupply OEM warranty replacement triggered for all {selectedPattern.affectedStoresCount} affected stores.
            </span>
          </div>
        )}

        {/* 4 Root-Cause Hypothesis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs shadow-xs">
            <div className="flex items-center gap-2 font-bold text-indigo-700">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Correlation Signature</span>
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed">{selectedPattern.detectedCorrelation}</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs shadow-xs">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Hypothesized Root Cause</span>
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed">{selectedPattern.hypothesizedRootCause}</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs shadow-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Estimated Risk & Liability</span>
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed font-bold">{selectedPattern.potentialCostRisk}</p>
          </div>
        </div>

        {/* Affected Store Fleet Grid */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Affected Franchise Locations ({selectedPattern.affectedStoresCount} Stores)
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Click any store tag to drill into audit logs</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedPattern.affectedStoreNumbers.map((storeNum) => (
              <button
                key={storeNum}
                onClick={() => onInspectStore(storeNum)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  storeNum === 247
                    ? 'bg-red-50 border-red-400 text-red-700 ring-2 ring-red-400/40 animate-pulse'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              >
                <span>Store #{storeNum}</span>
                {storeNum === 247 && <span className="text-[9px] bg-red-600 text-white px-1 rounded">Spotlight</span>}
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Recommended Strategic Fleet Action */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="space-y-1">
            <span className="font-bold text-indigo-700 uppercase text-[10px]">Recommended Strategic Fleet Action</span>
            <p className="text-slate-800 font-medium">{selectedPattern.recommendedFleetAction}</p>
          </div>
          <span className="text-slate-600 text-[11px] shrink-0 font-medium">Status: <strong className="text-slate-900">{selectedPattern.status}</strong></span>
        </div>
      </div>
    </div>
  );
};

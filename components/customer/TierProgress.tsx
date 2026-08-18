interface TierProgressProps {
  points: number;
}

export default function TierProgress({ points }: TierProgressProps) {
  // ALGORITMA PROGRESS BAR PRESISI
  const getProgressWidth = (pts: number) => {
    if (pts < 101) return (pts / 100) * 33.33;
    if (pts < 301) return 33.33 + ((pts - 101) / 200) * 33.33;
    if (pts < 501) return 66.66 + ((pts - 301) / 200) * 33.33;
    return 100;
  };

  const progressWidth = getProgressWidth(points);

  return (
    <div className="bg-transparent border border-transparent rounded-3xl p-8 shadow-lg">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-xl font-black text-white">Perjalanan Tier Kamu</h3>
          <p className="text-slate-500 text-sm mt-1">Kumpulkan poin untuk naik level berikutnya!</p>
        </div>
        <span className="text-[#4318FF] font-bold bg-emerald-950/30 px-3 py-1 rounded-lg text-sm">{points} Pts</span>
      </div>
      
      <div className="relative pt-2">
        <div className="h-3 w-full bg-stone-900 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out rounded-full" 
            style={{ width: `${progressWidth}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-widest">
          <span className="w-1/4 text-left">REG (0)</span>
          <span className="w-1/4 text-center">SLV (101)</span>
          <span className="w-1/4 text-center">GLD (301)</span>
          <span className="w-1/4 text-right text-[#4318FF]">PLAT (501+)</span>
        </div>
      </div>
    </div>
  );
}
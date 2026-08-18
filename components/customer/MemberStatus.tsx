import { Award, Star } from "lucide-react";

interface MemberStatusProps {
  name: string;
  tier: string;
  points: number;
  discount: number;
}

export default function MemberStatus({ name, tier, points, discount }: MemberStatusProps) {
  return (
    <div className="bg-transparent border border-transparent rounded-3xl p-8 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Award size={160} />
      </div>
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="text-[#4318FF] font-bold text-sm tracking-widest uppercase mb-1">Status Profil Member</p>
          <h1 className="text-4xl font-black text-white">{name}</h1>
        </div>
        {discount > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2">
            <Star size={16} fill="currentColor" /> DISKON {discount * 100}% AKTIF
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-100/60 relative z-10">
        <div>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-1">Tingkatan Member</p>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Star className={discount > 0 ? "text-amber-400" : "text-slate-400"} size={24} fill="currentColor" /> 
            {tier}
          </h2>
        </div>
        <div className="md:text-right">
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-1">Akumulasi Poin</p>
          <h2 className="text-3xl font-black text-[#4318FF]">{points} Pts</h2>
        </div>
      </div>
    </div>
  );
}
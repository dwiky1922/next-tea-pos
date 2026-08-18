"use client";

import { useState, useEffect } from "react";
import { Sparkles, LogOut, Coffee } from "lucide-react";

export default function MemberSidebar() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [customerData, setCustomerData] = useState<any>(null);

  useEffect(() => {
    const loadSessionData = async () => {
      const stored = localStorage.getItem("nextTea_customer");
      if (stored) {
        setCustomerData(JSON.parse(stored));
      }
    };
    
    loadSessionData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("nextTea_customer");
    localStorage.removeItem("nextTea_user");
    window.location.replace("/member-login");
  };

  const displayUser = customerData?.username || customerData?.name || "Member";
  const displayPoints = customerData?.points || 0;
  
  let displayTier = "Regular Member";
  if (displayPoints >= 501) displayTier = "Platinum";
  else if (displayPoints >= 301) displayTier = "Gold";
  else if (displayPoints >= 101) displayTier = "Silver";

  const getInitial = (name: string) => (name ? name.charAt(0).toUpperCase() : "M");

  return (
    <aside className="w-64 bg-[#4318FF] text-white flex flex-col h-full flex-shrink-0 select-none md:rounded-r-[2.5rem] shadow-2xl z-20 transition-all font-sans">
      
      {/* Brand Header */}
      <div className="p-8 flex items-center gap-3 relative z-10">
        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-[#4318FF] shadow-sm">
          <Coffee size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">Next Tea</h1>
          <p className="text-[9px] text-indigo-200 font-bold tracking-widest uppercase mt-0.5">Membership Area</p>
        </div>
      </div>

      {/* Profil User */}
      <div className="mx-5 mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 flex items-center gap-3 relative z-10 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#4318FF] font-black text-sm flex-shrink-0">
          {getInitial(displayUser)}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-bold text-white truncate">{displayUser}</p>
          <p className="text-[10px] text-yellow-300 font-bold truncate mt-0.5">{displayTier}</p>
        </div>
      </div>

      {/* Navigasi Menu */}
      <nav className="flex-1 px-5 py-2 space-y-2 relative z-10 overflow-y-auto">
        <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold bg-white text-[#4318FF] shadow-md scale-[1.02] cursor-pointer transition-all">
          <Sparkles size={20} />
          <span className="text-sm">Katalog & Poin</span>
        </div>
      </nav>

      {/* Tombol Keluar */}
      <div className="p-6 relative z-10 mt-auto">
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-white/10 hover:bg-rose-500 text-white transition-all border border-transparent shadow-sm cursor-pointer"
        >
          <LogOut size={18} />
          <span className="text-sm font-bold">Keluar Akun</span>
        </button>
      </div>

    </aside>
  );
}
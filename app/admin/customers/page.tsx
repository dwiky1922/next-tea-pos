"use client";

import { useState, useEffect } from "react";
import { 
  Contact, 
  UserPlus, 
  Award, 
  Phone, 
  Calendar, 
  MoreVertical, 
  Sparkles,
  X,
  Plus,
  Minus
} from "lucide-react";
import { collection, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Tipe data spesifik untuk Timestamp Firebase agar tidak menggunakan 'any'
interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

interface CustomerData {
  id: string;
  username: string;
  contact: string;
  points: number;
  totalSpent?: number;
  createdAt?: FirebaseTimestamp | null;
}

export default function CustomersManagementPage() {
  const [customersList, setCustomersList] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);

  // Form States
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [editPointsAction, setEditPointsAction] = useState<number>(0);

  // Real-time Listener ke Firestore
  useEffect(() => {
    const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersData: CustomerData[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        customersData.push({
          id: docSnap.id,
          username: data.username || "Tanpa Nama",
          contact: data.contact || "-",
          points: data.points || 0,
          totalSpent: data.totalSpent || 0,
          createdAt: data.createdAt || null
        });
      });
      setCustomersList(customersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data pelanggan:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fungsi Menentukan Tier (Diperbarui untuk Light Mode)
  const getTierDetails = (points: number) => {
    if (points >= 501) return { name: "Platinum Member", classes: "bg-purple-50 text-purple-600 border border-purple-100" };
    if (points >= 301) return { name: "Gold Member", classes: "bg-yellow-50 text-yellow-600 border border-yellow-100" };
    if (points >= 101) return { name: "Silver Member", classes: "bg-indigo-50 text-[#4318FF] border border-indigo-100" };
    return { name: "Regular", classes: "bg-slate-50 text-slate-500 border border-slate-200" };
  };

  // Fungsi Daftarkan Member Baru
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newContact) return;

    try {
      await addDoc(collection(db, "customers"), {
        username: newName,
        contact: newContact,
        points: 0,
        totalSpent: 0,
        createdAt: serverTimestamp()
      });
      setIsAddModalOpen(false);
      setNewName("");
      setNewContact("");
    } catch (error) {
      console.error("Gagal menambahkan pelanggan:", error);
      alert("Terjadi kesalahan saat menambahkan pelanggan.");
    }
  };

  // Fungsi Update Poin Member
  const handleUpdatePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      const customerRef = doc(db, "customers", selectedCustomer.id);
      const newTotalPoints = selectedCustomer.points + editPointsAction;
      
      const finalPoints = newTotalPoints < 0 ? 0 : newTotalPoints;

      await updateDoc(customerRef, {
        points: finalPoints
      });
      
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
      setEditPointsAction(0);
    } catch (error) {
      console.error("Gagal memperbarui poin:", error);
      alert("Terjadi kesalahan saat memperbarui poin.");
    }
  };

  // Format Tanggal Firebase
  const formatDate = (timestamp: FirebaseTimestamp | null | undefined) => {
    if (!timestamp || !timestamp.seconds) return "Baru bergabung";
    return new Date(timestamp.seconds * 1000).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F4F7FE] text-slate-900 p-6 md:p-8 relative z-0 font-sans flex flex-col">
      
      {/* Ornamen Background */}
      <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-[#4318FF]/5 blur-[120px]"></div>
      </div>
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Contact className="text-[#4318FF]" size={32} />
            Kelola Pelanggan & Member
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Pantau basis data pelanggan setia, tingkat keanggotaan, dan akumulasi poin.</p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#4318FF] hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-[0_8px_20px_rgba(67,24,255,0.25)]"
        >
          <Plus size={18} /> Tambah Member Baru
        </button>
      </div>

      {/* Tabel Pelanggan */}
      <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] border border-slate-100 flex flex-col overflow-hidden flex-1">
        
        <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Sparkles size={18} className="text-[#4318FF]" /> Daftar Loyalitas Pelanggan (Member POS)
          </div>
          <div className="text-sm font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            Total <span className="text-[#4318FF] font-black">{customersList.length}</span> member aktif
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-1 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10">
                <th className="px-6 py-5 font-bold whitespace-nowrap">ID Member</th>
                <th className="px-6 py-5 font-bold whitespace-nowrap">Nama & Telepon</th>
                <th className="px-6 py-5 font-bold whitespace-nowrap">Tier Keanggotaan</th>
                <th className="px-6 py-5 font-bold whitespace-nowrap">Poin Loyalitas</th>
                <th className="px-6 py-5 font-bold whitespace-nowrap">Terdaftar Sejak</th>
                <th className="px-6 py-5 font-bold text-center whitespace-nowrap">Aksi Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-[#4318FF] border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium">Memuat data pelanggan...</span>
                    </div>
                  </td>
                </tr>
              ) : customersList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium bg-slate-50/50">
                    Belum ada pelanggan terdaftar.
                  </td>
                </tr>
              ) : (
                customersList.map((cust) => {
                  const tier = getTierDetails(cust.points);
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-5 font-bold text-[#4318FF] uppercase">
                        {cust.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-900">{cust.username}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                          <Phone size={12} /> {cust.contact}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 w-max uppercase tracking-widest shadow-sm ${tier.classes}`}>
                          <Award size={14} />
                          {tier.name}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-black text-[#4318FF] bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 text-xs flex items-center gap-1.5 w-max shadow-sm">
                          <Sparkles size={14} /> {cust.points.toLocaleString("id-ID")} Poin
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-500 text-xs">
                        <span className="flex items-center gap-1.5 font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-max">
                          <Calendar size={14} className="text-slate-400" />
                          {formatDate(cust.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button 
                          onClick={() => { setSelectedCustomer(cust); setIsEditModalOpen(true); }}
                          className="px-4 py-2 bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-500 hover:text-[#4318FF] rounded-xl transition-all text-xs font-bold flex items-center gap-2 mx-auto shadow-sm"
                        >
                          Kelola Poin <MoreVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-400">
          <span>Perubahan poin akan langsung ter-update di dashboard pelanggan secara Real-Time.</span>
          <span>Halaman 1</span>
        </div>
      </div>

      {/* ================= MODAL TAMBAH PELANGGAN ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <UserPlus size={20} className="text-[#4318FF]" /> Member Baru
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Daftarkan pelanggan ke sistem loyalti.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddCustomer} className="p-6 space-y-5 bg-slate-50/50">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider ml-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  required 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="Cth: Rina Salsabila" 
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:border-[#4318FF] focus:ring-4 focus:ring-[#4318FF]/10 focus:outline-none transition-all font-bold placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider ml-1">No. WhatsApp / Email</label>
                <input 
                  type="text" 
                  required 
                  value={newContact} 
                  onChange={(e) => setNewContact(e.target.value)} 
                  placeholder="Cth: 08123456789" 
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:border-[#4318FF] focus:ring-4 focus:ring-[#4318FF]/10 focus:outline-none transition-all font-bold placeholder-slate-400"
                />
              </div>
              <div className="pt-3">
                <button type="submit" className="w-full py-4 bg-[#4318FF] hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition-all shadow-[0_8px_20px_rgba(67,24,255,0.25)]">
                  Simpan & Daftarkan Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KELOLA POIN ================= */}
      {isEditModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">Kelola Poin</h3>
              <button onClick={() => { setIsEditModalOpen(false); setEditPointsAction(0); }} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 bg-slate-50/50">
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Pelanggan</p>
                <p className="text-lg font-black text-slate-900 mb-4">{selectedCustomer.username}</p>
                
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Poin Saat Ini</p>
                  <p className="text-3xl font-black text-[#4318FF]">{selectedCustomer.points} <span className="text-base text-indigo-300 font-bold">Pts</span></p>
                </div>
              </div>

              <form onSubmit={handleUpdatePoints} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-3 text-center uppercase tracking-widest">Sesuaikan Poin (Tambah/Kurang)</label>
                  <div className="flex items-center justify-center gap-4">
                    <button type="button" onClick={() => setEditPointsAction(prev => prev - 10)} className="w-12 h-12 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-full flex items-center justify-center border border-rose-100 transition-colors shadow-sm">
                      <Minus size={20} strokeWidth={3} />
                    </button>
                    <div className="w-28 relative">
                      <input 
                        type="number" 
                        value={editPointsAction} 
                        onChange={(e) => setEditPointsAction(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-3 text-center text-xl font-black text-slate-900 focus:border-[#4318FF] focus:ring-4 focus:ring-[#4318FF]/10 focus:outline-none transition-all shadow-sm"
                      />
                    </div>
                    <button type="button" onClick={() => setEditPointsAction(prev => prev + 10)} className="w-12 h-12 bg-indigo-50 text-[#4318FF] hover:bg-indigo-100 hover:text-indigo-700 rounded-full flex items-center justify-center border border-indigo-100 transition-colors shadow-sm">
                      <Plus size={20} strokeWidth={3} />
                    </button>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 text-center mt-4 bg-white border border-slate-100 p-2 rounded-lg">Gunakan minus (-) untuk mengurangi poin, cth: penukaran hadiah.</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button type="submit" disabled={editPointsAction === 0} className="w-full py-4 bg-[#4318FF] hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none text-white font-bold text-sm rounded-2xl transition-all shadow-[0_8px_20px_rgba(67,24,255,0.25)]">
                    Terapkan Perubahan Poin
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
"use client";

import { useState } from "react";
import { Package, AlertCircle, Plus, Layers, ArrowUpCircle, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { useData } from "@/context/DataContext"; 
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminInventoryPage() {
  const { inventory, restockItem } = useData(); 

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, id: string, name: string} | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Bahan Tambahan",
    stock: "",
    maxStock: "",
    unit: "kg"
  });

  const getRestockDetails = (itemName: string) => {
    if (itemName.includes("Cup")) return { cost: 15000, qty: 50 };
    if (itemName.includes("Gula") || itemName.includes("Teh") || itemName.includes("Matcha")) return { cost: 25000, qty: 2 };
    if (itemName.includes("Sirup")) return { cost: 12000, qty: 3 };
    if (itemName.includes("Boba") || itemName.includes("Jelly")) return { cost: 20000, qty: 5 };
    return { cost: 15000, qty: 5 }; 
  };

  const handleRestockClick = (id: string, name: string) => {
    setConfirmModal({ isOpen: true, id, name });
  };

  const executeRestock = () => {
    if (confirmModal) {
      const details = getRestockDetails(confirmModal.name);
      restockItem(confirmModal.id, details.qty, details.cost);
      setConfirmModal(null);
      setSuccessMsg(`Stok ${confirmModal.name} berhasil ditambahkan (+${details.qty} unit)! Kas dipotong Rp ${details.cost.toLocaleString("id-ID")}.`);
    }
  };

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.stock || !newItem.maxStock || !newItem.unit) return;

    try {
      setIsSubmitting(true);
      const stockNum = parseFloat(newItem.stock);
      const maxStockNum = parseFloat(newItem.maxStock);

      const percentage = (stockNum / maxStockNum) * 100;
      let newStatus = "Aman"; let newColor = "bg-[#4318FF]"; // Default warna bar Ungu
      if (percentage <= 20) { newStatus = "Kritis"; newColor = "bg-rose-500"; }
      else if (percentage <= 40) { newStatus = "Menipis"; newColor = "bg-amber-500"; }
      else if (percentage <= 60) { newStatus = "Cukup"; newColor = "bg-blue-500"; }

      await addDoc(collection(db, "inventory"), {
        name: newItem.name,
        category: newItem.category,
        stock: stockNum,
        maxStock: maxStockNum,
        unit: newItem.unit,
        status: newStatus,
        barColor: newColor
      });

      setShowAddModal(false);
      setNewItem({ name: "", category: "Bahan Tambahan", stock: "", maxStock: "", unit: "kg" });
      setSuccessMsg(`Bahan baku "${newItem.name}" berhasil ditambahkan ke gudang!`);

    } catch (error) {
      console.error("Gagal menambah bahan:", error);
      alert("Terjadi kesalahan saat menyimpan bahan baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDetails = confirmModal ? getRestockDetails(confirmModal.name) : { cost: 0, qty: 0 };

  return (
    <div className="h-full overflow-y-auto relative bg-[#F4F7FE] text-slate-900 z-0 font-sans">
      
      {/* Background Soft Ornament */}
      <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] right-[10%] w-[45%] h-[45%] rounded-full bg-[#4318FF]/5 blur-[140px]"></div>
      </div>
      
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Package className="text-[#4318FF]" size={32} />
              Stok & Bahan Baku
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Pantau ketersediaan inventaris dan lakukan restock secara real-time.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#4318FF] hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-[0_8px_20px_rgba(67,24,255,0.25)]"
          >
            <Plus size={18} /> Tambah Bahan Baru
          </button>
        </div>

        {/* Tabel Container */}
        <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[#4318FF]" />
              <span className="text-sm font-bold text-slate-800">Daftar Inventaris Gudang</span>
            </div>
            <div className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              Total <span className="text-[#4318FF] font-black">{inventory.length}</span> item terdaftar
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-5 font-bold">ID Item</th>
                  <th className="px-6 py-5 font-bold">Nama Bahan / Cup</th>
                  <th className="px-6 py-5 font-bold">Kategori</th>
                  <th className="px-6 py-5 font-bold">Jumlah Stok</th>
                  <th className="px-6 py-5 font-bold">Status</th>
                  <th className="px-6 py-5 font-bold text-center">Aksi (Harga Restock)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {inventory.map((item, idx) => {
                  // Konfigurasi Warna Badge Modern Terang
                  let badgeColor = "bg-slate-100 text-slate-600 border-slate-200";
                  let dotColor = "bg-slate-400";
                  if (item.status === "Aman") { badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100"; dotColor = "bg-emerald-500"; }
                  if (item.status === "Cukup") { badgeColor = "bg-blue-50 text-blue-700 border-blue-100"; dotColor = "bg-blue-500"; }
                  if (item.status === "Menipis") { badgeColor = "bg-amber-50 text-amber-700 border-amber-100"; dotColor = "bg-amber-500"; }
                  if (item.status === "Kritis" || item.status === "Habis") { badgeColor = "bg-rose-50 text-rose-700 border-rose-100"; dotColor = "bg-rose-500"; }

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-5 font-bold text-[#4318FF] max-w-[120px] truncate" title={item.id}>{item.id}</td>
                      <td className="px-6 py-5 font-bold text-slate-900 flex items-center gap-2">
                        {item.name}
                        {item.status === "Kritis" && <AlertCircle size={14} className="text-rose-500 animate-pulse" />}
                      </td>
                      <td className="px-6 py-5">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[11px] font-bold tracking-wide border border-slate-200">{item.category}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-2 w-48">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-900">{item.stock} <span className="text-slate-500 font-normal">{item.unit}</span></span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all" 
                              style={{ 
                                width: `${Math.min((item.stock / item.maxStock) * 100, 100)}%`,
                                backgroundColor: item.status === "Aman" ? "#4318FF" : item.status === "Cukup" ? "#60a5fa" : item.status === "Menipis" ? "#fbbf24" : "#f43f5e" 
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center w-max gap-2 border ${badgeColor}`}>
                          <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button 
                          onClick={() => handleRestockClick(item.id, item.name)}
                          className="px-4 py-2 bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 hover:text-[#4318FF] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 mx-auto shadow-sm"
                        >
                          <ArrowUpCircle size={14} /> Isi Ulang
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* POP-UP MODAL TAMBAH BAHAN BARU */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            
            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Package size={20} className="text-[#4318FF]" /> Tambah Bahan Baru
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Daftarkan bahan baku atau topping baru.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="p-6 space-y-5 bg-slate-50/50">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Nama Bahan</label>
                <input 
                  type="text" required placeholder="Cth: Bubuk Matcha, Boba Aren..."
                  value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#4318FF] focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Kategori</label>
                  <select 
                    value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#4318FF] focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-medium appearance-none"
                  >
                    <option value="Bahan Utama">Bahan Utama</option>
                    <option value="Perasa">Perasa (Sirup/Bubuk)</option>
                    <option value="Bahan Tambahan">Bahan Tambahan</option>
                    <option value="Kemasan">Kemasan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Satuan</label>
                  <select 
                    value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#4318FF] focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-medium appearance-none"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="gram">Gram (gr)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="btl">Botol (btl)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="pack">Pack / Porsi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Stok Awal</label>
                  <input 
                    type="number" step="0.1" required placeholder="0"
                    value={newItem.stock} onChange={(e) => setNewItem({...newItem, stock: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#4318FF] focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Kapasitas Max</label>
                  <input 
                    type="number" step="0.1" required placeholder="Cth: 100"
                    value={newItem.maxStock} onChange={(e) => setNewItem({...newItem, maxStock: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-[#4318FF] focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full py-4 flex items-center justify-center gap-2 text-white font-bold text-sm rounded-2xl transition-all ${
                    isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-[#4318FF] hover:bg-indigo-700 shadow-[0_8px_20px_rgba(67,24,255,0.25)]"
                  }`}
                >
                  {isSubmitting ? "Menyimpan..." : <><CheckCircle2 size={18} /> Simpan Bahan Baku</>}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* POP-UP KONFIRMASI RESTOCK */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
              <AlertTriangle size={36} className="text-[#4318FF]" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Konfirmasi Isi Ulang</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
              Anda akan membeli stok untuk <strong className="text-slate-900">{confirmModal.name}</strong>.<br/><br/>
              Aksi ini akan memberi <span className="text-[#4318FF] font-black bg-indigo-50 px-2 py-0.5 rounded">Stok +{currentDetails.qty} {inventory.find(i=>i.id===confirmModal.id)?.unit}</span> dan memotong <span className="text-rose-500 font-black bg-rose-50 px-2 py-0.5 rounded">Kas Rp {currentDetails.cost.toLocaleString("id-ID")}</span>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-2xl border border-slate-200 transition-all">Batal</button>
              <button onClick={executeRestock} className="flex-1 py-4 bg-[#4318FF] hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition-all shadow-[0_8px_20px_rgba(67,24,255,0.25)]">Ya, Beli</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUKSES */}
      {successMsg && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
              <CheckCircle2 size={40} className="text-[#4318FF]" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Berhasil!</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">{successMsg}</p>
            <button onClick={() => setSuccessMsg(null)} className="w-full py-4 bg-[#4318FF] hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition-all shadow-[0_8px_20px_rgba(67,24,255,0.25)] active:scale-[0.98]">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
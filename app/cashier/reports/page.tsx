"use client";

import { useState } from "react";
import { useData, Transaction } from "@/context/DataContext"; 
import { Download, Eye, X, Receipt, Search, TrendingDown, TrendingUp } from "lucide-react"; 
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ReportsPage() {
  const { transactions } = useData();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Filter pencarian
  const filteredTransactions = transactions.filter(trx => 
    trx.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (trx.cashier && trx.cashier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const now = new Date();
  const todayFormatted = now.toLocaleDateString("id-ID", { dateStyle: "medium" }); 
  const todayParts = todayFormatted.split(" ");
  const thisMonthStr = `${todayParts[1]} ${todayParts[2]}`; 

  const prevDate = new Date();
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevFormatted = prevDate.toLocaleDateString("id-ID", { dateStyle: "medium" });
  const prevParts = prevFormatted.split(" ");
  const prevMonthStr = `${prevParts[1]} ${prevParts[2]}`;

  let pengeluaranHariIni = 0;
  let pengeluaranBulanIni = 0;
  let pengeluaranBulanLalu = 0;
  let pendapatanBulanIni = 0;

  const formatDisplayDate = (dateObj: unknown) => {
    if (typeof dateObj === "string") return dateObj;
    if (dateObj && typeof dateObj === "object" && "toDate" in dateObj) {
      const firebaseDate = dateObj as { toDate: () => Date };
      if (typeof firebaseDate.toDate === "function") {
        const d = firebaseDate.toDate();
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${d.getHours().toString().padStart(2, '0')}.${d.getMinutes().toString().padStart(2, '0')}`;
      }
    }
    return "";
  };

  transactions.forEach(trx => {
    if (!trx.date) return;
    const dateStr = formatDisplayDate(trx.date);
    if (!dateStr) return;
    
    const trxDateOnly = dateStr.split(",")[0].trim(); 
    const trxParts = trxDateOnly.split(" ");
    
    if (trxParts.length < 3) return; 
    
    const trxMonthStr = `${trxParts[1]} ${trxParts[2]}`;

    if (trx.type === "Pengeluaran") {
      if (trxDateOnly === todayFormatted) pengeluaranHariIni += (trx.total || 0);
      if (trxMonthStr === thisMonthStr) pengeluaranBulanIni += (trx.total || 0);
      if (trxMonthStr === prevMonthStr) pengeluaranBulanLalu += (trx.total || 0);
    } else {
      if (trxMonthStr === thisMonthStr) pendapatanBulanIni += (trx.total || 0);
    }
  });

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const q = query(collection(db, "transactions"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      
      const firebaseData: Transaction[] = [];
      querySnapshot.forEach((doc) => { firebaseData.push(doc.data() as Transaction); });

      if (firebaseData.length === 0) {
        alert("Tidak ada data transaksi di database.");
        setIsExporting(false);
        return;
      }

      const headers = ["ID_TRX", "WAKTU", "KASIR", "PEMBAYARAN", "TOTAL_RP", "STATUS", "TIPE", "DETAIL_ITEM"];
      const csvRows = [headers.join(";")]; 

      firebaseData.forEach(trx => {
        let detailItems = "Tidak ada detail";
        if (trx.items && trx.items.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          detailItems = trx.items.map((item: any) => {
            const safeQty = item.qty ?? item.quantity ?? 1;
            return `${safeQty}x ${item.name || "Produk"} (${item.size || "-"})`;
          }).join(" | ");
        } else if (trx.type === "Pengeluaran") {
          detailItems = trx.method || "-"; 
        }

        const csvDate = formatDisplayDate(trx.date);
        const row = [`"${trx.id}"`, `"${csvDate}"`, `"${trx.cashier || "-"}"`, `"${trx.method || "-"}"`, trx.total || 0, `"${trx.status || "-"}"`, `"${trx.type || 'Pemasukan'}"`, `"${detailItems}"`];
        csvRows.push(row.join(";")); 
      });

      const csvContent = "\uFEFF" + csvRows.join("\n"); 
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Laporan_Keuangan_NextTea_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Gagal mengekspor data:", error);
      alert("Terjadi kesalahan saat mengunduh laporan.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F4F7FE] text-slate-900 p-6 md:p-8 relative z-0 flex flex-col font-sans">
      
      {/* Ornamen Background */}
      <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] rounded-full bg-[#4318FF]/5 blur-[120px]"></div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Receipt className="text-[#4318FF]" size={32} />
            Laporan Keuangan
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Kelola dan pantau seluruh riwayat transaksi penjualan.</p>
        </div>
        
        <button 
          onClick={handleExportExcel}
          disabled={isExporting}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all border shadow-sm ${
            isExporting 
              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
              : "bg-white hover:bg-indigo-50 text-[#4318FF] border-slate-200 hover:border-indigo-200"
          }`}
        >
          <Download size={18} /> {isExporting ? "Mengunduh..." : "Cetak Excel"}
        </button>
      </div>

      {/* Tabel Utama */}
      <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] border border-slate-100 flex flex-col overflow-hidden mb-8 flex-1 min-h-[400px]">
        
        {/* Header Tabel & Search */}
        <div className="p-6 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari ID Transaksi atau Kasir..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#4318FF] focus:ring-4 focus:ring-[#4318FF]/10 transition-all font-medium placeholder-slate-400" 
            />
          </div>
          <div className="text-sm font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            Menampilkan <span className="text-[#4318FF] font-black">{filteredTransactions.length}</span> transaksi
          </div>
        </div>

        {/* Isi Tabel */}
        <div className="overflow-x-auto overflow-y-auto flex-1 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10">
                <th className="px-6 py-5 font-bold">ID TRX</th>
                <th className="px-6 py-5 font-bold">Waktu</th>
                <th className="px-6 py-5 font-bold">Kasir</th>
                <th className="px-6 py-5 font-bold">Pembayaran</th>
                <th className="px-6 py-5 font-bold">Total</th>
                <th className="px-6 py-5 font-bold text-center">Status</th>
                <th className="px-6 py-5 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className={`px-6 py-5 font-bold max-w-[140px] truncate ${trx.type === "Pengeluaran" ? "text-rose-500" : "text-[#4318FF]"}`} title={trx.id}>{trx.id}</td>
                    <td className="px-6 py-5 text-slate-600 font-medium">{formatDisplayDate(trx.date)}</td>
                    <td className="px-6 py-5 font-bold text-slate-900">{trx.cashier || "-"}</td>
                    <td className="px-6 py-5">
                      <span className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide shadow-sm">{trx.method || "-"}</span>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-900">Rp {(trx.total || 0).toLocaleString("id-ID")}</td>
                    <td className="px-6 py-5 flex justify-center">
                      <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center justify-center w-max gap-2 border ${
                        trx.status === "Berhasil" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${trx.status === "Berhasil" ? "bg-emerald-500" : "bg-slate-400"}`}></div> 
                        {trx.status || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button 
                        onClick={() => setSelectedTrx(trx)} 
                        className="p-2.5 bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-500 hover:text-[#4318FF] rounded-xl transition-all shadow-sm mx-auto flex items-center justify-center" 
                        title="Lihat Detail"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium bg-slate-50/50">
                    <Receipt size={48} className="mx-auto mb-4 text-slate-300" />
                    Belum ada riwayat transaksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4 Kartu Rekapitulasi Keuangan Bawah */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 shrink-0 mt-2">
        <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 rounded-3xl border border-slate-50 transition-transform hover:-translate-y-1 flex items-center gap-5">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-[#4318FF]/10 flex items-center justify-center text-[#4318FF]">
            <TrendingUp size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pendapatan (Bln Ini)</p>
            <h3 className="text-2xl font-black text-slate-900">Rp {pendapatanBulanIni.toLocaleString("id-ID")}</h3>
          </div>
        </div>

        <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 rounded-3xl border border-slate-50 transition-transform hover:-translate-y-1 flex items-center gap-5">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
            <TrendingDown size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pengeluaran (Harian)</p>
            <h3 className="text-2xl font-black text-slate-900">Rp {pengeluaranHariIni.toLocaleString("id-ID")}</h3>
          </div>
        </div>

        <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 rounded-3xl border border-slate-50 transition-transform hover:-translate-y-1 flex items-center gap-5">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
            <TrendingDown size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pengeluaran (Bln Ini)</p>
            <h3 className="text-2xl font-black text-slate-900">Rp {pengeluaranBulanIni.toLocaleString("id-ID")}</h3>
          </div>
        </div>

        <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 rounded-3xl border border-slate-50 transition-transform hover:-translate-y-1 flex items-center gap-5">
          {/* Diganti dari orange ke warna slate netral agar elegan */}
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
            <TrendingDown size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pengeluaran (Bln Lalu)</p>
            <h3 className="text-2xl font-black text-slate-900">Rp {pengeluaranBulanLalu.toLocaleString("id-ID")}</h3>
          </div>
        </div>
      </div>

      {/* Modal Pop-up Detail Transaksi */}
      {selectedTrx && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden border border-slate-100">
            
            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Detail Transaksi</h3>
                <p className={`text-xs font-bold mt-1 uppercase tracking-widest ${selectedTrx.type === "Pengeluaran" ? "text-rose-500" : "text-[#4318FF]"}`}>
                  {selectedTrx.id}
                </p>
              </div>
              <button onClick={() => setSelectedTrx(null)} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 bg-slate-50/50">
              <div className="grid grid-cols-2 gap-4 text-sm border-b border-slate-200 pb-5">
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Kasir / Aktor</p>
                  <p className="font-bold text-slate-900">{selectedTrx.cashier || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Waktu Transaksi</p>
                  <p className="font-bold text-slate-900">{formatDisplayDate(selectedTrx.date)}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">Rincian Item :</p>
                {selectedTrx.items && selectedTrx.items.length > 0 ? (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {selectedTrx.items.map((item: any, idx: number) => {
                      const safeQty = item.qty ?? item.quantity ?? 1;
                      const safePrice = item.price ?? item.finalPrice ?? item.basePrice ?? 0;
                      return (
                        <div key={idx} className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                          <div>
                            <p className="font-bold text-slate-900 text-sm mb-0.5">{item.name || "Item"}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Size {item.size || "-"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-500 font-medium text-xs mb-0.5">{safeQty}x @ Rp {safePrice.toLocaleString("id-ID")}</p>
                            <p className="font-black text-[#4318FF] text-sm">Rp {(safePrice * safeQty).toLocaleString("id-ID")}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-center shadow-sm">
                    <p className="text-sm font-bold text-slate-500">{selectedTrx.method || "Tidak ada rincian item."}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-10">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Biaya</span>
              <span className={`text-2xl font-black ${selectedTrx.type === "Pengeluaran" ? "text-rose-500" : "text-[#4318FF]"}`}>
                Rp {(selectedTrx.total || 0).toLocaleString("id-ID")}
              </span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
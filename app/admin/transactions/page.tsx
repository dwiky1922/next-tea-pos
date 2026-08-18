"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart, Trash2, X, Plus, Minus, CheckCircle2, UserCheck, Printer, Receipt } from "lucide-react";
import { collection, getDocs, query, where, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface MenuItem {
  id: string;
  name: string;
  imageUrl: string;
  priceSmall: number;
  priceLarge: number;
}

interface CartItem {
  cartId: string;
  menuId: string;
  name: string;
  size: string;
  basePrice: number;
  quantity: number;
}

interface MemberData {
  id: string;
  username: string;
  contact: string;
  points: number;
  tier: string;
  discount: number;
}

interface TransactionItem extends CartItem {
  finalPrice: number;
  price: number; 
  qty: number;   
}

interface TransactionData {
  id: string;
  items: TransactionItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  memberId: string | null;
  memberName: string;
  cashier: string;
  method: string;
  type: string;
  status: string;
  date: string; 
}

const generateTrxId = () => {
  return "#TRX-" + Math.floor(1000 + Math.random() * 9000);
};

export default function TransactionPage() {
  const { user } = useAuth();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<"Small" | "Large">("Small");

  const [searchQuery, setSearchQuery] = useState("");
  const [member, setMember] = useState<MemberData | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "menus"));
        const list: MenuItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || "Menu",
            imageUrl: data.imageUrl || "",
            priceSmall: Number(data.priceSmall) || 0,
            priceLarge: Number(data.priceLarge) || 0,
          });
        });
        setMenus(list);
      } catch (err) {
        console.error("Gagal mengambil menu:", err);
      }
    };
    fetchMenus();
  }, []);

  const handleSearchMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setMember(null);
      return;
    }
    
    setIsSearching(true);
    try {
      let q = query(collection(db, "customers"), where("contact", "==", searchQuery.trim()));
      let snap = await getDocs(q);

      if (snap.empty) {
        q = query(collection(db, "customers"), where("username", "==", searchQuery.trim()));
        snap = await getDocs(q);
      }

      if (!snap.empty) {
        const data = snap.docs[0].data();
        const points = data.points || 0;
        let tier = "Regular";
        let discount = 0;

        if (points >= 501) { tier = "Platinum Member"; discount = 0.20; }
        else if (points >= 301) { tier = "Gold Member"; discount = 0.15; }
        else if (points >= 101) { tier = "Silver Member"; discount = 0.10; }

        setMember({ id: snap.docs[0].id, username: data.username, contact: data.contact, points, tier, discount });
      } else {
        setMember(null);
        alert("Member tidak ditemukan dalam sistem.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mencari member.");
    }
    setIsSearching(false);
  };

  const openModal = (menu: MenuItem) => {
    setSelectedMenu(menu);
    setSelectedSize("Small");
  };

  const addToCart = () => {
    if (!selectedMenu) return;
    const basePrice = selectedSize === "Small" ? selectedMenu.priceSmall : selectedMenu.priceLarge;
    
    const existingIndex = cart.findIndex(item => item.menuId === selectedMenu.id && item.size === selectedSize);
    
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        cartId: Date.now().toString(),
        menuId: selectedMenu.id,
        name: selectedMenu.name,
        size: selectedSize,
        basePrice,
        quantity: 1
      }]);
    }
    setSelectedMenu(null);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (cartId: string) => setCart(cart.filter(item => item.cartId !== cartId));

  const subtotal = cart.reduce((acc, item) => acc + (item.basePrice * item.quantity), 0);
  const discountTotal = member ? subtotal * member.discount : 0;
  const finalTotal = subtotal - discountTotal;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentUser = user as any;
      const cashierName = currentUser?.name || currentUser?.username || "Kasir Sistem";

      const finalItems = cart.map(item => {
        const calculatedPrice = item.basePrice * (1 - (member?.discount || 0));
        return {
          ...item, 
          finalPrice: calculatedPrice,
          price: calculatedPrice, 
          qty: item.quantity      
        };
      });

      const now = new Date();
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const formattedDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}`;

      const customId = generateTrxId();

      const txData = {
        id: customId,
        items: finalItems,
        subtotal,
        discountTotal,
        total: finalTotal,
        memberId: member ? member.id : null,
        memberName: member ? member.username : "Guest",
        cashier: cashierName,
        method: "QRIS / Tunai",
        type: "Pemasukan",
        status: "Berhasil",
        date: formattedDate 
      };

      await setDoc(doc(db, "transactions", customId), txData);

      setTransactionData(txData);
      setShowSuccessModal(true);
      setCart([]);
      setMember(null);
      setSearchQuery("");

    } catch (err) {
      console.error(err);
      alert("Gagal memproses pembayaran. Coba lagi.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* CSS KHUSUS PRINT - Dipertahankan karena fungsional */}
      <style>{`
        @media print {
          @page { 
            margin: 0; 
            size: 80mm auto; 
          }
          body { margin: 0; padding: 0; background: white; }
          body * { visibility: hidden; }
          #printable-receipt, #printable-receipt * { visibility: visible; }
          #printable-receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            box-shadow: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="flex h-full bg-[#F4F7FE] font-sans print-hide">
        
        {/* KIRI - KATALOG MENU (Terang) */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-1">Katalog Menu Utama</h2>
          <p className="text-sm text-slate-500 font-medium mb-8">Pilih menu dari database untuk menambahkan ke pesanan.</p>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {menus.map((menu) => (
              <div key={menu.id} onClick={() => openModal(menu)} className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl border border-slate-50 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
                <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={menu.imageUrl} alt={menu.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-80"></div>
                  {member && member.discount > 0 && (
                    <div className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md shadow-lg transform rotate-3">
                      Diskon {member.discount * 100}%
                    </div>
                  )}
                  {/* Teks di atas gambar agar lebih menyatu */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h4 className="text-lg font-black leading-tight drop-shadow-md truncate">{menu.name}</h4>
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-1 justify-center bg-white">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Mulai Dari</p>
                  <div className="flex items-center gap-2">
                    {member && member.discount > 0 && (
                      <span className="text-slate-400 line-through text-xs font-medium">Rp {menu.priceSmall.toLocaleString('id-ID')}</span>
                    )}
                    <span className="text-[#4318FF] font-black text-lg">
                      Rp {((member ? menu.priceSmall * (1 - member.discount) : menu.priceSmall)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KANAN - PANEL KASIR (Terang Bersih) */}
        <div className="w-[400px] bg-white border-l border-slate-100 shadow-2xl flex flex-col h-full shrink-0 z-10">
          
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShoppingCart size={20} className="text-[#4318FF]" /> Pesanan Saat Ini
            </h2>
            <span className="bg-indigo-50 text-[#4318FF] text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-100">{cart.length} Item</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                  <ShoppingCart size={32} className="text-slate-300" />
                </div>
                <p className="font-bold text-sm">Keranjang masih kosong</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.cartId} className="flex gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 mb-0.5">{item.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium mb-3 uppercase tracking-wider">Ukuran: <span className="text-slate-700 font-bold">{item.size}</span></p>
                    
                    <div className="flex items-center gap-2 bg-slate-50 w-max rounded-lg border border-slate-200 p-1">
                      <button onClick={() => updateQuantity(item.cartId, -1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"><Minus size={12}/></button>
                      <span className="text-xs font-bold w-4 text-center text-slate-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartId, 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"><Plus size={12}/></button>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-end">
                    <button onClick={() => removeItem(item.cartId)} className="text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 hover:bg-rose-50 p-2 rounded-lg border border-slate-100"><Trash2 size={14}/></button>
                    <p className="text-sm font-black text-[#4318FF]">Rp {((item.basePrice * (1 - (member?.discount || 0))) * item.quantity).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-10">
            
            {/* Input Member */}
            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Cari Diskon Member</label>
              <form onSubmit={handleSearchMember} className="flex gap-2">
                <input
                  type="text"
                  placeholder="No. HP / Username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/20 focus:bg-white focus:outline-none transition-all font-medium"
                />
                <button type="submit" disabled={isSearching} className="bg-[#4318FF] hover:bg-indigo-700 text-white px-5 rounded-xl flex items-center justify-center transition-all shadow-md">
                  <Search size={18} className={isSearching ? "animate-pulse" : ""} />
                </button>
              </form>

              {member && (
                <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg text-[#4318FF] shadow-sm"><UserCheck size={18} /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{member.username}</p>
                      <p className="text-[10px] text-[#4318FF] font-bold uppercase tracking-wider">{member.tier} (-{member.discount * 100}%)</p>
                    </div>
                  </div>
                  <button onClick={() => setMember(null)} className="text-slate-400 hover:text-rose-500 p-1"><X size={16}/></button>
                </div>
              )}
            </div>

            {/* Total Kalkulasi */}
            <div className="space-y-3 text-sm mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex justify-between text-slate-500 font-bold">
                <span>Subtotal</span>
                <span className="text-slate-900">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {member && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Diskon Member</span>
                  <span>- Rp {discountTotal.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-black text-xl pt-4 border-t border-slate-200 mt-3">
                <span>Total</span>
                <span className="text-[#4318FF]">Rp {finalTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Tombol Checkout Full Ungu */}
            <button 
              onClick={handleCheckout} 
              disabled={cart.length === 0 || isProcessing} 
              className="w-full bg-[#4318FF] hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(67,24,255,0.25)]"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 size={20} /> SELESAIKAN PEMBAYARAN
                </>
              )}
            </button>
          </div>

        </div>

        {/* MODAL PILIH UKURAN */}
        {selectedMenu && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white shadow-2xl rounded-[2rem] p-8 w-full max-w-sm relative animate-in zoom-in-95 duration-200 border border-slate-100">
              <button onClick={() => setSelectedMenu(null)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors"><X size={20}/></button>
              
              <div className="flex flex-col items-center mb-6 mt-2">
                <div className="w-28 h-28 rounded-2xl overflow-hidden mb-5 border border-slate-100 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedMenu.imageUrl} alt={selectedMenu.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 text-center">{selectedMenu.name}</h3>
              </div>

              <div className="space-y-3 mb-8">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block text-center">Pilih Ukuran Gelas</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setSelectedSize("Small")}
                    className={`py-4 px-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-1 ${selectedSize === "Small" ? "bg-indigo-50 border-[#4318FF] text-[#4318FF] shadow-sm" : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"}`}
                  >
                    <span className="text-sm">Small</span>
                    <span className="text-xs font-black">Rp {(selectedMenu.priceSmall * (1 - (member?.discount || 0))).toLocaleString('id-ID')}</span>
                  </button>
                  <button 
                    onClick={() => setSelectedSize("Large")}
                    className={`py-4 px-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-1 ${selectedSize === "Large" ? "bg-indigo-50 border-[#4318FF] text-[#4318FF] shadow-sm" : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"}`}
                  >
                    <span className="text-sm">Large</span>
                    <span className="text-xs font-black">Rp {(selectedMenu.priceLarge * (1 - (member?.discount || 0))).toLocaleString('id-ID')}</span>
                  </button>
                </div>
              </div>

              <button onClick={addToCart} className="w-full bg-[#4318FF] hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(67,24,255,0.25)]">
                Tambahkan ke Keranjang
              </button>
            </div>
          </div>
        )}

        {/* MODAL PEMBAYARAN SUKSES */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 shadow-2xl rounded-[2rem] p-8 w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#4318FF] mb-6 shadow-sm border border-indigo-100">
                <CheckCircle2 size={40} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 text-center mb-2">Pembayaran Berhasil!</h2>
              <p className="text-slate-500 font-medium text-center text-sm mb-8">Transaksi telah disimpan ke dalam sistem.</p>
              
              <div className="w-full space-y-3">
                <button 
                  onClick={() => {
                    setShowSuccessModal(false);
                    setShowReceiptModal(true);
                  }} 
                  className="w-full bg-[#4318FF] hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(67,24,255,0.25)]"
                >
                  <Receipt size={18} /> Tampilkan & Cetak Struk
                </button>
                <button 
                  onClick={() => setShowSuccessModal(false)} 
                  className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl transition-all"
                >
                  Kembali ke Kasir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STRUK RECEIPT (Desain Putih Klasik, Siap Cetak) */}
      {showReceiptModal && transactionData && (
        <div className="fixed inset-0 z-70 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 print-hide">
          <div className="relative w-full max-w-md max-h-screen flex flex-col items-center">
            
            <div className="flex gap-3 mb-4 w-full justify-end print-hide">
              <button onClick={handlePrint} className="bg-[#4318FF] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-indigo-700">
                <Printer size={16} /> Cetak
              </button>
              <button onClick={() => setShowReceiptModal(false)} className="bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-slate-50">
                <X size={16} /> Tutup
              </button>
            </div>

            <div className="bg-white text-black p-4 w-[80mm] min-h-25 text-[11px] font-mono shadow-2xl print-show" id="printable-receipt">
              <div className="text-center mb-3">
                <h2 className="text-lg font-black tracking-widest uppercase">NEXT TEA</h2>
                <p className="text-[10px] mt-0.5">Premium Beverage</p>
                <p className="text-[9px] mt-0.5">Jl. Manggis No. 12, Indonesia</p>
              </div>

              <div className="border-t border-black border-dashed pt-2 mb-3 space-y-1 text-[10px]">
                <div className="flex justify-between"><span>No:</span> <span>{transactionData.id}</span></div>
                <div className="flex justify-between"><span>Tgl:</span> <span>{transactionData.date}</span></div>
                <div className="flex justify-between"><span>Kasir:</span> <span>{transactionData.cashier}</span></div>
                <div className="flex justify-between"><span>Member:</span> <span>{transactionData.memberName}</span></div>
              </div>

              <div className="border-t border-b border-black border-dashed py-2 mb-3 space-y-2">
                {transactionData.items.map((item, idx) => (
                  <div key={idx} className="text-[10px]">
                    <div className="font-bold">{item.name} ({item.size})</div>
                    <div className="flex justify-between mt-0.5">
                      <span>{item.qty} x {item.price.toLocaleString('id-ID')}</span>
                      <span>{(item.price * item.qty).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[10px] mb-3">
                <div className="flex justify-between"><span>Subtotal:</span> <span>Rp {transactionData.subtotal.toLocaleString('id-ID')}</span></div>
                {transactionData.discountTotal > 0 && (
                  <div className="flex justify-between font-bold"><span>Diskon:</span> <span>- Rp {transactionData.discountTotal.toLocaleString('id-ID')}</span></div>
                )}
                <div className="flex justify-between font-bold text-[12px] mt-1 border-t border-black border-dashed pt-1">
                  <span>TOTAL:</span> <span>Rp {transactionData.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-medium pt-1">
                  <span>Pembayaran:</span> <span>{transactionData.method}</span>
                </div>
              </div>

              <div className="text-center text-[9px] border-t border-black border-dashed pt-3 mt-3">
                <p className="font-bold">Layanan Pelanggan</p>
                <p>Terima kasih atas kunjungan Anda!</p>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
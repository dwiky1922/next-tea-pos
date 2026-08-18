import { MenuItem } from "../CustomerCatalog"; 

interface MenuListProps {
  menus: MenuItem[];
  discount: number;
}

export default function MenuList({ menus, discount }: MenuListProps) {
  return (
    <div className="pt-4">
      <h2 className="text-2xl font-black text-white mb-1">Daftar Menu</h2>
      <p className="text-sm text-slate-500 mb-8">Harga di bawah ini otomatis terpotong sesuai tingkat keanggotaan Anda.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {menus.map((menu) => (
          <div key={menu.id} className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl border border-transparent overflow-hidden flex flex-col shadow-lg transition-transform hover:-translate-y-1 duration-300">
            <div className="relative w-full h-48 bg-transparent overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={menu.imageUrl} alt={menu.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#18201C] via-[#18201C]/20 to-transparent opacity-90"></div>
              {discount > 0 && (
                <div className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md shadow-lg transform rotate-3">
                  Diskon {discount * 100}%
                </div>
              )}
            </div>
            
            {/* Teks dan Harga Ditengahkan */}
            <div className="p-6 flex flex-col items-center justify-center text-center -mt-6 relative z-10 flex-1">
              <h4 className="text-xl font-black text-white mb-5 drop-shadow-md">{menu.name}</h4>
              
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center w-full border-b border-slate-100/60 pb-2">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Small</span>
                  <div className="flex flex-col items-end">
                    {discount > 0 && (
                      <span className="text-slate-400 line-through text-[10px] font-medium">Rp {menu.priceSmall.toLocaleString('id-ID')}</span>
                    )}
                    <span className="text-[#4318FF] font-black text-sm">Rp {(menu.priceSmall * (1 - discount)).toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center w-full">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Large</span>
                  <div className="flex flex-col items-end">
                    {discount > 0 && (
                      <span className="text-slate-400 line-through text-[10px] font-medium">Rp {menu.priceLarge.toLocaleString('id-ID')}</span>
                    )}
                    <span className="text-[#4318FF] font-black text-sm">Rp {(menu.priceLarge * (1 - discount)).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
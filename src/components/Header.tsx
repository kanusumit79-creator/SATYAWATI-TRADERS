import React from 'react';
import { BusinessSettings } from '../types';
import { Sparkles, Phone, MapPin, Languages } from 'lucide-react';
import { useNepaliTypingToggle } from '../utils/nepaliTransliterate';

interface HeaderProps {
  settings: BusinessSettings;
  todaySalesTotal: number;
  todayCashCollected: number;
  onNewBillClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  todaySalesTotal,
  todayCashCollected,
  onNewBillClick,
}) => {
  const [isNepaliTyping, setIsNepaliTyping] = useNepaliTypingToggle();
  return (
    <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
      {/* Apple iOS Liquid Glass Header Container */}
      <div className="w-full rounded-[26px] ios-glass-panel p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand Identity with Sacred Devi Photo (Maa Durga Idol as requested) */}
        <div className="flex items-center gap-3.5 sm:gap-4 text-left w-full md:w-auto">
          {/* Sacred Avatar Container with Devi Photo */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] bg-white p-1 ring-1 ring-black/5 shadow-[0_4px_16px_rgba(0,0,0,0.08)] shrink-0 group">
            <div className="w-full h-full rounded-[18px] bg-amber-50 overflow-hidden relative flex items-center justify-center">
              <img
                src="/maa_durga_idol.jpg"
                alt="श्री सत्यवती माता"
                style={{ objectPosition: 'center 10%' }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-[#FF9500] bg-[#FF9500]/10 border border-[#FF9500]/20 px-2.5 py-0.5 rounded-full">
                ।। श्री सत्यवती माता प्रसन्न ।।
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                थोक फलफूल गोदाम (Wholesale)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1C1E] font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Mukta',sans-serif] mt-0.5">
              {settings.shopName} <span className="text-sm sm:text-base font-normal text-[#8E8E93] font-sans">(Satyawati Traders)</span>
            </h1>
            <p className="text-xs text-[#3C3C43]/70 font-medium mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[#1C1C1E] font-semibold">{settings.ownerName}</span>
              <span className="hidden sm:inline text-[#C7C7CC]">•</span>
              <span className="flex items-center gap-1 text-[#3C3C43]/80">
                <MapPin size={12} className="text-[#FF9500]" />
                {settings.address}
              </span>
              <span className="hidden md:inline text-[#C7C7CC]">•</span>
              <span className="flex items-center gap-1 text-[#3C3C43]/80">
                <Phone size={12} className="text-[#007AFF]" />
                {settings.phone.split(',')[0]}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Quick Daily Metrics & New Bill Button */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {/* Today's Sales Pill (Apple Glass Pill) */}
          <div className="px-4 py-2 rounded-2xl bg-white/70 border border-white/80 backdrop-blur-xl flex items-center gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <div>
              <span className="text-[10px] text-[#8E8E93] font-medium block uppercase tracking-wider">
                आजको बिक्री (Sales)
              </span>
              <span className="text-sm sm:text-base font-bold text-[#1C1C1E] font-mono">
                रु. {todaySalesTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-black/[0.08]" />
            <div>
              <span className="text-[10px] text-[#34C759] font-medium block uppercase tracking-wider">
                नगद संकलन (Cash)
              </span>
              <span className="text-sm sm:text-base font-bold text-[#34C759] font-mono">
                रु. {todayCashCollected.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Quick Nepali Typing Toggle Switch (Global) */}
          <button
            type="button"
            onClick={() => setIsNepaliTyping(!isNepaliTyping)}
            title="रोमनबाट नेपाली युनिकोड टाइप गर्ने वा अंग्रेजीमा लेख्ने सुविधा"
            className={`px-3.5 py-2 rounded-2xl flex items-center gap-1.5 text-xs font-bold border transition-all cursor-pointer shadow-xs active:scale-95 ${
              isNepaliTyping
                ? 'bg-blue-50 text-[#007AFF] border-blue-200 hover:bg-blue-100/70'
                : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
            }`}
          >
            <Languages size={15} />
            <span>टाइपिङ: {isNepaliTyping ? '🇳🇵 नेपाली (Romanized)' : '🔤 English'}</span>
          </button>

          {/* Quick New Bill Button (Apple System Blue Action) */}
          <button
            type="button"
            onClick={onNewBillClick}
            className="px-5 py-2.5 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-[0_4px_16px_rgba(0,122,255,0.28)] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={15} strokeWidth={2.4} />
            <span>+ नयाँ बिल (New Bill)</span>
          </button>
        </div>
      </div>
    </header>
  );
};

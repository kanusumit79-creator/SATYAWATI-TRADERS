import React from 'react';
import { ActiveTab } from '../types';
import { haptic } from '../utils/haptics';
import {
  Receipt,
  Boxes,
  Users,
  ShieldCheck,
} from 'lucide-react';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  lowStockCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  lowStockCount = 0,
}) => {
  // Strictly the 4 core sections requested by user
  const tabs = [
    {
      id: 'billing',
      labelNepali: 'नयाँ बिल',
      labelEnglish: 'New Bill',
      icon: Receipt,
    },
    {
      id: 'stock',
      labelNepali: 'स्टक',
      labelEnglish: 'Stocks',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-red-500',
    },
    {
      id: 'parties',
      labelNepali: 'पार्टी खाता',
      labelEnglish: 'Credit / Debit History',
      icon: Users,
    },
    {
      id: 'owner',
      labelNepali: 'सञ्चालक कक्ष',
      labelEnglish: 'Owner Section',
      icon: ShieldCheck,
    },
  ];

  return (
    <nav className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 py-2">
      {/* Apple iOS Liquid Glass Navigation Bar */}
      <div className="w-full rounded-[24px] ios-glass-panel p-1.5 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                haptic.selection();
                onTabChange(tab.id as ActiveTab);
              }}
              className={`relative px-3 py-3 rounded-[18px] text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                isActive
                  ? 'bg-white text-[#1C1C1E] shadow-[0_3px_12px_rgba(0,0,0,0.10),0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.05]'
                  : 'text-[#3C3C43]/70 hover:text-[#1C1C1E] hover:bg-white/50 border border-transparent'
              }`}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.4 : 1.9}
                className={isActive ? 'text-[#007AFF]' : 'text-[#8E8E93]'}
              />
              <div className="text-left leading-tight">
                <span className="block font-bold font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Mukta',sans-serif]">
                  {tab.labelNepali}
                </span>
                <span className={`text-[10px] font-medium block ${isActive ? 'text-[#8E8E93]' : 'text-[#8E8E93]/80'}`}>
                  {tab.labelEnglish}
                </span>
              </div>

              {tab.badge && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full bg-[#FF3B30] text-white text-[10px] font-bold shadow-sm leading-none"
                  title={`${tab.badge} सामान न्यून स्टकमा`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

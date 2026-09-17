import React, { useState } from 'react';
import {
  NEPALI_MONTHS,
  parseBsDate,
  buildBsDate,
  getReadableBsDate,
  toNpDigits,
  toEnDigits,
  DEFAULT_CURRENT_BS_YEAR,
} from '../utils/nepaliDate';
import { haptic } from '../utils/haptics';
import { Calendar, ChevronLeft, ChevronRight, Sparkles, Check, Edit2, RotateCcw } from 'lucide-react';

interface EasyDatePickerProps {
  value: string;
  onChange: (dateBs: string) => void;
  label?: string;
  className?: string;
  required?: boolean;
}

export const EasyDatePicker: React.FC<EasyDatePickerProps> = ({
  value,
  onChange,
  label = 'मिति (वि.सं.)',
  className = '',
  required = false,
}) => {
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [isEditingYear, setIsEditingYear] = useState(false);

  // Parse current value
  const parsed = parseBsDate(value || DEFAULT_CURRENT_BS_YEAR);
  const currentMonthInfo = NEPALI_MONTHS.find((m) => m.index === parsed.month) || NEPALI_MONTHS[5];
  const maxDays = currentMonthInfo.defaultDays || 32;

  // Handlers
  const handleSelectMonth = (monthIndex: number) => {
    haptic.selection();
    const newDay = Math.min(parsed.day, NEPALI_MONTHS[monthIndex - 1]?.defaultDays || 32);
    const newDate = buildBsDate(parsed.year, monthIndex, newDay, parsed.isDevanagari);
    onChange(newDate);
  };

  const handleSelectDay = (day: number) => {
    haptic.selection();
    const newDate = buildBsDate(parsed.year, parsed.month, day, parsed.isDevanagari);
    onChange(newDate);
  };

  const handleStepDay = (delta: number) => {
    haptic.light();
    let newDay = parsed.day + delta;
    let newMonth = parsed.month;
    let newYear = parsed.year;

    if (newDay < 1) {
      if (newMonth > 1) {
        newMonth -= 1;
        newDay = NEPALI_MONTHS[newMonth - 1]?.defaultDays || 30;
      } else {
        newDay = 1;
      }
    } else if (newDay > maxDays) {
      if (newMonth < 12) {
        newMonth += 1;
        newDay = 1;
      } else {
        newDay = maxDays;
      }
    }

    const newDate = buildBsDate(newYear, newMonth, newDay, parsed.isDevanagari);
    onChange(newDate);
  };

  const handleSetToday = () => {
    haptic.medium();
    // Default today in system standard: Ashwin 3, 2081
    const newDate = buildBsDate(parsed.year || DEFAULT_CURRENT_BS_YEAR, 6, 3, parsed.isDevanagari);
    onChange(newDate);
  };

  const handleSetYesterday = () => {
    haptic.medium();
    const newDate = buildBsDate(parsed.year || DEFAULT_CURRENT_BS_YEAR, 6, 2, parsed.isDevanagari);
    onChange(newDate);
  };

  const handleSetDayBefore = () => {
    haptic.medium();
    const newDate = buildBsDate(parsed.year || DEFAULT_CURRENT_BS_YEAR, 6, 1, parsed.isDevanagari);
    onChange(newDate);
  };

  const handleYearChange = (newYearVal: string) => {
    const isDev = /[०-९]/.test(newYearVal);
    const cleanYear = newYearVal.trim();
    if (cleanYear) {
      const newDate = buildBsDate(cleanYear, parsed.month, parsed.day, isDev);
      onChange(newDate);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label & Auto-Captured Year */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
          <Calendar size={13} className="text-amber-600" />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>

        {/* Year Badge (Captured automatically - No need to type) */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-stone-500 font-medium">वर्ष (Year):</span>
          {isEditingYear ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={parsed.year}
                onChange={(e) => handleYearChange(e.target.value)}
                onBlur={() => setIsEditingYear(false)}
                autoFocus
                className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold bg-white border border-amber-400 rounded text-stone-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsEditingYear(false)}
                className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingYear(true)}
              className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-50 text-stone-800 font-mono font-bold border border-stone-200/80 flex items-center gap-1 cursor-pointer transition-colors"
              title="वर्ष परिवर्तन गर्न थिच्नुहोस् (Year captured automatically)"
            >
              <span>{parsed.year}</span>
              <span className="text-[9px] text-amber-700 bg-amber-100 px-1 rounded font-sans">स्वचालित</span>
              <Edit2 size={10} className="text-stone-400" />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Date Card */}
      <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5">
        {/* Quick 1-Click Shortcuts */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSetToday}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                parsed.month === 6 && parsed.day === 3
                  ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-500'
                  : 'bg-white hover:bg-amber-100/70 text-stone-700 border border-stone-200'
              }`}
            >
              <Sparkles size={11} className={parsed.month === 6 && parsed.day === 3 ? 'text-amber-200' : 'text-amber-500'} />
              <span>आज (Today)</span>
            </button>
            <button
              type="button"
              onClick={handleSetYesterday}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                parsed.month === 6 && parsed.day === 2
                  ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-500'
                  : 'bg-white hover:bg-amber-100/70 text-stone-700 border border-stone-200'
              }`}
            >
              <span>हिजो (Yesterday)</span>
            </button>
            <button
              type="button"
              onClick={handleSetDayBefore}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                parsed.month === 6 && parsed.day === 1
                  ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-500'
                  : 'bg-white hover:bg-amber-100/70 text-stone-700 border border-stone-200'
              }`}
            >
              <span>अस्ति</span>
            </button>
          </div>

          {/* Stepper buttons for quick -1 / +1 day */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-stone-200 shadow-2xs">
            <button
              type="button"
              onClick={() => handleStepDay(-1)}
              className="p-1 rounded hover:bg-stone-100 text-stone-600 active:scale-95 transition-all cursor-pointer"
              title="- १ दिन"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] font-mono font-bold px-1 text-stone-800">
              {parsed.isDevanagari ? toNpDigits(parsed.day) : parsed.day} गते
            </span>
            <button
              type="button"
              onClick={() => handleStepDay(1)}
              className="p-1 rounded hover:bg-stone-100 text-stone-600 active:scale-95 transition-all cursor-pointer"
              title="+ १ दिन"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Selected Date Headline Display */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-amber-300 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {parsed.isDevanagari ? toNpDigits(parsed.day) : parsed.day}
            </div>
            <div>
              <div className="text-xs font-bold text-stone-900 leading-tight">
                {getReadableBsDate(value)}
              </div>
              <div className="text-[10px] text-stone-500 font-mono">
                {value}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setShowFullPicker(!showFullPicker);
            }}
            className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-[11px] font-semibold text-stone-700 border border-stone-200 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{showFullPicker ? 'छोटो बनाउनुहोस्' : 'महिना/गते छान्नुहोस्'}</span>
            <Calendar size={12} className="text-amber-600" />
          </button>
        </div>

        {/* Visual 1-Click Month & Date Picker */}
        {showFullPicker && (
          <div className="space-y-3 pt-2 border-t border-amber-200/80 animate-in fade-in duration-150">
            {/* Month Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-stone-700">
                  १. महिना छान्नुहोस् (Choose Month):
                </span>
                <span className="text-[10px] text-amber-800 font-semibold">
                  हाल: {currentMonthInfo.nameNp} ({parsed.month} महिना)
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {NEPALI_MONTHS.map((m) => {
                  const isSelected = parsed.month === m.index;
                  return (
                    <button
                      key={m.index}
                      type="button"
                      onClick={() => handleSelectMonth(m.index)}
                      className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-amber-600 text-white font-bold shadow-xs ring-2 ring-amber-400'
                          : 'bg-white hover:bg-amber-100/60 text-stone-700 border border-stone-200 shadow-2xs'
                      }`}
                    >
                      <span className="leading-tight">{m.nameNp}</span>
                      <span className="text-[9px] opacity-75 font-mono">
                        ({parsed.isDevanagari ? toNpDigits(m.index) : m.index})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day Selection (1 to maxDays) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-stone-700">
                  २. गते छान्नुहोस् (Choose Day 1-{maxDays}):
                </span>
                <span className="text-[10px] text-amber-800 font-semibold">
                  छानिएको: {parsed.isDevanagari ? toNpDigits(parsed.day) : parsed.day} गते
                </span>
              </div>
              <div className="grid grid-cols-7 sm:grid-cols-8 gap-1 max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-stone-200 no-scrollbar">
                {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => {
                  const isSelected = parsed.day === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSelectDay(d)}
                      className={`h-8 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-amber-500 text-white font-bold shadow-xs scale-105 ring-1 ring-amber-400'
                          : 'hover:bg-amber-50 text-stone-800 border border-transparent hover:border-amber-200'
                      }`}
                    >
                      {parsed.isDevanagari ? toNpDigits(d) : d}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compact Direct Number Input (Optional fallback without year) */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-stone-200 text-xs">
              <span className="text-stone-600 text-[11px]">अथवा नम्बरबाट मात्र:</span>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-stone-500">महिना:</span>
                  <select
                    value={parsed.month}
                    onChange={(e) => handleSelectMonth(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-none"
                  >
                    {NEPALI_MONTHS.map((m) => (
                      <option key={m.index} value={m.index}>
                        {m.index} - {m.nameNp}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-stone-500">गते:</span>
                  <select
                    value={parsed.day}
                    onChange={(e) => handleSelectDay(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-none"
                  >
                    {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { Calendar, Check } from 'lucide-react';
import { getISTBillingMonthOptions } from '../../lib/dateUtils';

interface BillingMonthQuickSelectProps {
  value: string;
  onSelect: (monthYear: string) => void;
  theme?: 'indigo' | 'emerald';
  className?: string;
}

/**
 * Quick-access buttons for the "Billing Month / Term" field in fee collection forms.
 * Displays the Previous 3 Months and the Current Month Year in Indian Standard Time (IST).
 * Strictly formats options as Month and Year only (no date/day numbers).
 */
export default function BillingMonthQuickSelect({
  value,
  onSelect,
  theme = 'indigo',
  className = ''
}: BillingMonthQuickSelectProps) {
  const options = getISTBillingMonthOptions();

  const activeStyles = theme === 'emerald'
    ? 'bg-emerald-600 text-white border-emerald-400 font-black shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/50 scale-[1.02]'
    : 'bg-indigo-600 text-white border-indigo-400 font-black shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-400/50 scale-[1.02]';

  const currentBadgeStyles = theme === 'emerald'
    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';

  const activeIndicatorColor = theme === 'emerald' ? 'text-emerald-400' : 'text-indigo-400';

  return (
    <div className={`space-y-2 pt-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar size={12} className={activeIndicatorColor} />
          <span>Quick Select Billing Term:</span>
        </span>
        <span className="text-[9px] font-semibold text-slate-500 tracking-wide">
          (Previous 3 Months &amp; Current)
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {options.map((opt) => {
          const cleanVal = (value || '').trim().toLowerCase();
          const cleanOpt = opt.value.trim().toLowerCase();
          const isSelected = cleanVal === cleanOpt || cleanVal.startsWith(cleanOpt);

          return (
            <button
              key={`quick-month-${opt.value}`}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 border cursor-pointer select-none active:scale-95 ${
                isSelected
                  ? activeStyles
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10 hover:border-white/20'
              }`}
              title={`Click to set billing month to ${opt.value}`}
            >
              {isSelected && <Check size={12} className="stroke-[3]" />}
              <span className="font-semibold">{opt.value}</span>
              {opt.isCurrent && (
                <span
                  className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-black tracking-wider transition-colors ${
                    isSelected ? 'bg-white/25 text-white' : currentBadgeStyles
                  }`}
                >
                  Current
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

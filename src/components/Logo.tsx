import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  withText?: boolean;
  textClassName?: string;
  subtitle?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-14 h-14',
  '2xl': 'w-20 h-20',
};

export default function Logo({
  size = 'md',
  className = '',
  withText = false,
  textClassName = '',
  subtitle
}: LogoProps) {
  const dimensionClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Crisp circular logo image matching Computra.jpg */}
      <div className={`${dimensionClass} relative shrink-0 rounded-2xl overflow-hidden shadow-md shadow-blue-500/10 flex items-center justify-center bg-white p-0.5 border border-white/10`}>
        <img
          src="/logo.svg"
          alt="Computra Logo"
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to png if svg fails
            const target = e.currentTarget;
            if (target.src.endsWith('.svg')) {
              target.src = '/logo.png';
            }
          }}
        />
      </div>

      {withText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-tighter uppercase whitespace-nowrap text-white ${textClassName || 'text-xl'}`}>
            UTC <span className="text-blue-500">Computra</span>
          </span>
          {subtitle && (
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

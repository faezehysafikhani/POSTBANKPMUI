import React from 'react';

interface PostBankLogoProps {
  className?: string;
  showText?: boolean;
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const PostBankLogo: React.FC<PostBankLogoProps> = ({
  className = '',
  showText = true,
  layout = 'horizontal',
  size = 'md'
}) => {
  const emblemSizes = {
    sm: 32,
    md: 42,
    lg: 56,
    xl: 84
  };

  const currentSize = emblemSizes[size];

  // Official Post Bank Green & Crimson Colors from Brand Identity
  const greenFill = '#00873E';
  const redText = '#E30638';

  return (
    <div
      className={`select-none flex items-center ${
        layout === 'vertical' ? 'flex-col justify-center text-center gap-2.5' : 'flex-row gap-3 text-right'
      } ${className}`}
    >
      {/* Official Post Bank Emblem Vector (Green Sphere with 4 Waves & 4 Horizontal Streamlines) */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform hover:scale-105"
        style={{ width: currentSize, height: currentSize }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Green Main Circular Body */}
          <circle cx="48" cy="50" r="38" fill={greenFill} />

          {/* 4 White Stylized Diagonal Waves in Upper-Left */}
          <g fill="#FFFFFF">
            {/* Wave 1 (Top Left) */}
            <path
              d="M34 22 C37 20, 42 22, 45 28 C47 32, 46 36, 43 38 C40 40, 36 38, 33 33 C31 29, 31 25, 34 22 Z"
            />
            {/* Wave 2 */}
            <path
              d="M42 17 C46 16, 50 19, 53 25 C55 30, 54 35, 51 37 C48 39, 44 37, 41 31 C39 26, 39 20, 42 17 Z"
            />
            {/* Wave 3 */}
            <path
              d="M50 15 C54 14, 59 17, 62 23 C64 28, 63 33, 60 36 C57 38, 52 35, 50 30 C48 24, 48 18, 50 15 Z"
            />
            {/* Wave 4 */}
            <path
              d="M58 17 C62 17, 67 20, 69 25 C71 30, 70 34, 67 36 C64 38, 60 35, 58 31 C56 26, 56 20, 58 17 Z"
            />
          </g>

          {/* 4 Horizontal Cut Streamlines Extending Through the Right Half */}
          <g stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round">
            <line x1="45" y1="42" x2="88" y2="42" />
            <line x1="42" y1="48" x2="94" y2="48" />
            <line x1="45" y1="54" x2="88" y2="54" />
            <line x1="49" y1="60" x2="78" y2="60" />
          </g>

          {/* Thin dark/accent horizontal speedlines extending outside as in official emblem */}
          <g stroke={greenFill} strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
            <line x1="86" y1="42" x2="98" y2="42" />
            <line x1="92" y1="48" x2="99" y2="48" />
            <line x1="86" y1="54" x2="97" y2="54" />
          </g>
        </svg>
      </div>

      {/* Official Typography: Persian Calligraphy in Red + English in Charcoal */}
      {showText && (
        <div className={`flex flex-col ${layout === 'vertical' ? 'items-center text-center' : 'text-right'}`}>
          {/* Persian Calligraphy «پست بانک ایران» */}
          <div
            className={`font-black tracking-tight leading-none ${
              size === 'sm'
                ? 'text-sm'
                : size === 'md'
                ? 'text-base'
                : size === 'lg'
                ? 'text-xl'
                : 'text-2xl'
            }`}
            style={{ color: redText }}
          >
            پست بانک ایران
          </div>

          {/* English Subtitle «POST BANK IRAN» */}
          <div
            className={`font-mono font-bold tracking-widest text-slate-700 dark:text-slate-300 mt-1 uppercase ${
              size === 'sm'
                ? 'text-[8px]'
                : size === 'md'
                ? 'text-[10px]'
                : size === 'lg'
                ? 'text-xs'
                : 'text-sm'
            }`}
          >
            POST BANK IRAN
          </div>
        </div>
      )}
    </div>
  );
};

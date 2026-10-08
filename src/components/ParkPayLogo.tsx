interface ParkPayLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
}

export function ParkPayLogo({
  size = 'md',
  showWordmark = true,
  subtitle,
  className = '',
}: ParkPayLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-9 h-9',
    xl: 'w-11 h-11',
  };

  const wordmarkSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Dynamic Emblem SVG */}
      <div className={`${iconSizes[size]} relative shrink-0 transition-transform hover:scale-[1.02]`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_4px_rgba(5,150,105,0.25)]"
        >
          <defs>
            <linearGradient id="ppGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="60%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064E3B" />
            </linearGradient>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>

          {/* Rounded squircle background */}
          <rect width="40" height="40" rx="10" fill="url(#ppGrad)" />

          {/* Subtle inner highlight border */}
          <rect
            x="0.75"
            y="0.75"
            width="38.5"
            height="38.5"
            rx="9.25"
            stroke="white"
            strokeOpacity="0.22"
            strokeWidth="1.5"
          />

          {/* Parking 'P' glyph */}
          <path
            d="M13 28V11.5C13 11.22 13.22 11 13.5 11H19.2C22.6 11 24.8 13.05 24.8 16.1C24.8 19.15 22.6 21.2 19.2 21.2H17.2V27.5C17.2 27.78 16.98 28 16.7 28H13.5C13.22 28 13 27.78 13 27.5V28Z"
            fill="white"
          />
          {/* Inner P eye cutout */}
          <path
            d="M17.2 14.5V17.7H19C20.35 17.7 21.2 17.1 21.2 16.1C21.2 15.1 20.35 14.5 19 14.5H17.2Z"
            fill="#047857"
          />

          {/* Contactless / Fast Payment Signal Arcs */}
          <path
            d="M26.2 11.5C28.5 12.8 29.8 14.8 30.1 17.2"
            stroke="url(#waveGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M29.2 8.5C32.4 10.5 34.2 13.4 34.6 17"
            stroke="url(#waveGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeOpacity="0.75"
          />
        </svg>
      </div>

      {/* Wordmark and Optional Subtitle */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className={`${wordmarkSizes[size]} font-bold tracking-tight text-neutral-900 leading-tight`}>
            <span>Park</span>
            <span className="text-emerald-700">Pay</span>
          </div>
          {subtitle && (
            <span className="text-[11px] text-neutral-400 font-medium leading-none mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

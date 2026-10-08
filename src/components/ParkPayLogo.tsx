import React from 'react';

interface ParkPayLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  subtitleText?: string;
  variant?: 'full' | 'mark-only' | 'horizontal-compact';
  className?: string;
}

export function ParkPayLogoMark({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="ParkPay Brand Mark"
    >
      <defs>
        {/* Rich multi-stop Emerald to Teal Gradient */}
        <linearGradient id="pp-badge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064E3B" />
          <stop offset="55%" stopColor="#047857" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>

        {/* Luminous Mint Accent Gradient */}
        <linearGradient id="pp-mint-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Dynamic Payment Pulse Gradient */}
        <linearGradient id="pp-pulse-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#A7F3D0" />
        </linearGradient>

        {/* Inner ambient glow filter */}
        <filter id="pp-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Squircle Container with subtle border highlight */}
      <rect
        x="1.5"
        y="1.5"
        width="41"
        height="41"
        rx="11"
        fill="url(#pp-badge-grad)"
        stroke="rgba(255, 255, 255, 0.22)"
        strokeWidth="1"
      />

      {/* Subtle top-light rim reflect */}
      <path
        d="M6 13C6 8.58172 9.58172 5 14 5H30C34.4183 5 38 8.58172 38 13C38 14 36.5 14 36 14H8C7.5 14 6 14 6 13Z"
        fill="white"
        fillOpacity="0.08"
      />

      {/* Architectural P Stem (Gate Barrier & Parking Bay Foundation) */}
      <rect
        x="10.5"
        y="10.5"
        width="5"
        height="23"
        rx="2.5"
        fill="#FFFFFF"
      />

      {/* Dynamic P Loop (Upper Parking Bay arc that flows into a payment loop) */}
      <path
        d="M13 10.5H23.5C28.1944 10.5 32 14.3056 32 19C32 23.6944 28.1944 27.5 23.5 27.5H15.5"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Digital Payment Arrow / Contactless Wave nestled inside the P bowl */}
      <path
        d="M20 15L25 19L20 23"
        stroke="url(#pp-mint-grad)"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Instant Settlement Pulse Dot */}
      <circle
        cx="29"
        cy="12"
        r="2"
        fill="#6EE7B7"
        className="animate-pulse"
      />
    </svg>
  );
}

export function ParkPayLogo({
  size = 'md',
  showSubtitle = true,
  subtitleText = 'Gate Operations',
  variant = 'full',
  className = '',
}: ParkPayLogoProps) {
  // Size presets
  const sizeMap = {
    xs: {
      mark: 'w-5 h-5',
      text: 'text-sm',
      sub: 'text-[9px]',
      gap: 'gap-1.5',
    },
    sm: {
      mark: 'w-7 h-7',
      text: 'text-base',
      sub: 'text-[10px]',
      gap: 'gap-2',
    },
    md: {
      mark: 'w-9 h-9',
      text: 'text-lg',
      sub: 'text-[11px]',
      gap: 'gap-3',
    },
    lg: {
      mark: 'w-11 h-11',
      text: 'text-2xl',
      sub: 'text-xs',
      gap: 'gap-3.5',
    },
    xl: {
      mark: 'w-14 h-14',
      text: 'text-3xl',
      sub: 'text-sm',
      gap: 'gap-4',
    },
  };

  const current = sizeMap[size];

  if (variant === 'mark-only') {
    return <ParkPayLogoMark className={`${current.mark} ${className}`} />;
  }

  return (
    <div className={`flex items-center ${current.gap} select-none ${className}`}>
      <ParkPayLogoMark className={current.mark} />

      <div className="flex flex-col justify-center">
        <div className={`font-bold tracking-tight leading-none ${current.text} flex items-baseline`}>
          <span className="text-neutral-900 font-extrabold tracking-tight">Park</span>
          <span className="text-emerald-600 font-extrabold tracking-tight">Pay</span>
          <span className="text-emerald-500 font-bold text-[0.6em] ml-0.5 tracking-normal">™</span>
        </div>

        {showSubtitle && (
          <p className={`${current.sub} text-neutral-400 font-medium tracking-wide mt-0.5 leading-none`}>
            {subtitleText}
          </p>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { FileText, Fuel, MapPin, Wrench } from 'lucide-react';
import { clsx } from 'clsx';

export type MainSectionKey = 'maps' | 'diesel' | 'maintenance' | 'invoices';

/**
 * Single source of truth for FleetOS's 4 main section icons and accent colors.
 * Reused across the Individual Lorry Services screen, bottom-sheet overlays,
 * and section headers for commercial SaaS visual consistency.
 */
export const SECTION_ICON_SYSTEM: Record<
  MainSectionKey,
  {
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    accentLight: string;
    accentDark: string;
    badgeDark: string;
  }
> = {
  maps: {
    label: 'Maps & GPS',
    icon: MapPin,
    accentLight: 'text-blue-600',
    accentDark: 'text-blue-400',
    badgeDark: 'bg-blue-500/20 text-blue-300 border border-blue-400/25',
  },
  diesel: {
    label: 'Diesel Management',
    icon: Fuel,
    accentLight: 'text-amber-600',
    accentDark: 'text-amber-400',
    badgeDark: 'bg-amber-400/20 text-amber-300 border border-amber-400/25',
  },
  maintenance: {
    label: 'Maintenance',
    icon: Wrench,
    accentLight: 'text-purple-600',
    accentDark: 'text-purple-300',
    badgeDark: 'bg-purple-500/20 text-purple-300 border border-purple-400/25',
  },
  invoices: {
    label: 'Invoices',
    icon: FileText,
    accentLight: 'text-emerald-600',
    accentDark: 'text-emerald-400',
    badgeDark: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/25',
  },
};

/**
 * Original geometric FleetOS commercial truck emblem (custom SVG, consistent stroke).
 */
export const FleetOSTruckMark: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg
    viewBox="0 0 28 28"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <rect
      x="2.5"
      y="6.5"
      width="14"
      height="11.5"
      rx="2.2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M16.5 10.5H21.2C21.8 10.5 22.3 10.8 22.6 11.3L25.1 14.8C25.4 15.2 25.5 15.6 25.5 16.1V18H16.5V10.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="8" cy="20" r="2.3" stroke="currentColor" strokeWidth="2" />
    <circle cx="21" cy="20" r="2.3" stroke="currentColor" strokeWidth="2" />
    <path d="M10.5 18H18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

interface FleetOSLogoProps {
  variant?: 'light' | 'dark';
  subtitle?: string;
  compactOnMobile?: boolean;
}

/**
 * Consistent FleetOS brand mark + wordmark used across headers and mobile screens.
 */
export const FleetOSLogo: React.FC<FleetOSLogoProps> = ({
  variant = 'light',
  subtitle,
  compactOnMobile = false,
}) => {
  const isDark = variant === 'dark';

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className={clsx(
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl shadow-sm',
          isDark
            ? 'bg-blue-600 text-white'
            : 'bg-[#0b1329] text-white'
        )}
      >
        <FleetOSTruckMark className="h-5 w-5" />
      </div>

      <div className={clsx('min-w-0', compactOnMobile && 'hidden sm:block')}>
        <div className="flex items-center gap-1.5">
          <span
            className={clsx(
              'font-mono text-base font-extrabold tracking-tight leading-none',
              isDark ? 'text-white' : 'text-[#0b1329]'
            )}
          >
            Fleet
            <span className={isDark ? 'text-[#f5c431]' : 'text-blue-600'}>OS</span>
          </span>
        </div>
        {subtitle && (
          <p
            className={clsx(
              'mt-0.5 truncate text-[11px] font-medium leading-none',
              isDark ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

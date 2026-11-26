import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2, MapPin, X } from 'lucide-react';
import { RouteLocation } from '../../types/fuel';
import { searchLocations } from '../../services/routingService';

interface LocationSearchInputProps {
  label?: string;
  placeholder: string;
  value: RouteLocation | null;
  onSelect: (loc: RouteLocation | null) => void;
  badgeText: string;
  badgeColor: string;
  onRemove?: () => void;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  label,
  placeholder,
  value,
  onSelect,
  badgeText,
  badgeColor,
  onRemove,
}) => {
  const [query, setQuery] = useState(value?.shortName ?? '');
  const [results, setResults] = useState<RouteLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep input text synced when value changes externally
  useEffect(() => {
    setQuery(value?.shortName ?? '');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Debounced Nominatim search
  useEffect(() => {
    const trimmed = query.trim();
    if (!isOpen || trimmed.length < 2 || (value && trimmed === value.shortName)) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const items = await searchLocations(trimmed, controller.signal);
        setResults(items);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSearchError('Could not search locations. Check connection or try again.');
          setResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, isOpen, value]);

  const handleChoose = (loc: RouteLocation) => {
    onSelect(loc);
    setQuery(loc.shortName);
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && <label className="mb-1 block text-xs font-semibold text-slate-700">{label}</label>}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span
            className={`absolute left-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-bold text-white ${badgeColor}`}
          >
            {badgeText}
          </span>
          <input
            type="text"
            value={query}
            placeholder={placeholder}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);
              setIsOpen(true);
              if (value && next !== value.shortName) {
                onSelect(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results.length > 0 && isOpen) {
                e.preventDefault();
                handleChoose(results[0]);
              }
            }}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-8 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {isSearching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
            ) : value ? (
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setQuery('');
                  setResults([]);
                }}
                className="text-emerald-600 hover:text-slate-600"
                title="Clear location"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title="Remove stop"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && query.trim().length >= 2 && !(value && query.trim() === value.shortName) && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {isSearching && results.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-slate-500">Searching OpenStreetMap...</div>
          ) : searchError ? (
            <div className="px-3 py-2.5 text-xs text-rose-600">{searchError}</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-slate-500">No matching places found.</div>
          ) : (
            results.map((item, idx) => (
              <button
                key={`${item.lat}-${item.lng}-${idx}`}
                type="button"
                onClick={() => handleChoose(item)}
                className="flex w-full items-start gap-2 border-b border-slate-100 px-3 py-2 text-left text-xs last:border-b-0 hover:bg-blue-50/70"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{item.shortName}</p>
                  <p className="truncate text-[11px] text-slate-500">{item.label}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Indian logistics currency and metric formatting utilities
 */

export const formatINR = (amount: number, compact: boolean = false): string => {
  if (compact) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    }
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatLiters = (liters: number): string => {
  return `${new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 1,
  }).format(liters)} L`;
};

export const formatMileage = (kmPerL: number): string => {
  if (!kmPerL || isNaN(kmPerL) || kmPerL <= 0) return '—';
  return `${kmPerL.toFixed(2)} km/L`;
};

export const formatCostPerKm = (costPerKm: number): string => {
  if (!costPerKm || isNaN(costPerKm) || costPerKm <= 0) return '—';
  return `₹${costPerKm.toFixed(2)}/km`;
};

export const formatDistance = (km: number): string => {
  return `${new Intl.NumberFormat('en-IN').format(Math.round(km))} km`;
};

export const formatDate = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return isoString;
  }
};

export const formatDateOnly = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoString;
  }
};

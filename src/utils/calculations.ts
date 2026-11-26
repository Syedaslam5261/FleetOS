import { MileageCalculationStatus } from '../types/diesel';

/**
 * Standard FleetOS Diesel Calculations
 * Rule 1: Total fuel cost = Litres × Price per litre
 * Rule 2: Mileage (km/L) = Distance travelled ÷ Litres consumed
 * Rule 3: Fuel cost per km = Diesel cost ÷ Distance travelled
 */

export const calculateTotalFuelCost = (liters: number, ratePerLiter: number): number => {
  if (liters <= 0 || ratePerLiter <= 0) return 0;
  return Math.round(liters * ratePerLiter * 100) / 100;
};

export const calculateMileage = (
  distanceKm: number,
  liters: number,
  isFullTankToFullTank: boolean = true
): { mileage: number | null; status: MileageCalculationStatus } => {
  if (distanceKm <= 0 || liters <= 0) {
    return { mileage: null, status: 'INSUFFICIENT_DATA' };
  }

  const rawMileage = distanceKm / liters;
  const rounded = Math.round(rawMileage * 100) / 100;

  if (isFullTankToFullTank) {
    return { mileage: rounded, status: 'FULL_TANK_VERIFIED' };
  } else {
    return { mileage: rounded, status: 'ESTIMATE_PARTIAL' };
  }
};

export const calculateCostPerKm = (dieselCost: number, distanceKm: number): number | null => {
  if (distanceKm <= 0 || dieselCost <= 0) return null;
  return Math.round((dieselCost / distanceKm) * 100) / 100;
};

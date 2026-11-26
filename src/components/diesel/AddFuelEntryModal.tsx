import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StationBrand, MileageCalculationStatus } from '../../types/diesel';
import { calculateTotalFuelCost, calculateMileage } from '../../utils/calculations';
import { formatINR, formatMileage } from '../../utils/formatters';
import { Fuel, Calculator, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface AddFuelEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entryData: any) => Promise<void>;
  truckList: Array<{ truckId: string; truckNumber: string; driverAssigned: string; currentOdo: number }>;
}

export const AddFuelEntryModal: React.FC<AddFuelEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  truckList,
}) => {
  const [selectedTruckId, setSelectedTruckId] = useState(truckList[0]?.truckId || '');
  const [driverName, setDriverName] = useState(truckList[0]?.driverAssigned || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [fuelStation, setFuelStation] = useState('IndianOil COCO Express, NH-48');
  const [stationBrand, setStationBrand] = useState<StationBrand>('IndianOil');
  const [liters, setLiters] = useState<string>('250.0');
  const [ratePerLiter, setRatePerLiter] = useState<string>('91.50');
  const [odometerReading, setOdometerReading] = useState<string>('143890');
  const [previousOdometer, setPreviousOdometer] = useState<string>('142850');
  const [tripReference, setTripReference] = useState('TRP-2026-904');
  const [isFullTank, setIsFullTank] = useState(true);
  const [paymentMode, setPaymentMode] = useState<'FLEET_CARD' | 'UPI' | 'CASH' | 'FASTAG_WALLET'>('FLEET_CARD');
  const [receiptNumber, setReceiptNumber] = useState('INV-88390');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update driver & odo when truck selection changes
  const handleTruckChange = (truckId: string) => {
    setSelectedTruckId(truckId);
    const truck = truckList.find((t) => t.truckId === truckId);
    if (truck) {
      setDriverName(truck.driverAssigned);
      setPreviousOdometer(truck.currentOdo.toString());
      setOdometerReading((truck.currentOdo + 850).toString());
    }
  };

  const numLiters = parseFloat(liters) || 0;
  const numRate = parseFloat(ratePerLiter) || 0;
  const numCurrentOdo = parseFloat(odometerReading) || 0;
  const numPrevOdo = parseFloat(previousOdometer) || 0;

  // Real-time calculation rules
  // Rule 1: Total fuel cost = Litres × Price per litre
  const calculatedTotalCost = calculateTotalFuelCost(numLiters, numRate);

  // Rule 2: Distance travelled
  const distanceTravelled = numCurrentOdo > numPrevOdo ? numCurrentOdo - numPrevOdo : 0;

  // Rule 3: Mileage (km/L) = Distance travelled ÷ Litres consumed
  const { mileage, status: mileageStatus } = calculateMileage(
    distanceTravelled,
    numLiters,
    isFullTank
  );

  // Rule 4: Fuel cost per km = Diesel cost ÷ Distance travelled
  const costPerKm = distanceTravelled > 0 ? calculatedTotalCost / distanceTravelled : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numLiters <= 0) {
      setError('Please enter a valid fuel volume in litres.');
      return;
    }
    if (numRate <= 0) {
      setError('Please enter a valid rate per litre.');
      return;
    }
    if (numCurrentOdo <= numPrevOdo) {
      setError('Current odometer reading must be greater than previous reading.');
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedTruck = truckList.find((t) => t.truckId === selectedTruckId);

      await onSubmit({
        date: new Date(date).toISOString(),
        truckId: selectedTruckId,
        truckNumber: selectedTruck?.truckNumber || 'MH 12 RN 4821',
        truckModel: 'Commercial Carrier',
        driverName,
        liters: numLiters,
        ratePerLiter: numRate,
        totalAmount: calculatedTotalCost,
        fuelStation,
        stationBrand,
        odometerReadingKm: numCurrentOdo,
        distanceSinceLastFuelKm: distanceTravelled,
        tripReference,
        isFullTank,
        calculatedMileage: mileage,
        mileageStatus,
        receiptNumber,
        paymentMode,
        notes,
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save fuel entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Diesel Fuel Entry"
      subtitle="Record verified fuel disbursement with odometer verification and mileage computation"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Truck Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Truck Registration *
            </label>
            <select
              value={selectedTruckId}
              onChange={(e) => handleTruckChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {truckList.map((truck) => (
                <option key={truck.truckId} value={truck.truckId}>
                  {truck.truckNumber} ({truck.driverAssigned})
                </option>
              ))}
            </select>
          </div>

          {/* Driver Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Driver on Duty *
            </label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Refuel Date & Time *
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Trip Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Trip / Consignment Code
            </label>
            <input
              type="text"
              value={tripReference}
              onChange={(e) => setTripReference(e.target.value)}
              placeholder="e.g. TRP-BOM-BLR-892"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Fuel Station */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fuel Station / Outlet Name *
            </label>
            <input
              type="text"
              value={fuelStation}
              onChange={(e) => setFuelStation(e.target.value)}
              required
              placeholder="e.g. IndianOil COCO Shirwal, NH-48"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Fuel Brand */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fuel Brand / Chain *
            </label>
            <select
              value={stationBrand}
              onChange={(e) => setStationBrand(e.target.value as StationBrand)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="IndianOil">IndianOil (IOCL)</option>
              <option value="HP">Hindustan Petroleum (HPCL)</option>
              <option value="Bharat Petroleum">Bharat Petroleum (BPCL)</option>
              <option value="Reliance">Reliance / Jio-bp</option>
              <option value="Shell">Shell</option>
              <option value="Other">Other Authorized Retailer</option>
            </select>
          </div>

          {/* Liters */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Diesel Quantity (Litres) *
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              value={liters}
              onChange={(e) => setLiters(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Rate per Liter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Diesel Rate / Litre (₹) *
            </label>
            <input
              type="number"
              step="0.05"
              min="50"
              max="150"
              value={ratePerLiter}
              onChange={(e) => setRatePerLiter(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Previous Odometer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Previous Odometer (km)
            </label>
            <input
              type="number"
              value={previousOdometer}
              onChange={(e) => setPreviousOdometer(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none"
            />
          </div>

          {/* Current Odometer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Odometer Reading (km) *
            </label>
            <input
              type="number"
              value={odometerReading}
              onChange={(e) => setOdometerReading(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Full Tank Verification Checkbox */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isFullTank}
              onChange={(e) => setIsFullTank(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-xs font-semibold text-slate-900">
                Full-Tank Refuel (Filled until auto-nozzle cutoff)
              </span>
              <p className="text-[11px] text-slate-600">
                Recommended for strict mileage audits. Enables accurate km/L calculation between two full tanks.
              </p>
            </div>
          </label>
        </div>

        {/* Real-time Calculation Preview Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span>FleetOS Automatic Calculation Preview</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[11px]">Total Cost</span>
              <p className="font-mono text-base font-bold text-slate-900 mt-0.5">
                {formatINR(calculatedTotalCost)}
              </p>
              <span className="text-[10px] text-slate-400">Litres × Rate</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[11px]">Distance Run</span>
              <p className="font-mono text-base font-bold text-slate-900 mt-0.5">
                {distanceTravelled > 0 ? `${distanceTravelled.toLocaleString('en-IN')} km` : '—'}
              </p>
              <span className="text-[10px] text-slate-400">Odo difference</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[11px]">Calculated Mileage</span>
              <p className="font-mono text-base font-bold text-emerald-700 mt-0.5">
                {mileage ? `${mileage.toFixed(2)} km/L` : '—'}
              </p>
              <span className="text-[10px] text-slate-400">
                {isFullTank ? 'Full-tank verified' : 'Partial estimate'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[11px]">Cost per KM</span>
              <p className="font-mono text-base font-bold text-slate-900 mt-0.5">
                {costPerKm ? `₹${costPerKm.toFixed(2)}` : '—'}
              </p>
              <span className="text-[10px] text-slate-400">Diesel cost ÷ km</span>
            </div>
          </div>
        </div>

        {/* Payment & Receipt Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Mode *
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="FLEET_CARD">Fleet Card (IOCL XTRAPOWER / HPCL DriveTrack)</option>
              <option value="FASTAG_WALLET">FASTag Fuel Wallet</option>
              <option value="UPI">Corporate UPI / QR</option>
              <option value="CASH">Driver Cash Reimbursement</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pump Receipt / Invoice No.
            </label>
            <input
              type="text"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="e.g. IOC-55421"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
            Save & Record Fuel Entry
          </Button>
        </div>
      </form>
    </Modal>
  );
};

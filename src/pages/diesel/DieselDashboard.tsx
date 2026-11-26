import React, { useEffect, useState } from 'react';
import { SummaryCards } from '../../components/diesel/SummaryCards';
import { ConsumptionChart } from '../../components/diesel/ConsumptionChart';
import { TruckUsageCard } from '../../components/diesel/TruckUsageCard';
import { FuelEntriesTable } from '../../components/diesel/FuelEntriesTable';
import { QuickActions } from '../../components/diesel/QuickActions';
import { AddFuelEntryModal } from '../../components/diesel/AddFuelEntryModal';
import { MileageTargetModal } from '../../components/diesel/MileageTargetModal';
import { FuelStationsModal } from '../../components/diesel/FuelStationsModal';
import { FuelAlertsModal } from '../../components/diesel/FuelAlertsModal';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { DieselService } from '../../services/dieselService';
import {
  DieselSummaryMetrics,
  DieselConsumptionPoint,
  TruckDieselUsage,
  DieselEntry,
  FuelStationSummary,
  MileageTargetSetting,
} from '../../types/diesel';
import { formatINR, formatLiters, formatDate } from '../../utils/formatters';
import { 
  Fuel, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Receipt, 
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export const DieselDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DieselSummaryMetrics | null>(null);
  const [consumptionData, setConsumptionData] = useState<DieselConsumptionPoint[]>([]);
  const [truckUsages, setTruckUsages] = useState<TruckDieselUsage[]>([]);
  const [recentEntries, setRecentEntries] = useState<DieselEntry[]>([]);
  const [fuelStations, setFuelStations] = useState<FuelStationSummary[]>([]);
  const [mileageTargets, setMileageTargets] = useState<MileageTargetSetting[]>([]);
  
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isTargetsOpen, setIsTargetsOpen] = useState(false);
  const [isStationsOpen, setIsStationsOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [selectedEntryDetails, setSelectedEntryDetails] = useState<DieselEntry | null>(null);

  // Load initial data
  useEffect(() => {
    loadData(granularity);
  }, []);

  const loadData = async (gran: 'daily' | 'weekly' | 'monthly') => {
    setIsLoading(true);
    try {
      const [m, c, t, e, s, tg] = await Promise.all([
        DieselService.getSummaryMetrics(),
        DieselService.getConsumptionData(gran),
        DieselService.getTruckUsages(),
        DieselService.getRecentEntries(10),
        DieselService.getFuelStations(),
        DieselService.getMileageTargets(),
      ]);
      setMetrics(m);
      setConsumptionData(c);
      setTruckUsages(t);
      setRecentEntries(e);
      setFuelStations(s);
      setMileageTargets(tg);
    } catch (err) {
      console.error('Failed to load diesel dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGranularityChange = async (newGran: 'daily' | 'weekly' | 'monthly') => {
    setGranularity(newGran);
    const data = await DieselService.getConsumptionData(newGran);
    setConsumptionData(data);
  };

  const handleAddFuelEntry = async (entryData: any) => {
    const created = await DieselService.addDieselEntry(entryData);
    // Refresh table and metrics
    const updatedEntries = await DieselService.getRecentEntries(10);
    setRecentEntries(updatedEntries);
    showToast(`Fuel voucher ${created.id} recorded successfully for ${created.truckNumber}!`);
  };

  const handleSaveMileageTargets = async (targets: MileageTargetSetting[]) => {
    for (const t of targets) {
      await DieselService.updateMileageTarget(t);
    }
    setMileageTargets(targets);
    showToast('Fleet mileage targets successfully synchronized.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const truckListForForm = truckUsages.map((t) => ({
    truckId: t.truckId,
    truckNumber: t.truckNumber,
    driverAssigned: t.driverAssigned,
    currentOdo: 140000 + Math.floor(t.totalDistanceKm),
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Breadcrumb & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Fleet Operations</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-slate-800">Diesel Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Diesel Performance & Cost Control
          </h2>
        </div>

        {/* Fleet Verification Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 rounded-lg px-3 py-1.5 text-xs text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold">Full-Tank Audit Rule: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Quick Action Control Bar */}
      <QuickActions
        onAddFuelEntry={() => setIsAddEntryOpen(true)}
        onFuelStations={() => setIsStationsOpen(true)}
        onSetMileageTarget={() => setIsTargetsOpen(true)}
        onAlertsReminders={() => setIsAlertsOpen(true)}
        onViewReports={() => showToast('Generating Fleet Diesel Audit Report (PDF/Excel)...')}
      />

      {/* A. Summary Cards */}
      {metrics ? (
        <SummaryCards metrics={metrics} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Middle Analytics Grid: B (Chart) & C (Truck Usage) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Diesel Consumption Chart (7 Cols on desktop) */}
        <div className="lg:col-span-7">
          <ConsumptionChart
            data={consumptionData}
            granularity={granularity}
            onGranularityChange={handleGranularityChange}
            isLoading={isLoading}
          />
        </div>

        {/* Truck-wise Diesel Usage (5 Cols on desktop) */}
        <div className="lg:col-span-5">
          <TruckUsageCard
            truckUsages={truckUsages}
            onSelectTruck={(truck) => {
              showToast(`Selected ${truck.truckNumber} — Avg Mileage: ${truck.averageMileage} km/L`);
            }}
          />
        </div>
      </div>

      {/* Bottom Section: D. Recent Fuel Entries Table */}
      <div>
        <FuelEntriesTable
          entries={recentEntries}
          onAddEntry={() => setIsAddEntryOpen(true)}
          onViewDetails={(entry) => setSelectedEntryDetails(entry)}
        />
      </div>

      {/* Modal 1: Add Fuel Entry Form */}
      <AddFuelEntryModal
        isOpen={isAddEntryOpen}
        onClose={() => setIsAddEntryOpen(false)}
        onSubmit={handleAddFuelEntry}
        truckList={truckListForForm}
      />

      {/* Modal 2: Set Mileage Targets */}
      <MileageTargetModal
        isOpen={isTargetsOpen}
        onClose={() => setIsTargetsOpen(false)}
        targets={mileageTargets}
        onSaveTargets={handleSaveMileageTargets}
      />

      {/* Modal 3: Fuel Stations Breakdown */}
      <FuelStationsModal
        isOpen={isStationsOpen}
        onClose={() => setIsStationsOpen(false)}
        stations={fuelStations}
      />

      {/* Modal 4: Fuel Alerts & Reminders */}
      <FuelAlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        onViewTruck={(truckNum) => {
          showToast(`Filtered for vehicle ${truckNum}`);
        }}
      />

      {/* Modal 5: Voucher Details Viewer */}
      {selectedEntryDetails && (
        <Modal
          isOpen={!!selectedEntryDetails}
          onClose={() => setSelectedEntryDetails(null)}
          title={`Fuel Receipt Voucher — ${selectedEntryDetails.id}`}
          subtitle={`Verified transaction voucher for vehicle ${selectedEntryDetails.truckNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs text-slate-500">Transaction ID</span>
                <span className="font-mono text-xs font-bold text-slate-900">{selectedEntryDetails.id}</span>
              </div>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Truck:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedEntryDetails.truckNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Driver:</span>
                  <span className="font-medium text-slate-800">{selectedEntryDetails.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="text-slate-800">{formatDate(selectedEntryDetails.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fuel Station:</span>
                  <span className="font-medium text-slate-800 text-right">{selectedEntryDetails.fuelStation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-mono font-medium text-blue-700">{selectedEntryDetails.paymentMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt / Invoice No:</span>
                  <span className="font-mono text-slate-700">{selectedEntryDetails.receiptNumber || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                <span className="text-[10px] text-blue-600 font-medium">Quantity</span>
                <p className="font-mono font-bold text-blue-900 mt-0.5">{formatLiters(selectedEntryDetails.liters)}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium">Rate/Litre</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">₹{selectedEntryDetails.ratePerLiter.toFixed(2)}</p>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-emerald-600 font-medium">Total Paid</span>
                <p className="font-mono font-bold text-emerald-900 mt-0.5">{formatINR(selectedEntryDetails.totalAmount)}</p>
              </div>
            </div>

            {selectedEntryDetails.notes && (
              <div className="text-xs text-slate-600 bg-amber-50/60 border border-amber-200/60 p-3 rounded-lg">
                <strong className="text-amber-900">Driver & Auditor Notes:</strong> {selectedEntryDetails.notes}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

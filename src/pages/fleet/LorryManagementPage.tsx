import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../components/common/Button';
import { LorrySummaryCards } from '../../components/fleet/LorrySummaryCards';
import { LorryFilterBar } from '../../components/fleet/LorryFilterBar';
import { LorryTable } from '../../components/fleet/LorryTable';
import { AddLorryModal } from '../../components/fleet/AddLorryModal';
import { LorryDetailModal } from '../../components/fleet/LorryDetailModal';
import { DeleteLorryModal } from '../../components/fleet/DeleteLorryModal';
import { Lorry, LorryFilterParams } from '../../types/lorry';
import { LorryService } from '../../services/lorryService';
import { PlusCircle, Truck, CheckCircle2, ChevronRight, Download } from 'lucide-react';

export const LorryManagementPage: React.FC = () => {
  // State from LorryService
  const [lorries, setLorries] = useState<Lorry[]>(() => LorryService.getAllLorries());
  const [metrics, setMetrics] = useState(() => LorryService.getSummaryMetrics());

  // Filter & Search State
  const [filters, setFilters] = useState<LorryFilterParams>({
    searchQuery: '',
    vehicleType: 'ALL',
    status: 'ALL',
  });

  // Modal Controls
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [lorryToEdit, setLorryToEdit] = useState<Lorry | null>(null);
  const [lorryToView, setLorryToView] = useState<Lorry | null>(null);
  const [lorryToDelete, setLorryToDelete] = useState<Lorry | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subscribe to LorryService updates
  useEffect(() => {
    const unsubscribe = LorryService.subscribe(() => {
      setLorries(LorryService.getAllLorries());
      setMetrics(LorryService.getSummaryMetrics());
    });
    return unsubscribe;
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filter Lorries based on search, type, and status
  const filteredLorries = useMemo(() => {
    return lorries.filter((lorry) => {
      // 1. Search query (matches registration, owner, driver, or model)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().replace(/\s+/g, '');
        const reg = lorry.registrationNumber.toLowerCase().replace(/\s+/g, '');
        const owner = lorry.ownerName.toLowerCase();
        const driver = (lorry.driverName || '').toLowerCase();
        const model = lorry.model.toLowerCase();

        const matches =
          reg.includes(query) ||
          owner.includes(filters.searchQuery.toLowerCase()) ||
          driver.includes(filters.searchQuery.toLowerCase()) ||
          model.includes(filters.searchQuery.toLowerCase());

        if (!matches) return false;
      }

      // 2. Vehicle Type
      if (filters.vehicleType !== 'ALL' && lorry.vehicleType !== filters.vehicleType) {
        return false;
      }

      // 3. Status
      if (filters.status !== 'ALL' && lorry.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [lorries, filters]);

  // Handlers
  const handleOpenAddModal = () => {
    setLorryToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (lorry: Lorry) => {
    setLorryToEdit(lorry);
    setIsAddModalOpen(true);
  };

  const handleLorrySaved = (savedLorry: Lorry) => {
    if (lorryToEdit) {
      showToast(`Lorry ${savedLorry.registrationNumber} updated successfully!`);
    } else {
      showToast(`Lorry ${savedLorry.registrationNumber} added to fleet roster successfully!`);
    }
  };

  const handleDeleteLorry = (lorryId: string) => {
    const target = lorries.find((l) => l.id === lorryId);
    const success = LorryService.deleteLorry(lorryId);
    if (success) {
      showToast(`Lorry ${target?.registrationNumber || lorryId} deleted successfully.`);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      vehicleType: 'ALL',
      status: 'ALL',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Fleet Operations</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-slate-800">Lorry Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Lorry Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage and monitor all registered vehicles.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5 text-slate-600" />}
            onClick={() => showToast('Exporting Lorry Registry as CSV / Excel...')}
          >
            Export Fleet List
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={handleOpenAddModal}
            className="shadow-sm"
          >
            + Add Lorry
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <LorrySummaryCards metrics={metrics} />

      {/* Search and Filters */}
      <LorryFilterBar
        filters={filters}
        onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
        onResetFilters={handleResetFilters}
        totalCount={lorries.length}
        filteredCount={filteredLorries.length}
      />

      {/* Lorry Table */}
      <LorryTable
        lorries={filteredLorries}
        onViewDetails={(lorry) => setLorryToView(lorry)}
        onEdit={(lorry) => handleOpenEditModal(lorry)}
        onDelete={(lorry) => setLorryToDelete(lorry)}
        onAddNew={handleOpenAddModal}
      />

      {/* Main Feature: Add / Edit Lorry Popup Modal */}
      <AddLorryModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setLorryToEdit(null);
        }}
        onSave={handleLorrySaved}
        lorryToEdit={lorryToEdit}
      />

      {/* Lorry Details Profile Modal */}
      <LorryDetailModal
        isOpen={!!lorryToView}
        lorry={lorryToView}
        onClose={() => setLorryToView(null)}
        onEdit={(lorry) => handleOpenEditModal(lorry)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteLorryModal
        isOpen={!!lorryToDelete}
        lorry={lorryToDelete}
        onClose={() => setLorryToDelete(null)}
        onConfirmDelete={handleDeleteLorry}
      />
    </div>
  );
};

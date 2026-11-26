import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../components/common/Button';
import { LorrySummaryCards } from '../../components/fleet/LorrySummaryCards';
import { LorryFilterBar } from '../../components/fleet/LorryFilterBar';
import { LorryTable } from '../../components/fleet/LorryTable';
import { AddLorryModal } from '../../components/fleet/AddLorryModal';
import { useNavigate } from 'react-router-dom';
import { DeleteLorryModal } from '../../components/fleet/DeleteLorryModal';
import { Lorry, LorryFilterParams } from '../../types/lorry';
import { LorryService } from '../../services/lorryService';
import { Plus, Download, CheckCircle2 } from 'lucide-react';

export const LorryManagementPage: React.FC = () => {
  const [lorries, setLorries] = useState<Lorry[]>(() => LorryService.getAllLorries());
  const [metrics, setMetrics] = useState(() => LorryService.getSummaryMetrics());

  // Filter & Search State
  const [filters, setFilters] = useState<LorryFilterParams>({
    searchQuery: '',
    vehicleType: 'ALL',
    status: 'ALL',
    dateFilter: '',
  });

  // Modal Controls
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [lorryToEdit, setLorryToEdit] = useState<Lorry | null>(null);
  const navigate = useNavigate();
  const [lorryToDelete, setLorryToDelete] = useState<Lorry | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Filter Lorries
  const filteredLorries = useMemo(() => {
    return lorries.filter((lorry) => {
      // 1. Search by registration number or driver name
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().replace(/\s+/g, '');
        const reg = lorry.registrationNumber.toLowerCase().replace(/\s+/g, '');
        const driver = (lorry.driverName || '').toLowerCase();
        const model = lorry.model.toLowerCase();

        const matches =
          reg.includes(query) ||
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

      // 4. Date filter (if set)
      if (filters.dateFilter) {
        const createdDate = lorry.createdAt.slice(0, 10);
        if (createdDate < filters.dateFilter) {
          // just an example filter comparison
        }
      }

      return true;
    });
  }, [lorries, filters]);

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
      showToast(`Lorry ${savedLorry.registrationNumber} added successfully!`);
    }
  };

  const handleDeleteLorry = (lorryId: string) => {
    const target = lorries.find((l) => l.id === lorryId);
    const success = LorryService.deleteLorry(lorryId);
    if (success) {
      showToast(`Lorry ${target?.registrationNumber || lorryId} deleted successfully.`);
    }
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

      {/* Page Header matching reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Lorry Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your lorries and driver details in one place.
          </p>
        </div>

        {/* Right side: Export button and Blue + Add Lorry button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => showToast('Exporting Lorry Registry...')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Lorry
          </button>
        </div>
      </div>

      {/* Summary Cards: Exactly 5 cards in one horizontal row */}
      <LorrySummaryCards metrics={metrics} />

      {/* Search and Filter Section */}
      <LorryFilterBar
        filters={filters}
        onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
      />

      {/* Lorry Table: Exactly 7 columns matching reference */}
      <LorryTable
        lorries={filteredLorries}
        onViewDetails={(lorry) => navigate(`/fleet/${lorry.id}`)}
        onEdit={(lorry) => handleOpenEditModal(lorry)}
        onDelete={(lorry) => setLorryToDelete(lorry)}
        onAddNew={handleOpenAddModal}
      />

      {/* Add / Edit Lorry Popup Modal */}
      <AddLorryModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setLorryToEdit(null);
        }}
        onSave={handleLorrySaved}
        lorryToEdit={lorryToEdit}
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

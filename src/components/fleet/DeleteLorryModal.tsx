import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Trash2, AlertCircle } from 'lucide-react';
import { Lorry } from '../../types/lorry';

interface DeleteLorryModalProps {
  isOpen: boolean;
  lorry: Lorry | null;
  onClose: () => void;
  onConfirmDelete: (lorryId: string) => void;
}

export const DeleteLorryModal: React.FC<DeleteLorryModalProps> = ({
  isOpen,
  lorry,
  onClose,
  onConfirmDelete,
}) => {
  if (!lorry) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Lorry Deletion"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-3.5">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800">
            <p className="font-bold text-rose-900">High Risk Action</p>
            <p className="mt-0.5 leading-relaxed">
              Are you sure you want to remove <strong className="font-mono text-rose-950 font-bold">{lorry.registrationNumber}</strong> from FleetOS?
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs space-y-1.5 font-sans">
          <div className="flex justify-between">
            <span className="text-slate-500">Vehicle:</span>
            <span className="font-mono font-semibold text-slate-800">{lorry.registrationNumber} ({lorry.model})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Driver Assigned:</span>
            <span className="font-medium text-slate-800">{lorry.driverName || 'Unassigned'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Current Status:</span>
            <span className="font-semibold text-slate-800">{lorry.status}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => {
              onConfirmDelete(lorry.id);
              onClose();
            }}
          >
            Yes, Delete Lorry
          </Button>
        </div>
      </div>
    </Modal>
  );
};

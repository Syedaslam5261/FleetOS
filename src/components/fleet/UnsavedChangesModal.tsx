import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onStay: () => void;
  onDiscard: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onStay,
  onDiscard,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onStay}
      title="Discard Unsaved Changes?"
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-100 p-2 text-amber-700 flex-shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              You have unsaved changes in the lorry form.
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              If you leave now, all your entered information will be discarded. Are you sure you want to exit?
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={onStay}>
            Keep Editing
          </Button>
          <Button variant="danger" size="sm" onClick={onDiscard}>
            Discard & Exit
          </Button>
        </div>
      </div>
    </Modal>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { UnsavedChangesModal } from './UnsavedChangesModal';
import { Lorry, VehicleType, LorryStatus, LorryDocument } from '../../types/lorry';
import { LorryService } from '../../services/lorryService';
import {
  Truck,
  CreditCard,
  FileText,
  Gauge,
  AlertCircle,
  Upload,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { clsx } from 'clsx';

interface AddLorryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedLorry: Lorry) => void;
  lorryToEdit?: Lorry | null;
}

const VEHICLE_TYPES: VehicleType[] = [
  '32 FT SXL',
  '32 FT MXL',
  '20 FT',
  '14 FT',
  '10 FT',
  'Trailer',
  'Other',
];

const LORRY_STATUSES: LorryStatus[] = [
  'Active',
  'On Trip',
  'Maintenance',
  'Available',
  'Inactive',
];

export const AddLorryModal: React.FC<AddLorryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  lorryToEdit,
}) => {
  const isEditMode = !!lorryToEdit;

  // 1. Vehicle Information
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('32 FT MXL');
  const [manufacturer, setManufacturer] = useState('Tata Motors');
  const [model, setModel] = useState('Signa 4825.TK (2023)');
  const [manufacturingYear, setManufacturingYear] = useState<number>(2023);
  const [vehicleColour, setVehicleColour] = useState('Highway White');
  const [loadCapacityTonnes, setLoadCapacityTonnes] = useState<string>('28.5');
  const [numberOfTyres, setNumberOfTyres] = useState<number>(14);
  const [bodyType, setBodyType] = useState('Closed Container');

  // 2. Driver Information (Optional)
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [driverLicenceNumber, setDriverLicenceNumber] = useState('');
  const [licenceExpiryDate, setLicenceExpiryDate] = useState('');

  // 3. Documents
  const [rcDoc, setRcDoc] = useState<LorryDocument | undefined>();
  const [insuranceDoc, setInsuranceDoc] = useState<LorryDocument | undefined>();
  const [fitnessDoc, setFitnessDoc] = useState<LorryDocument | undefined>();
  const [pucDoc, setPucDoc] = useState<LorryDocument | undefined>();
  const [permitDoc, setPermitDoc] = useState<LorryDocument | undefined>();

  // 4. Operational Information
  const [odometerReadingKm, setOdometerReadingKm] = useState<string>('120000');
  const [status, setStatus] = useState<LorryStatus>('Available');
  const [registrationExpiryDate, setRegistrationExpiryDate] = useState('2038-05-15');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('2027-04-30');
  const [notes, setNotes] = useState('');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // File input refs
  const rcInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);
  const fitnessInputRef = useRef<HTMLInputElement>(null);
  const pucInputRef = useRef<HTMLInputElement>(null);
  const permitInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (lorryToEdit) {
        setRegistrationNumber(lorryToEdit.registrationNumber);
        setVehicleType(lorryToEdit.vehicleType);
        setManufacturer(lorryToEdit.manufacturer);
        setModel(lorryToEdit.model);
        setManufacturingYear(lorryToEdit.manufacturingYear);
        setVehicleColour(lorryToEdit.vehicleColour);
        setLoadCapacityTonnes(lorryToEdit.loadCapacityTonnes.toString());
        setNumberOfTyres(lorryToEdit.numberOfTyres);
        setBodyType(lorryToEdit.bodyType);

        setDriverName(lorryToEdit.driverName || '');
        setDriverMobile(lorryToEdit.driverMobile || '');
        setDriverLicenceNumber(lorryToEdit.driverLicenceNumber || '');
        setLicenceExpiryDate(lorryToEdit.licenceExpiryDate || '');

        setRcDoc(lorryToEdit.rcDocument);
        setInsuranceDoc(lorryToEdit.insuranceDocument);
        setFitnessDoc(lorryToEdit.fitnessDocument);
        setPucDoc(lorryToEdit.pucDocument);
        setPermitDoc(lorryToEdit.permitDocument);

        setOdometerReadingKm(lorryToEdit.odometerReadingKm.toString());
        setStatus(lorryToEdit.status);
        setRegistrationExpiryDate(lorryToEdit.registrationExpiryDate || '');
        setInsuranceExpiryDate(lorryToEdit.insuranceExpiryDate || '');
        setNotes(lorryToEdit.notes || '');
      } else {
        setRegistrationNumber('');
        setVehicleType('32 FT MXL');
        setManufacturer('Tata Motors');
        setModel('Signa 4825.TK (2023)');
        setManufacturingYear(2023);
        setVehicleColour('Highway White');
        setLoadCapacityTonnes('28.5');
        setNumberOfTyres(14);
        setBodyType('Closed Container');

        setDriverName('');
        setDriverMobile('');
        setDriverLicenceNumber('');
        setLicenceExpiryDate('');

        setRcDoc(undefined);
        setInsuranceDoc(undefined);
        setFitnessDoc(undefined);
        setPucDoc(undefined);
        setPermitDoc(undefined);

        setOdometerReadingKm('115000');
        setStatus('Available');
        setRegistrationExpiryDate('2038-05-15');
        setInsuranceExpiryDate('2027-04-30');
        setNotes('');
      }
      setErrors({});
      setIsDirty(false);
      setShowDiscardConfirm(false);
    }
  }, [isOpen, lorryToEdit]);

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<LorryDocument | undefined>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setter({
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        type: file.type || 'application/pdf',
      });
      markDirty();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const regTrimmed = registrationNumber.trim().toUpperCase();
    if (!regTrimmed) {
      newErrors.registrationNumber = 'Registration number is required.';
    } else if (regTrimmed.length < 5) {
      newErrors.registrationNumber = 'Please enter a valid registration number (e.g. MH 12 RN 4821).';
    } else {
      const isUnique = LorryService.isRegistrationUnique(regTrimmed, lorryToEdit?.id);
      if (!isUnique) {
        newErrors.registrationNumber = `Registration number "${regTrimmed}" already exists in FleetOS.`;
      }
    }

    const cap = parseFloat(loadCapacityTonnes);
    if (isNaN(cap) || cap <= 0) {
      newErrors.loadCapacityTonnes = 'Please enter a valid load capacity in tonnes.';
    }

    const odo = parseFloat(odometerReadingKm);
    if (isNaN(odo) || odo < 0) {
      newErrors.odometerReadingKm = 'Valid odometer reading in km is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload: Omit<Lorry, 'id' | 'createdAt' | 'updatedAt'> = {
        registrationNumber: registrationNumber.trim().toUpperCase(),
        vehicleType,
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        manufacturingYear: Number(manufacturingYear) || 2023,
        vehicleColour: vehicleColour.trim() || 'White',
        loadCapacityTonnes: parseFloat(loadCapacityTonnes),
        numberOfTyres: Number(numberOfTyres) || 10,
        bodyType: bodyType.trim() || 'Container',

        driverName: driverName.trim() || undefined,
        driverMobile: driverMobile.trim() || undefined,
        driverLicenceNumber: driverLicenceNumber.trim() || undefined,
        licenceExpiryDate: licenceExpiryDate || undefined,

        rcDocument: rcDoc,
        insuranceDocument: insuranceDoc,
        fitnessDocument: fitnessDoc,
        pucDocument: pucDoc,
        permitDocument: permitDoc,

        odometerReadingKm: parseFloat(odometerReadingKm),
        status,
        registrationExpiryDate: registrationExpiryDate || undefined,
        insuranceExpiryDate: insuranceExpiryDate || undefined,
        notes: notes.trim() || undefined,
      };

      let result: Lorry;
      if (isEditMode && lorryToEdit) {
        result = LorryService.updateLorry(lorryToEdit.id, payload);
      } else {
        result = LorryService.createLorry(payload);
      }

      setIsDirty(false);
      onSave(result);
      onClose();
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        form: err.message || 'An error occurred while saving the lorry.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleRequestClose}
        title={isEditMode ? `Edit Lorry — ${lorryToEdit?.registrationNumber}` : 'Add Lorry'}
        subtitle={
          isEditMode
            ? 'Update vehicle details, driver, compliance and operational status.'
            : 'Enter vehicle and driver information to register a new lorry.'
        }
        maxWidth="3xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Global error banner */}
          {(errors.form || Object.keys(errors).length > 0) && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Please correct the following:</p>
                <ul className="list-disc list-inside mt-0.5">
                  {errors.form && <li>{errors.form}</li>}
                  {errors.registrationNumber && <li>{errors.registrationNumber}</li>}
                  {errors.loadCapacityTonnes && <li>{errors.loadCapacityTonnes}</li>}
                  {errors.odometerReadingKm && <li>{errors.odometerReadingKm}</li>}
                </ul>
              </div>
            </div>
          )}

          {/* Section 1: Vehicle Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Vehicle Information</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Number *</label>
                <input
                  type="text"
                  placeholder="e.g. MH 12 RN 4821"
                  value={registrationNumber}
                  onChange={(e) => {
                    setRegistrationNumber(e.target.value);
                    markDirty();
                    if (errors.registrationNumber) setErrors((prev) => ({ ...prev, registrationNumber: '' }));
                  }}
                  className={clsx(
                    'w-full rounded-lg border px-3 py-2 text-xs font-mono font-bold tracking-wider uppercase text-slate-900 focus:outline-none focus:ring-1',
                    errors.registrationNumber
                      ? 'border-rose-400 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500'
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Type *</label>
                <select
                  value={vehicleType}
                  onChange={(e) => { setVehicleType(e.target.value as VehicleType); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer *</label>
                <select
                  value={manufacturer}
                  onChange={(e) => { setManufacturer(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Tata Motors">Tata Motors</option>
                  <option value="Ashok Leyland">Ashok Leyland</option>
                  <option value="BharatBenz">BharatBenz</option>
                  <option value="Eicher">Eicher</option>
                  <option value="Mahindra">Mahindra</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Model</label>
                <input
                  type="text"
                  placeholder="e.g. Signa 4825.TK (2023)"
                  value={model}
                  onChange={(e) => { setModel(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturing Year</label>
                <input
                  type="number"
                  min="2010"
                  max="2027"
                  value={manufacturingYear}
                  onChange={(e) => { setManufacturingYear(Number(e.target.value)); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Colour</label>
                <input
                  type="text"
                  placeholder="e.g. Highway White"
                  value={vehicleColour}
                  onChange={(e) => { setVehicleColour(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Load Capacity (Tonnes) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={loadCapacityTonnes}
                  onChange={(e) => { setLoadCapacityTonnes(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Tyres</label>
                <select
                  value={numberOfTyres}
                  onChange={(e) => { setNumberOfTyres(Number(e.target.value)); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={6}>6 Tyres</option>
                  <option value={10}>10 Tyres</option>
                  <option value={12}>12 Tyres</option>
                  <option value={14}>14 Tyres</option>
                  <option value={16}>16 Tyres</option>
                  <option value={18}>18 Tyres</option>
                  <option value={22}>22 Tyres</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Body Type</label>
                <input
                  type="text"
                  placeholder="e.g. Closed Container, Open Body"
                  value={bodyType}
                  onChange={(e) => { setBodyType(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Driver Information (Optional) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Driver Information</h4>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">Optional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sukhwinder Singh"
                  value={driverName}
                  onChange={(e) => { setDriverName(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Mobile Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={driverMobile}
                  onChange={(e) => { setDriverMobile(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Driving Licence Number</label>
                <input
                  type="text"
                  placeholder="e.g. MH12 20170029182"
                  value={driverLicenceNumber}
                  onChange={(e) => { setDriverLicenceNumber(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono uppercase text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Licence Expiry Date</label>
                <input
                  type="date"
                  value={licenceExpiryDate}
                  onChange={(e) => { setLicenceExpiryDate(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Documents */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="h-4 w-4 text-amber-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Documents</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              <DocItem label="RC" doc={rcDoc} inputRef={rcInputRef} onSelect={(e) => handleFileUpload(e, setRcDoc)} onRemove={() => { setRcDoc(undefined); markDirty(); }} />
              <DocItem label="Insurance" doc={insuranceDoc} inputRef={insuranceInputRef} onSelect={(e) => handleFileUpload(e, setInsuranceDoc)} onRemove={() => { setInsuranceDoc(undefined); markDirty(); }} />
              <DocItem label="Fitness Certificate" doc={fitnessDoc} inputRef={fitnessInputRef} onSelect={(e) => handleFileUpload(e, setFitnessDoc)} onRemove={() => { setFitnessDoc(undefined); markDirty(); }} />
              <DocItem label="PUC" doc={pucDoc} inputRef={pucInputRef} onSelect={(e) => handleFileUpload(e, setPucDoc)} onRemove={() => { setPucDoc(undefined); markDirty(); }} />
              <DocItem label="Permit" doc={permitDoc} inputRef={permitInputRef} onSelect={(e) => handleFileUpload(e, setPermitDoc)} onRemove={() => { setPermitDoc(undefined); markDirty(); }} />
            </div>
          </div>

          {/* Section 4: Operational Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Gauge className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Operational Information</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Odometer (km) *</label>
                <input
                  type="number"
                  min="0"
                  value={odometerReadingKm}
                  onChange={(e) => { setOdometerReadingKm(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Status *</label>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value as LorryStatus); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {LORRY_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Expiry</label>
                <input
                  type="date"
                  value={registrationExpiryDate}
                  onChange={(e) => { setRegistrationExpiryDate(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Insurance Expiry</label>
                <input
                  type="date"
                  value={insuranceExpiryDate}
                  onChange={(e) => { setInsuranceExpiryDate(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  placeholder="Operational remarks or notes..."
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" size="md" onClick={handleRequestClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              {isEditMode ? 'Save Lorry' : 'Save Lorry'}
            </Button>
          </div>
        </form>
      </Modal>

      <UnsavedChangesModal
        isOpen={showDiscardConfirm}
        onStay={() => setShowDiscardConfirm(false)}
        onDiscard={() => {
          setShowDiscardConfirm(false);
          setIsDirty(false);
          onClose();
        }}
      />
    </>
  );
};

const DocItem: React.FC<{
  label: string;
  doc?: LorryDocument;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}> = ({ label, doc, inputRef, onSelect, onRemove }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 flex items-center justify-between text-xs">
      <input type="file" ref={inputRef as any} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={onSelect} />
      <div className="min-w-0 pr-2">
        <p className="font-semibold text-slate-800">{label}</p>
        {doc ? (
          <p className="text-[10px] text-emerald-700 font-mono truncate">{doc.name}</p>
        ) : (
          <p className="text-[10px] text-slate-400">Not uploaded</p>
        )}
      </div>
      {doc ? (
        <button type="button" onClick={onRemove} className="text-rose-500 hover:text-rose-700 p-1">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="text-blue-600 hover:text-blue-800 font-medium text-[11px] flex items-center gap-1">
          <Upload className="w-3 h-3" /> Upload
        </button>
      )}
    </div>
  );
};

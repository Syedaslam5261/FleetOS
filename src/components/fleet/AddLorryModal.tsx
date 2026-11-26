import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { UnsavedChangesModal } from './UnsavedChangesModal';
import { Lorry, VehicleType, LorryStatus, LorryDocument } from '../../types/lorry';
import { LorryService } from '../../services/lorryService';
import {
  Truck,
  User,
  CreditCard,
  FileText,
  Gauge,
  AlertCircle,
  Upload,
  CheckCircle2,
  Trash2,
  Info
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
  'Available',
  'Active',
  'On Trip',
  'Maintenance',
  'Inactive',
];

export const AddLorryModal: React.FC<AddLorryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  lorryToEdit,
}) => {
  const isEditMode = !!lorryToEdit;

  // Form State
  // Section A - Vehicle Information
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('32 FT MXL');
  const [manufacturer, setManufacturer] = useState('Tata Motors');
  const [model, setModel] = useState('Signa 4825.TK');
  const [manufacturingYear, setManufacturingYear] = useState<number>(2023);
  const [vehicleColour, setVehicleColour] = useState('Highway White');
  const [loadCapacityTonnes, setLoadCapacityTonnes] = useState<string>('28.5');
  const [numberOfTyres, setNumberOfTyres] = useState<number>(14);
  const [bodyType, setBodyType] = useState('Closed Container');

  // Section B - Owner Information
  const [ownerName, setOwnerName] = useState('Apex Freightways India');
  const [ownerMobile, setOwnerMobile] = useState('9822014455');
  const [companyName, setCompanyName] = useState('Apex Freightways Private Limited');
  const [ownerEmail, setOwnerEmail] = useState('ops@apexlogistics.in');
  const [ownerAddress, setOwnerAddress] = useState('Plot 42, Transport Nagar, Nigdi, Pune, MH 411044');

  // Section C - Driver Information (optional)
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [driverLicenceNumber, setDriverLicenceNumber] = useState('');
  const [licenceExpiryDate, setLicenceExpiryDate] = useState('');

  // Section D - Documents (local state)
  const [rcDoc, setRcDoc] = useState<LorryDocument | undefined>();
  const [insuranceDoc, setInsuranceDoc] = useState<LorryDocument | undefined>();
  const [fitnessDoc, setFitnessDoc] = useState<LorryDocument | undefined>();
  const [pucDoc, setPucDoc] = useState<LorryDocument | undefined>();
  const [permitDoc, setPermitDoc] = useState<LorryDocument | undefined>();

  // Section E - Operational Information
  const [odometerReadingKm, setOdometerReadingKm] = useState<string>('120000');
  const [status, setStatus] = useState<LorryStatus>('Available');
  const [registrationExpiryDate, setRegistrationExpiryDate] = useState('2038-05-15');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('2027-04-30');
  const [notes, setNotes] = useState('');

  // Validation & UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Hidden file input refs
  const rcInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);
  const fitnessInputRef = useRef<HTMLInputElement>(null);
  const pucInputRef = useRef<HTMLInputElement>(null);
  const permitInputRef = useRef<HTMLInputElement>(null);

  // Reset or Populate form on open/change
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

        setOwnerName(lorryToEdit.ownerName);
        setOwnerMobile(lorryToEdit.ownerMobile);
        setCompanyName(lorryToEdit.companyName || '');
        setOwnerEmail(lorryToEdit.ownerEmail || '');
        setOwnerAddress(lorryToEdit.ownerAddress || '');

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
        // Defaults for fresh Add
        setRegistrationNumber('');
        setVehicleType('32 FT MXL');
        setManufacturer('Tata Motors');
        setModel('Signa 4825.TK Multi-Axle');
        setManufacturingYear(2023);
        setVehicleColour('Highway White');
        setLoadCapacityTonnes('28.5');
        setNumberOfTyres(14);
        setBodyType('Closed Container');

        setOwnerName('Apex Freightways India');
        setOwnerMobile('9822014455');
        setCompanyName('Apex Freightways Private Limited');
        setOwnerEmail('ops@apexlogistics.in');
        setOwnerAddress('Plot 42, Transport Nagar, Nigdi, Pune, MH 411044');

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

  // Track user edits
  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Safe Close Request
  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Document upload handler (temporary local state)
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

  // Validation logic
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Registration Number
    const regTrimmed = registrationNumber.trim().toUpperCase();
    if (!regTrimmed) {
      newErrors.registrationNumber = 'Registration number is required.';
    } else if (regTrimmed.length < 5) {
      newErrors.registrationNumber = 'Please enter a valid registration plate (e.g. MH 12 RN 4821).';
    } else {
      const isUnique = LorryService.isRegistrationUnique(regTrimmed, lorryToEdit?.id);
      if (!isUnique) {
        newErrors.registrationNumber = `Registration number "${regTrimmed}" is already registered in FleetOS.`;
      }
    }

    // Vehicle Type
    if (!vehicleType) {
      newErrors.vehicleType = 'Vehicle type is required.';
    }

    // Load capacity
    const cap = parseFloat(loadCapacityTonnes);
    if (isNaN(cap) || cap <= 0) {
      newErrors.loadCapacityTonnes = 'Please enter a valid load capacity in tonnes.';
    }

    // Owner Name
    if (!ownerName.trim()) {
      newErrors.ownerName = 'Owner full name is required.';
    }

    // Owner Mobile
    const cleanMobile = ownerMobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      newErrors.ownerMobile = 'Valid 10-digit mobile number is required.';
    }

    // Odometer
    const odo = parseFloat(odometerReadingKm);
    if (isNaN(odo) || odo < 0) {
      newErrors.odometerReadingKm = 'Valid odometer reading in km is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      // Scroll to top of modal to see errors
      return;
    }

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

        ownerName: ownerName.trim(),
        ownerMobile: ownerMobile.trim(),
        companyName: companyName.trim() || undefined,
        ownerEmail: ownerEmail.trim() || undefined,
        ownerAddress: ownerAddress.trim() || undefined,

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
        title={isEditMode ? `Edit Lorry — ${lorryToEdit?.registrationNumber}` : 'Add New Commercial Lorry'}
        subtitle={
          isEditMode
            ? 'Update vehicle specifications, ownership, driver assignments, or compliance records.'
            : 'Register a vehicle into the fleet with complete technical specs, ownership, and compliance documents.'
        }
        maxWidth="4xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* Global error banner if registration exists or form fails */}
          {(errors.form || Object.keys(errors).length > 0) && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Please correct the highlighted errors before saving:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {errors.form && <li>{errors.form}</li>}
                  {errors.registrationNumber && <li>{errors.registrationNumber}</li>}
                  {errors.ownerName && <li>{errors.ownerName}</li>}
                  {errors.ownerMobile && <li>{errors.ownerMobile}</li>}
                  {errors.loadCapacityTonnes && <li>{errors.loadCapacityTonnes}</li>}
                  {errors.odometerReadingKm && <li>{errors.odometerReadingKm}</li>}
                </ul>
              </div>
            </div>
          )}

          {/* SECTION A — Vehicle Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Section A — Vehicle Information</h4>
                <p className="text-[11px] text-slate-500">Core vehicle specs, registration, and chassis configuration</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Registration Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH 12 RN 4821"
                  value={registrationNumber}
                  onChange={(e) => {
                    setRegistrationNumber(e.target.value);
                    markDirty();
                    if (errors.registrationNumber) {
                      setErrors((prev) => ({ ...prev, registrationNumber: '' }));
                    }
                  }}
                  className={clsx(
                    'w-full rounded-lg border px-3 py-2 text-xs font-mono font-bold tracking-wider uppercase text-slate-900 focus:outline-none focus:ring-1',
                    errors.registrationNumber
                      ? 'border-rose-400 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500'
                  )}
                />
                {errors.registrationNumber && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.registrationNumber}</p>
                )}
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Type *
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => {
                    setVehicleType(e.target.value as VehicleType);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Manufacturer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manufacturer *
                </label>
                <select
                  value={manufacturer}
                  onChange={(e) => {
                    setManufacturer(e.target.value);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Tata Motors">Tata Motors</option>
                  <option value="Ashok Leyland">Ashok Leyland</option>
                  <option value="BharatBenz">BharatBenz</option>
                  <option value="Eicher">Eicher Motors</option>
                  <option value="Mahindra">Mahindra & Mahindra</option>
                  <option value="Volvo">Volvo Trucks</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Model Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Signa 4825.TK"
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Manufacturing Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manufacturing Year
                </label>
                <input
                  type="number"
                  min="2000"
                  max="2027"
                  value={manufacturingYear}
                  onChange={(e) => {
                    setManufacturingYear(Number(e.target.value));
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Vehicle Colour */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Colour
                </label>
                <input
                  type="text"
                  placeholder="e.g. Highway White, Navy Blue"
                  value={vehicleColour}
                  onChange={(e) => {
                    setVehicleColour(e.target.value);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Load Capacity (tonnes) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Load Capacity (Tonnes) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    placeholder="e.g. 28.5"
                    value={loadCapacityTonnes}
                    onChange={(e) => {
                      setLoadCapacityTonnes(e.target.value);
                      markDirty();
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                    Tonnes
                  </span>
                </div>
              </div>

              {/* Number of Tyres */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Number of Tyres
                </label>
                <select
                  value={numberOfTyres}
                  onChange={(e) => {
                    setNumberOfTyres(Number(e.target.value));
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={4}>4 Wheeler</option>
                  <option value={6}>6 Wheeler (Small Commercial)</option>
                  <option value={10}>10 Wheeler</option>
                  <option value={12}>12 Wheeler</option>
                  <option value={14}>14 Wheeler</option>
                  <option value={16}>16 Wheeler</option>
                  <option value={18}>18 Wheeler</option>
                  <option value={22}>22 Wheeler (Heavy Multi-Axle)</option>
                </select>
              </div>

              {/* Body Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Body Type
                </label>
                <select
                  value={bodyType}
                  onChange={(e) => {
                    setBodyType(e.target.value);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Closed Container">Closed Container</option>
                  <option value="Open Body">Open Body / High Side</option>
                  <option value="Flatbed">Flatbed Trailer</option>
                  <option value="Tipper / Dumper">Tipper / Dumper</option>
                  <option value="Tanker">Liquid Tanker</option>
                  <option value="Refrigerated">Refrigerated (Reefer)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION B — Owner Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Section B — Owner Information</h4>
                <p className="text-[11px] text-slate-500">Registered vehicle owner, corporate fleet, or transporter contact</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Owner Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Freightways India / Rajesh Kumar"
                  value={ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    markDirty();
                    if (errors.ownerName) setErrors((prev) => ({ ...prev, ownerName: '' }));
                  }}
                  className={clsx(
                    'w-full rounded-lg border px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1',
                    errors.ownerName
                      ? 'border-rose-400 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500'
                  )}
                />
                {errors.ownerName && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.ownerName}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Mobile Number *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9822014455"
                    value={ownerMobile}
                    onChange={(e) => {
                      setOwnerMobile(e.target.value);
                      markDirty();
                      if (errors.ownerMobile) setErrors((prev) => ({ ...prev, ownerMobile: '' }));
                    }}
                    className={clsx(
                      'w-full rounded-lg border pl-11 pr-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-1',
                      errors.ownerMobile
                        ? 'border-rose-400 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500'
                    )}
                  />
                </div>
                {errors.ownerMobile && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.ownerMobile}</p>
                )}
              </div>

              {/* Fleet / Company Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fleet / Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Freightways Pvt Ltd"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="ops@company.in"
                  value={ownerEmail}
                  onChange={(e) => {
                    setOwnerEmail(e.target.value);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Address (Spans 2 cols) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Address
                </label>
                <input
                  type="text"
                  placeholder="Plot / Office address, Transport Nagar, City, State, PIN"
                  value={ownerAddress}
                  onChange={(e) => {
                    setOwnerAddress(e.target.value);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION C — Driver Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">Section C — Driver Information</h4>
                  <p className="text-[11px] text-slate-500">Assigned driver details (Optional: Leave blank if unassigned)</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                Optional
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Driver Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driver Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sukhwinder Singh"
                  value={driverName}
                  onChange={(e) => {
                    setDriverName(e.target.value);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Driver Mobile */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driver Mobile Number
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={driverMobile}
                  onChange={(e) => {
                    setDriverMobile(e.target.value);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* DL Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driving Licence (DL) No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH12 20170029182"
                  value={driverLicenceNumber}
                  onChange={(e) => {
                    setDriverLicenceNumber(e.target.value);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono uppercase text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Licence Expiry Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  DL Expiry Date
                </label>
                <input
                  type="date"
                  value={licenceExpiryDate}
                  onChange={(e) => {
                    setLicenceExpiryDate(e.target.value);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION D — Documents */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">Section D — Compliance & Documents</h4>
                  <p className="text-[11px] text-slate-500">Upload or attach RC, insurance, fitness, and national permit files</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">PDF, JPG, PNG (up to 10MB)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Document 1: Registration Certificate (RC) */}
              <DocumentUploadItem
                label="Registration Certificate (RC)"
                doc={rcDoc}
                inputRef={rcInputRef}
                onSelect={(e) => handleFileUpload(e, setRcDoc)}
                onRemove={() => { setRcDoc(undefined); markDirty(); }}
              />

              {/* Document 2: Insurance Certificate */}
              <DocumentUploadItem
                label="Insurance Certificate"
                doc={insuranceDoc}
                inputRef={insuranceInputRef}
                onSelect={(e) => handleFileUpload(e, setInsuranceDoc)}
                onRemove={() => { setInsuranceDoc(undefined); markDirty(); }}
              />

              {/* Document 3: Fitness Certificate */}
              <DocumentUploadItem
                label="Fitness Certificate"
                doc={fitnessDoc}
                inputRef={fitnessInputRef}
                onSelect={(e) => handleFileUpload(e, setFitnessDoc)}
                onRemove={() => { setFitnessDoc(undefined); markDirty(); }}
              />

              {/* Document 4: PUC Certificate */}
              <DocumentUploadItem
                label="Pollution Under Control (PUC)"
                doc={pucDoc}
                inputRef={pucInputRef}
                onSelect={(e) => handleFileUpload(e, setPucDoc)}
                onRemove={() => { setPucDoc(undefined); markDirty(); }}
              />

              {/* Document 5: National / State Permit */}
              <DocumentUploadItem
                label="National / State Permit"
                doc={permitDoc}
                inputRef={permitInputRef}
                onSelect={(e) => handleFileUpload(e, setPermitDoc)}
                onRemove={() => { setPermitDoc(undefined); markDirty(); }}
              />
            </div>
          </div>

          {/* SECTION E — Operational Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <Gauge className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Section E — Operational Information</h4>
                <p className="text-[11px] text-slate-500">Status, baseline odometer, and validity dates</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Odometer Reading */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Odometer (km) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="120000"
                    value={odometerReadingKm}
                    onChange={(e) => {
                      setOdometerReadingKm(e.target.value);
                      markDirty();
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                    km
                  </span>
                </div>
              </div>

              {/* Operational Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as LorryStatus);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {LORRY_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Registration Expiry */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registration Expiry Date
                </label>
                <input
                  type="date"
                  value={registrationExpiryDate}
                  onChange={(e) => {
                    setRegistrationExpiryDate(e.target.value);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Insurance Expiry */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Insurance Expiry Date
                </label>
                <input
                  type="date"
                  value={insuranceExpiryDate}
                  onChange={(e) => {
                    setInsuranceExpiryDate(e.target.value);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Additional Notes (Spans full width) */}
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operational Remarks & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Assigned to FMCG long-haul corridor. FASTag tag ID registered with ICICI Bank. GPS tracker model Teltonika FMB920 installed."
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 bg-white">
            <span className="text-[11px] text-slate-400 font-sans">
              * Required fields. All changes are stored securely in FleetOS.
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleRequestClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isEditMode ? 'Save Lorry Changes' : 'Save Lorry'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Unsaved Changes Confirmation Modal */}
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

interface DocumentUploadItemProps {
  label: string;
  doc?: LorryDocument;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

const DocumentUploadItem: React.FC<DocumentUploadItemProps> = ({
  label,
  doc,
  inputRef,
  onSelect,
  onRemove,
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 flex flex-col justify-between min-h-[92px]">
      <input
        type="file"
        ref={inputRef as any}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={onSelect}
      />

      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-slate-800">{label}</span>
        {doc ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Attached
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">Pending</span>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
        {doc ? (
          <>
            <span className="font-mono text-slate-700 truncate max-w-[140px]" title={doc.name}>
              {doc.name}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="text-rose-600 hover:text-rose-800"
                title="Remove file"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
          >
            <Upload className="w-3 h-3" /> Select File
          </button>
        )}
      </div>
    </div>
  );
};

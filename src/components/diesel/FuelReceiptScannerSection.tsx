import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileImage,
  Loader2,
  RefreshCw,
  Save,
  ScanLine,
  Upload,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../common/Button';
import { Lorry } from '../../types/lorry';
import {
  OcrExtractedReceipt,
  ReceiptPaymentMethod,
  ReceiptPaymentStatus,
} from '../../types/fuelReceipt';
import { LorryService } from '../../services/lorryService';
import { FuelReceiptService } from '../../services/fuelReceiptService';
import { TripService } from '../../services/tripService';
import { runReceiptOcr } from '../../utils/receiptOcrParser';
import { formatINR } from '../../utils/formatters';

interface FuelReceiptScannerSectionProps {
  lorry: Lorry;
  onSaved: (targetLorryId: string) => void;
}

const PAYMENT_METHODS: ReceiptPaymentMethod[] = [
  'Cash',
  'UPI',
  'Card',
  'Bank Transfer',
  'Other',
];

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const todayIso = () => new Date().toISOString().slice(0, 10);

export const FuelReceiptScannerSection: React.FC<FuelReceiptScannerSectionProps> = ({
  lorry,
  onSaved,
}) => {
  const allLorries = useMemo(() => LorryService.getAllLorries(), []);

  // Image capture / upload state
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);

  // OCR state
  const [isScanning, setIsScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const [ocrResult, setOcrResult] = useState<OcrExtractedReceipt | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);

  // Editable verification form fields
  const [selectedLorryId, setSelectedLorryId] = useState(lorry.id);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [fuelStation, setFuelStation] = useState('');
  const [stationLocation, setStationLocation] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptDate, setReceiptDate] = useState(todayIso());
  const [receiptTime, setReceiptTime] = useState('');
  const [dieselLitres, setDieselLitres] = useState('');
  const [pricePerLitre, setPricePerLitre] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [gstDetails, setGstDetails] = useState('');

  const lorryTrips = useMemo(() => TripService.getByLorryId(selectedLorryId), [selectedLorryId]);

  // Payment status — ALWAYS starts unselected; owner must explicitly confirm PAID or UNPAID
  const [paymentStatus, setPaymentStatus] = useState<ReceiptPaymentStatus | null>(null);
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [paymentMethod, setPaymentMethod] = useState<ReceiptPaymentMethod>('UPI');

  const [formError, setFormError] = useState<string | null>(null);

  // Stop camera stream on unmount
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Attach stream when video element mounts
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => undefined);
    }
  }, [cameraActive]);

  const handleOpenCamera = async () => {
    setCameraError(null);
    setOcrError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback to native mobile camera file input
      mobileCameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setCameraError(
        'Camera permission denied or unavailable in this browser. Using device photo picker or Upload Receipt instead.'
      );
      mobileCameraInputRef.current?.click();
    }
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopCamera();
    setImageDataUrl(dataUrl);
    setImageFileName(`camera-receipt-${Date.now()}.jpg`);
    setOcrResult(null);
    setOcrError(null);
    setShowVerificationForm(false);
    setPaymentStatus(null);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCameraError('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setCameraError('Image file is too large. Maximum allowed size is 10 MB.');
      return;
    }

    stopCamera();
    setCameraError(null);
    setOcrError(null);
    setOcrResult(null);
    setShowVerificationForm(false);
    setPaymentStatus(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageDataUrl(reader.result);
        setImageFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setImageDataUrl(null);
    setImageFileName('');
    setOcrResult(null);
    setOcrError(null);
    setShowVerificationForm(false);
    setPaymentStatus(null);
    setFormError(null);
  };

  const handleRunOcr = async () => {
    if (!imageDataUrl) return;
    setIsScanning(true);
    setOcrProgress(0);
    setOcrStatusText('Initializing Tesseract OCR engine...');
    setOcrError(null);
    setFormError(null);

    try {
      const extracted = await runReceiptOcr(imageDataUrl, (pct, status) => {
        setOcrProgress(pct);
        setOcrStatusText(status);
      });

      setOcrResult(extracted);
      setFuelStation(extracted.fuelStation);
      setReceiptNumber(extracted.receiptNumber);
      setReceiptDate(extracted.receiptDate || todayIso());
      setReceiptTime(extracted.receiptTime);
      setDieselLitres(extracted.dieselLitres);
      setPricePerLitre(extracted.pricePerLitre);
      setTotalAmount(extracted.totalAmount);
      setGstDetails(extracted.gstDetails);

      // If OCR detected a vehicle plate matching a registered lorry, select it; otherwise keep current lorry
      if (extracted.lorryRegistration) {
        const norm = extracted.lorryRegistration.replace(/\s+/g, '').toUpperCase();
        const matched = allLorries.find(
          (l) => l.registrationNumber.replace(/\s+/g, '').toUpperCase() === norm
        );
        if (matched) setSelectedLorryId(matched.id);
      }

      // IMPORTANT: Never auto-mark as PAID even if OCR detected a payment keyword
      setPaymentStatus(null);
      setShowVerificationForm(true);
    } catch (err) {
      setOcrError(
        err instanceof Error
          ? err.message
          : 'OCR extraction failed. You can still enter the receipt details manually below.'
      );
      setShowVerificationForm(true);
    } finally {
      setIsScanning(false);
    }
  };

  // Auto-calculate total when litres and price are edited
  const computedTotal = useMemo(() => {
    const l = parseFloat(dieselLitres);
    const p = parseFloat(pricePerLitre);
    if (Number.isFinite(l) && l > 0 && Number.isFinite(p) && p > 0) {
      return Math.round(l * p * 100) / 100;
    }
    return null;
  }, [dieselLitres, pricePerLitre]);

  const handleLitresOrPriceChange = (nextLitres: string, nextPrice: string) => {
    setDieselLitres(nextLitres);
    setPricePerLitre(nextPrice);
    const l = parseFloat(nextLitres);
    const p = parseFloat(nextPrice);
    if (Number.isFinite(l) && l > 0 && Number.isFinite(p) && p > 0) {
      setTotalAmount((Math.round(l * p * 100) / 100).toFixed(2));
    }
  };

  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetLorry = allLorries.find((l) => l.id === selectedLorryId) ?? lorry;
    const litres = parseFloat(dieselLitres);
    const price = parseFloat(pricePerLitre);
    const total = parseFloat(totalAmount);

    if (!fuelStation.trim()) {
      setFormError('Fuel station name is required.');
      return;
    }
    if (!receiptNumber.trim()) {
      setFormError('Receipt / invoice number is required.');
      return;
    }
    if (!receiptDate) {
      setFormError('Receipt date is required.');
      return;
    }
    if (!Number.isFinite(litres) || litres <= 0) {
      setFormError('Enter a valid diesel quantity in litres greater than zero.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setFormError('Enter a valid diesel price per litre greater than zero.');
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      setFormError('Enter a valid total amount greater than zero.');
      return;
    }
    if (!paymentStatus) {
      setFormError('Please explicitly select Payment Status (PAID or UNPAID) before saving.');
      return;
    }
    if (paymentStatus === 'PAID' && (!paymentDate || !paymentMethod)) {
      setFormError('Please enter both Payment Date and Payment Method for a PAID receipt.');
      return;
    }

    try {
      FuelReceiptService.addReceipt({
        lorryId: targetLorry.id,
        lorryRegistration: targetLorry.registrationNumber,
        tripId: selectedTripId || undefined,
        fuelStation: fuelStation.trim(),
        stationLocation: stationLocation.trim() || undefined,
        receiptNumber: receiptNumber.trim(),
        receiptDate,
        receiptTime: receiptTime || undefined,
        dieselLitres: Math.round(litres * 100) / 100,
        pricePerLitre: Math.round(price * 100) / 100,
        totalAmount: Math.round(total * 100) / 100,
        gstDetails: gstDetails.trim() || undefined,
        paymentStatus,
        paymentDate: paymentStatus === 'PAID' ? paymentDate : undefined,
        paymentMethod: paymentStatus === 'PAID' ? paymentMethod : undefined,
        imageDataUrl: imageDataUrl ?? undefined,
        imageFileName: imageFileName || undefined,
        ocrExtracted: !!ocrResult,
      });

      onSaved(targetLorry.id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save fuel receipt.');
    }
  };

  const inputCls =
    'min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* STAGE 1: Capture / Upload / Preview / Scan */}
      {!showVerificationForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">1. Capture or Upload Diesel Receipt</h2>
              <p className="text-xs text-slate-500">
                Use your phone camera or upload a receipt photo (JPG/PNG/WEBP, max 10 MB), then run OCR extraction.
              </p>
            </div>
            <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
              Tesseract.js OCR
            </span>
          </div>

          {cameraError && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Live Camera Stream */}
          {cameraActive && (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-slate-950">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="max-h-96 w-full object-contain"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  leftIcon={<Camera className="h-4 w-4" />}
                  onClick={handleCapturePhoto}
                  className="min-h-[48px] flex-1"
                >
                  Capture Receipt
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  leftIcon={<X className="h-4 w-4" />}
                  onClick={stopCamera}
                  className="min-h-[48px]"
                >
                  Cancel Camera
                </Button>
              </div>
            </div>
          )}

          {/* Initial Action Buttons (No Image Yet) */}
          {!cameraActive && !imageDataUrl && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleOpenCamera}
                  className="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b1329] text-white">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Open Camera</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Capture a live photo of the fuel pump receipt
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Upload Receipt</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Select an existing receipt image from your device
                    </p>
                  </div>
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowVerificationForm(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Or enter receipt details manually without an image
                </button>
              </div>
            </div>
          )}

          {/* Receipt Preview + Scan Button */}
          {!cameraActive && imageDataUrl && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 truncate">
                    <FileImage className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{imageFileName || 'Captured receipt'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRetake}
                    disabled={isScanning}
                    className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retake / Replace
                  </button>
                </div>
                <img
                  src={imageDataUrl}
                  alt="Fuel receipt preview"
                  className="mx-auto max-h-96 rounded-lg border border-slate-200 bg-white object-contain"
                />
              </div>

              {isScanning && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      {ocrStatusText || 'Scanning receipt...'}
                    </span>
                    <span className="font-mono">{ocrProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all duration-150"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  leftIcon={<ScanLine className="h-4 w-4" />}
                  onClick={handleRunOcr}
                  isLoading={isScanning}
                  className="min-h-[48px] flex-1"
                >
                  Scan Receipt
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setShowVerificationForm(true)}
                  disabled={isScanning}
                  className="min-h-[48px]"
                >
                  Skip OCR & Enter Manually
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGE 2: Verify Extracted Information + Confirm Payment Status + Save */}
      {showVerificationForm && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Original Receipt Image (Above on mobile, Left on desktop) */}
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Original Receipt Image
                </h3>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retake / Upload New
                </button>
              </div>

              {imageDataUrl ? (
                <img
                  src={imageDataUrl}
                  alt="Uploaded fuel receipt"
                  className="mx-auto max-h-[440px] w-full rounded-lg border border-slate-200 bg-slate-50 object-contain"
                />
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-10 px-4 text-center space-y-3">
                  <FileImage className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="text-xs text-slate-500">No receipt image attached.</p>
                  <div className="flex justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Camera className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setShowVerificationForm(false);
                        handleOpenCamera();
                      }}
                    >
                      Camera
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Upload className="h-3.5 w-3.5" />}
                      onClick={() => uploadInputRef.current?.click()}
                    >
                      Upload
                    </Button>
                  </div>
                </div>
              )}

              {/* OCR Extraction Status Summary */}
              {ocrResult && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">OCR Extraction Complete</span>
                    <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700">
                      Confidence: {ocrResult.confidence}%
                    </span>
                  </div>

                  {ocrResult.missingFields.length > 0 && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                      <strong>Needs manual entry:</strong> {ocrResult.missingFields.join(', ')}.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowRawOcr((v) => !v)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900"
                  >
                    {showRawOcr ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {showRawOcr ? 'Hide raw OCR text' : 'View raw OCR text'}
                  </button>

                  {showRawOcr && (
                    <pre className="max-h-40 overflow-auto rounded border border-slate-200 bg-white p-2 font-mono text-[10px] text-slate-700 whitespace-pre-wrap">
                      {ocrResult.rawText}
                    </pre>
                  )}
                </div>
              )}

              {ocrError && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
                  <span>{ocrError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Editable Verification Form */}
          <form
            onSubmit={handleSaveReceipt}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5 lg:col-span-7"
          >
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                2. Verify Extracted Details & Confirm Payment
              </h2>
              <p className="text-xs text-slate-500">
                Review and correct any unclear or missing fields before saving to Fuel Receipts.
              </p>
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Fuel Station Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IndianOil COCO Plaza"
                  value={fuelStation}
                  onChange={(e) => setFuelStation(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Station Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shirwal, NH-48, Maharashtra"
                  value={stationLocation}
                  onChange={(e) => setStationLocation(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Receipt / Invoice Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IOC-88291"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className={`${inputCls} font-mono uppercase`}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Lorry Registration *
                </label>
                <select
                  value={selectedLorryId}
                  onChange={(e) => {
                    setSelectedLorryId(e.target.value);
                    setSelectedTripId('');
                  }}
                  className={`${inputCls} font-mono font-semibold`}
                >
                  {allLorries.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.registrationNumber} ({l.vehicleType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Assign to Trip (Optional — leave Unassigned if not linked)
                </label>
                <select
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Unassigned Fuel Purchase</option>
                  {lorryTrips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} — {t.startLocation} → {t.destination} ({t.startDate} to {t.completionDate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Receipt Date *
                </label>
                <input
                  type="date"
                  required
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Receipt Time (Optional)
                </label>
                <input
                  type="time"
                  value={receiptTime}
                  onChange={(e) => setReceiptTime(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Diesel Quantity (Litres) *
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="e.g. 250.00"
                  value={dieselLitres}
                  onChange={(e) => handleLitresOrPriceChange(e.target.value, pricePerLitre)}
                  className={`${inputCls} font-mono font-semibold`}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Diesel Price (₹/L) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="e.g. 91.50"
                  value={pricePerLitre}
                  onChange={(e) => handleLitresOrPriceChange(dieselLitres, e.target.value)}
                  className={`${inputCls} font-mono font-semibold`}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Total Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="e.g. 22875.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className={`${inputCls} font-mono font-bold`}
                />
                {computedTotal !== null &&
                  totalAmount !== '' &&
                  Math.abs(parseFloat(totalAmount) - computedTotal) > 1 && (
                    <p className="mt-1 text-[11px] text-amber-700">
                      Litres × Price = {formatINR(computedTotal)}. Please double-check total.
                    </p>
                  )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  GST Details / GSTIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. GSTIN: 27AAACI1681G1Z5"
                  value={gstDetails}
                  onChange={(e) => setGstDetails(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>

            {/* REQUIRED PAYMENT STATUS CONFIRMATION */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Payment Status (Owner Confirmation Required) *
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  FleetOS never marks a receipt as paid automatically. Please confirm whether this receipt has been paid.
                </p>
                {ocrResult?.detectedPaymentHint && (
                  <p className="mt-1.5 inline-block rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] text-blue-800">
                    OCR noted "{ocrResult.detectedPaymentHint}" on the receipt — please verify below.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('PAID');
                    if (ocrResult?.detectedPaymentHint && PAYMENT_METHODS.includes(ocrResult.detectedPaymentHint as ReceiptPaymentMethod)) {
                      setPaymentMethod(ocrResult.detectedPaymentHint as ReceiptPaymentMethod);
                    }
                  }}
                  className={clsx(
                    'flex min-h-[48px] items-center justify-center gap-2 rounded-lg border text-xs font-bold transition-colors',
                    paymentStatus === 'PAID'
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                      : 'border-slate-300 bg-white text-emerald-700 hover:bg-emerald-50'
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" /> PAID
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentStatus('UNPAID')}
                  className={clsx(
                    'flex min-h-[48px] items-center justify-center gap-2 rounded-lg border text-xs font-bold transition-colors',
                    paymentStatus === 'UNPAID'
                      ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                      : 'border-slate-300 bg-white text-rose-700 hover:bg-rose-50'
                  )}
                >
                  <AlertCircle className="h-4 w-4" /> UNPAID
                </button>
              </div>

              {paymentStatus === 'PAID' && (
                <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as ReceiptPaymentMethod)}
                      className={inputCls}
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {paymentStatus === 'UNPAID' && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <strong>Pending Payment:</strong> This receipt will be saved as <strong>UNPAID</strong>. You can mark
                  it as PAID later from Fuel Receipts with payment date and method.
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setShowVerificationForm(false)}
                className="min-h-[46px]"
              >
                Back to Preview
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                leftIcon={<Save className="h-4 w-4" />}
                className="min-h-[46px]"
              >
                Save Receipt
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

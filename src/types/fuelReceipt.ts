export type ReceiptPaymentStatus = 'PAID' | 'UNPAID';

export type ReceiptPaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other';

export interface OcrExtractedReceipt {
  fuelStation: string;
  receiptNumber: string;
  receiptDate: string; // YYYY-MM-DD or ''
  receiptTime: string; // HH:MM or ''
  lorryRegistration: string;
  dieselLitres: string;
  pricePerLitre: string;
  totalAmount: string;
  gstDetails: string;
  /** Informational OCR hint only — NEVER used to auto-mark a receipt as PAID. */
  detectedPaymentHint: string;
  rawText: string;
  confidence: number; // 0..100
  missingFields: string[];
}

export interface FuelReceiptRecord {
  id: string;
  lorryId: string;
  lorryRegistration: string;
  /** Linked trip ID when assigned; undefined means Unassigned Fuel Purchase. */
  tripId?: string;
  fuelStation: string;
  stationLocation?: string;
  receiptNumber: string;
  receiptDate: string; // YYYY-MM-DD
  receiptTime?: string; // HH:MM
  dieselLitres: number;
  pricePerLitre: number;
  totalAmount: number;
  gstDetails?: string;
  paymentStatus: ReceiptPaymentStatus;
  paymentDate?: string; // YYYY-MM-DD, required when PAID
  paymentMethod?: ReceiptPaymentMethod; // required when PAID
  /** Data URL of uploaded/captured receipt image (stored in browser memory for demo) */
  imageDataUrl?: string;
  imageFileName?: string;
  ocrExtracted: boolean;
  isDemoSeed?: boolean;
  createdAt: string; // ISO UTC
}

export interface FleetTripRecord {
  id: string;
  lorryId: string;
  startLocation: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  completionDate: string; // YYYY-MM-DD
  status: 'Completed' | 'In Transit' | 'Scheduled';
}


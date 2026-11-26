export type VehicleType = 
  | '32 FT SXL'
  | '32 FT MXL'
  | '20 FT'
  | '14 FT'
  | '10 FT'
  | 'Trailer'
  | 'Other';

export type LorryStatus = 
  | 'Available'
  | 'Active'
  | 'On Trip'
  | 'Maintenance'
  | 'Inactive';

export interface LorryDocument {
  name: string;
  size: number; // in bytes
  uploadedAt: string;
  type: string;
}

export interface Lorry {
  id: string;
  // Section A - Vehicle Information
  registrationNumber: string; // unique, e.g. "MH 12 RN 4821"
  vehicleType: VehicleType;
  manufacturer: string; // e.g. "Tata Motors", "Ashok Leyland"
  model: string; // e.g. "Signa 4825.TK"
  manufacturingYear: number;
  vehicleColour: string;
  loadCapacityTonnes: number;
  numberOfTyres: number;
  bodyType: string; // e.g. "Container", "Open Body", "Tipper"

  // Section B - Owner Information
  ownerName: string;
  ownerMobile: string;
  companyName?: string;
  ownerEmail?: string;
  ownerAddress?: string;

  // Section C - Driver Information (optional)
  driverName?: string;
  driverMobile?: string;
  driverLicenceNumber?: string;
  licenceExpiryDate?: string;

  // Section D - Documents
  rcDocument?: LorryDocument;
  insuranceDocument?: LorryDocument;
  fitnessDocument?: LorryDocument;
  pucDocument?: LorryDocument;
  permitDocument?: LorryDocument;

  // Section E - Operational Information
  odometerReadingKm: number;
  status: LorryStatus;
  registrationExpiryDate?: string;
  insuranceExpiryDate?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface LorrySummaryMetrics {
  totalLorries: number;
  activeLorries: number;
  availableLorries: number;
  onTripLorries: number;
  maintenanceLorries: number;
}

export interface LorryFilterParams {
  searchQuery: string;
  vehicleType: 'ALL' | VehicleType;
  status: 'ALL' | LorryStatus;
}

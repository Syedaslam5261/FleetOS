export type VehicleType = 
  | '32 FT SXL'
  | '32 FT MXL'
  | '20 FT'
  | '14 FT'
  | '10 FT'
  | 'Trailer'
  | 'Other';

export type LorryStatus = 
  | 'Active'
  | 'On Trip'
  | 'Maintenance'
  | 'Available'
  | 'Inactive';

export interface LorryDocument {
  name: string;
  size: number;
  uploadedAt: string;
  type: string;
}

export interface Lorry {
  id: string;
  // Vehicle Information
  registrationNumber: string; // unique, e.g. "MH 12 RN 4821"
  vehicleType: VehicleType;
  manufacturer: string; // e.g. "Tata Motors", "Ashok Leyland"
  model: string; // e.g. "Signa 4825.TK (2023)"
  manufacturingYear: number;
  vehicleColour: string;
  loadCapacityTonnes: number;
  numberOfTyres: number;
  bodyType: string;

  // Driver Information (optional)
  driverName?: string;
  driverMobile?: string;
  driverLicenceNumber?: string;
  licenceExpiryDate?: string;

  // Documents
  rcDocument?: LorryDocument;
  insuranceDocument?: LorryDocument;
  fitnessDocument?: LorryDocument;
  pucDocument?: LorryDocument;
  permitDocument?: LorryDocument;

  // Operational Information
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
  onTripLorries: number;
  maintenanceLorries: number;
  availableLorries: number;
}

export interface LorryFilterParams {
  searchQuery: string;
  vehicleType: 'ALL' | VehicleType;
  status: 'ALL' | LorryStatus;
  dateFilter?: string;
}

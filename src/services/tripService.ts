import { FleetTripRecord } from '../types/fuelReceipt';

/**
 * DEMO DATA ONLY.
 * Connected trip records per lorry across multiple weeks (Nov 2026),
 * multiple months (2026), and 2025.
 * LR-007 (GJ 18 GH 5566) intentionally has 0 trips to exercise empty states.
 */
export const DEMO_TRIPS: FleetTripRecord[] = [
  // LR-001 (MH 12 RN 4821)
  { id: 'TRP-2026-101', lorryId: 'LR-001', startLocation: 'Mumbai', destination: 'Bengaluru', startDate: '2026-11-23', completionDate: '2026-11-26', status: 'In Transit' },
  { id: 'TRP-2026-098', lorryId: 'LR-001', startLocation: 'Pune', destination: 'Hyderabad', startDate: '2026-11-16', completionDate: '2026-11-19', status: 'Completed' },
  { id: 'TRP-2026-092', lorryId: 'LR-001', startLocation: 'Mumbai', destination: 'Ahmedabad', startDate: '2026-11-04', completionDate: '2026-11-06', status: 'Completed' },
  { id: 'TRP-2026-081', lorryId: 'LR-001', startLocation: 'Bengaluru', destination: 'Mumbai', startDate: '2026-10-14', completionDate: '2026-10-17', status: 'Completed' },
  { id: 'TRP-2026-064', lorryId: 'LR-001', startLocation: 'Mumbai', destination: 'Chennai', startDate: '2026-08-10', completionDate: '2026-08-14', status: 'Completed' },
  { id: 'TRP-2025-412', lorryId: 'LR-001', startLocation: 'Mumbai', destination: 'Delhi', startDate: '2025-11-12', completionDate: '2025-11-16', status: 'Completed' },
  { id: 'TRP-2025-318', lorryId: 'LR-001', startLocation: 'Pune', destination: 'Bengaluru', startDate: '2025-07-08', completionDate: '2025-07-11', status: 'Completed' },

  // LR-002 (NL 01 AA 6512)
  { id: 'TRP-2026-204', lorryId: 'LR-002', startLocation: 'Surat', destination: 'Mumbai', startDate: '2026-11-24', completionDate: '2026-11-26', status: 'Completed' },
  { id: 'TRP-2026-197', lorryId: 'LR-002', startLocation: 'Ahmedabad', destination: 'Pune', startDate: '2026-11-11', completionDate: '2026-11-14', status: 'Completed' },
  { id: 'TRP-2026-175', lorryId: 'LR-002', startLocation: 'Surat', destination: 'Indore', startDate: '2026-10-05', completionDate: '2026-10-08', status: 'Completed' },
  { id: 'TRP-2025-510', lorryId: 'LR-002', startLocation: 'Vapi', destination: 'Nagpur', startDate: '2025-09-18', completionDate: '2025-09-21', status: 'Completed' },

  // LR-003 (KA 04 D 7712)
  { id: 'TRP-2026-305', lorryId: 'LR-003', startLocation: 'Bengaluru', destination: 'Chennai', startDate: '2026-11-23', completionDate: '2026-11-25', status: 'Completed' },
  { id: 'TRP-2026-288', lorryId: 'LR-003', startLocation: 'Chennai', destination: 'Coimbatore', startDate: '2026-11-08', completionDate: '2026-11-10', status: 'Completed' },
  { id: 'TRP-2025-602', lorryId: 'LR-003', startLocation: 'Bengaluru', destination: 'Hyderabad', startDate: '2025-10-10', completionDate: '2025-10-12', status: 'Completed' },

  // LR-004 (TS 09 AB 1234)
  { id: 'TRP-2026-402', lorryId: 'LR-004', startLocation: 'Hyderabad', destination: 'Vijayawada', startDate: '2026-11-24', completionDate: '2026-11-25', status: 'Completed' },
  { id: 'TRP-2026-391', lorryId: 'LR-004', startLocation: 'Vijayawada', destination: 'Visakhapatnam', startDate: '2026-11-12', completionDate: '2026-11-14', status: 'Completed' },

  // LR-005 (AP 39 CD 9087)
  { id: 'TRP-2026-501', lorryId: 'LR-005', startLocation: 'Vijayawada', destination: 'Chennai Port', startDate: '2026-11-23', completionDate: '2026-11-26', status: 'In Transit' },
  { id: 'TRP-2026-489', lorryId: 'LR-005', startLocation: 'Nellore', destination: 'Bengaluru', startDate: '2026-11-05', completionDate: '2026-11-07', status: 'Completed' },

  // LR-006 (TN 22 EF 3344)
  { id: 'TRP-2026-601', lorryId: 'LR-006', startLocation: 'Chennai', destination: 'Coimbatore', startDate: '2026-11-24', completionDate: '2026-11-26', status: 'Completed' },
  { id: 'TRP-2026-588', lorryId: 'LR-006', startLocation: 'Coimbatore', destination: 'Madurai', startDate: '2026-11-10', completionDate: '2026-11-11', status: 'Completed' },
];

export const TripService = {
  getByLorryId(lorryId: string): FleetTripRecord[] {
    return DEMO_TRIPS.filter((t) => t.lorryId === lorryId).sort((a, b) =>
      b.startDate.localeCompare(a.startDate)
    );
  },
  getById(tripId: string): FleetTripRecord | undefined {
    return DEMO_TRIPS.find((t) => t.id === tripId);
  },
};

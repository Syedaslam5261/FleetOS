# FleetOS — Modern Logistics & Fleet Management Platform

FleetOS is an enterprise-grade logistics and fleet-management platform built for independent truck owners, fleet operators, and transport companies.

---

## Implemented Modules

### 1. Lorry Management Section (`/fleet`)

#### Main Features Delivered:
1. **Lorry Management Dashboard**:
   - Page Header: Title `Lorry Management`, Subtitle `Manage and monitor all registered vehicles.`, and primary `+ Add Lorry` button.
   - **Summary Cards**:
     - **Total Lorries**
     - **Active Lorries**
     - **Available Lorries**
     - **On Trip**
     - **Under Maintenance**
   - **Search & Filters**:
     - Search by registration plate, owner, driver, or vehicle model.
     - Filter by Vehicle Type (`32 FT SXL`, `32 FT MXL`, `20 FT`, `14 FT`, `10 FT`, `Trailer`, `Other`).
     - Filter by Operational Status (`Available`, `Active`, `On Trip`, `Maintenance`, `Inactive`).
     - Reset Filters button.
   - **Lorry Table**:
     - Registration Number (with document count indicator)
     - Vehicle Type & Body Type
     - Brand / Model & Manufacturing Year
     - Owner Name & Verified Mobile (+91)
     - Driver Assigned (or Unassigned indicator)
     - Load Capacity (Tonnes) & Tyres
     - Current Status with semantic badges
     - Actions: **View Details**, **Edit**, **Delete**
     - Empty State when no lorries match search.

2. **Add Lorry Popup Modal (Main Feature)**:
   - Centered, scrollable, professional modal on a clean white background with navy headers and blue primary buttons.
   - **Section A — Vehicle Information**:
     - Registration Number (required & unique check against existing fleet)
     - Vehicle Type (dropdown)
     - Manufacturer & Model
     - Manufacturing Year & Vehicle Colour
     - Load Capacity (tonnes) & Number of Tyres
     - Body Type (Closed Container, Open Body, Flatbed, Tipper, Tanker, etc.)
   - **Section B — Owner Information**:
     - Owner Full Name (required)
     - Owner Mobile Number (required, 10-digit Indian format)
     - Fleet / Company Name
     - Email Address & Registered Address
   - **Section C — Driver Information**:
     - Driver Full Name (optional)
     - Driver Mobile Number
     - Driving Licence Number & DL Expiry Date
   - **Section D — Documents (Compliance)**:
     - Temporary local file selection simulator for:
       - Registration Certificate (RC)
       - Insurance Certificate
       - Fitness Certificate
       - Pollution Under Control (PUC)
       - National / State Permit
     - File name preview, size indicator, replace and remove actions.
   - **Section E — Operational Information**:
     - Current Baseline Odometer Reading (km)
     - Vehicle Status (Available, Active, On Trip, Maintenance, Inactive)
     - Registration Expiry Date & Insurance Expiry Date
     - Additional Remarks / Notes
   - **Modal Safeguards & Validation**:
     - Client-side validation for required fields, duplicate registration check, and number formats.
     - **Unsaved Changes Prompt**: Asks for user confirmation before discarding any unsaved edits.
     - Responsive grid layout for mobile, tablet, and desktop.

3. **Lorry Details View (`LorryDetailModal`)**:
   - Vehicle Overview with chassis and technical specs
   - Owner Profile & Contact Details
   - Assigned Driver & DL credentials
   - Compliance Documents status checklist
   - Space for future tabs: Trips, Diesel, Maintenance, Expenses.

4. **Edit & Delete Workflows**:
   - **Edit**: Pre-populates the 5-section modal and saves changes directly to the fleet state.
   - **Delete**: Confirmation modal to prevent accidental deletion, immediately updating all table rows, summary cards, and navigation badge counts.

---

### 2. Diesel Management Dashboard (`/diesel`)
- Summary Metrics (Total Diesel Consumed, Total Cost in ₹, Average Mileage km/L, Cost per km).
- Recharts Diesel Consumption Trends (Daily, Weekly, Monthly).
- Truck-wise Diesel Usage & Target Rankings.
- Audited Fuel Entries Table (Full-Tank Verified vs. Estimate Partial).
- Operational Modals (Add Fuel Entry, Set Mileage Target, Fuel Stations, Alerts).

---

## Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router v7, Lucide Icons, Recharts.
- **State & Service Layer**: `LorryService` (`src/services/lorryService.ts`) providing observable in-memory state ready to connect to FastAPI `/api/v1/lorries`.
- **Indian Logistics Design Standards**: Indian truck registration plates (`MH 12 RN 4821`, `NL 01 AA 6512`, `KA 04 D 7712`, etc.), Litres, Kilometres, Tonnes, and INR (`₹`).

---

## How to Run Locally

### 1. Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Production Build & Preview
```bash
npm run build
npm run preview
```

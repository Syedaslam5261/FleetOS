import { OcrExtractedReceipt } from '../types/fuelReceipt';

const STATION_BRANDS = [
  /indian\s*oil|iocl/i,
  /hindustan\s*petroleum|hpcl|\bhp\s+auto\b|\bhp\s+fuel\b/i,
  /bharat\s*petroleum|bpcl/i,
  /reliance|jio[\s-]*bp/i,
  /nayara/i,
  /shell/i,
  /essar/i,
  /fuel\s*station|petrol\s*pump|petroleum|service\s*station|fuels/i,
];

const MONTHS_MAP: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
};

function normalizeDateToIso(raw: string): string {
  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = raw.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YY
  const dmyMatch = raw.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2}|\d{2})\b/);
  if (dmyMatch) {
    const year = dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3];
    return `${year}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  }
  // DD MMM YYYY (e.g. 25 Nov 2026)
  const textMatch = raw.match(/\b(0?[1-9]|[12]\d|3[01])\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,-]+(20\d{2})\b/i);
  if (textMatch) {
    const mm = MONTHS_MAP[textMatch[2].toLowerCase().slice(0, 3)];
    return `${textMatch[3]}-${mm}-${textMatch[1].padStart(2, '0')}`;
  }
  return '';
}

function extractTime(raw: string): string {
  const m = raw.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\s*(am|pm)?\b/i);
  if (!m) return '';
  let hr = parseInt(m[1], 10);
  const min = m[2];
  const meridiem = m[3]?.toLowerCase();
  if (meridiem === 'pm' && hr < 12) hr += 12;
  if (meridiem === 'am' && hr === 12) hr = 0;
  return `${String(hr).padStart(2, '0')}:${min}`;
}

function cleanNum(raw?: string): string {
  if (!raw) return '';
  const cleaned = raw.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num > 0 ? String(num) : '';
}

/**
 * Pure OCR text parser for Indian diesel fuel receipts.
 * Extracts only fields genuinely present in `rawText` — never fabricates values.
 */
export function parseReceiptText(rawText: string, confidence: number): OcrExtractedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Fuel station name
  let fuelStation = '';
  const brandLine = lines.find((l) => STATION_BRANDS.some((rx) => rx.test(l)));
  if (brandLine) {
    fuelStation = brandLine.replace(/^[^a-zA-Z0-9]+/, '').slice(0, 80);
  } else if (lines.length > 0 && /[a-zA-Z]{3,}/.test(lines[0])) {
    fuelStation = lines[0].slice(0, 80);
  }

  // 2. Receipt / Invoice / Bill / Txn number
  let receiptNumber = '';
  const rcptMatch = rawText.match(
    /(?:receipt|invoice|bill|inv|voucher|txn|slip)\s*(?:no\.?|num|#|:|-)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9/-]{3,24})/i
  );
  if (rcptMatch) {
    receiptNumber = rcptMatch[1].trim().toUpperCase();
  }

  // 3. Date & Time
  const receiptDate = normalizeDateToIso(rawText);
  const receiptTime = extractTime(rawText);

  // 4. Lorry registration number (Indian plate format e.g. MH 12 RN 4821)
  let lorryRegistration = '';
  const regMatch = rawText.match(/\b([A-Z]{2})\s*[-]?\s*(\d{2})\s*[-]?\s*([A-Z]{1,2})\s*[-]?\s*(\d{4})\b/i);
  if (regMatch) {
    lorryRegistration = `${regMatch[1]} ${regMatch[2]} ${regMatch[3]} ${regMatch[4]}`.toUpperCase();
  }

  // 5. Diesel quantity in litres
  let dieselLitres = '';
  const qtyMatch =
    rawText.match(/(?:qty|quantity|volume|vol|diesel)\s*[:=-]?\s*(\d+(?:\.\d{1,3})?)\s*(?:l|ltr|ltrs|litres?|liters?)?\b/i) ||
    rawText.match(/\b(\d+(?:\.\d{1,3})?)\s*(?:ltrs?|litres?|liters?)\b/i);
  if (qtyMatch) {
    dieselLitres = cleanNum(qtyMatch[1]);
  }

  // 6. Diesel price per litre
  let pricePerLitre = '';
  const rateMatch =
    rawText.match(/(?:rate|price|unit\s*price|rs\s*\/\s*l)\s*[:=@-]?\s*(?:rs\.?|₹|inr)?\s*(\d{2,3}(?:\.\d{1,2})?)\b/i) ||
    rawText.match(/(?:rs\.?|₹)\s*(\d{2,3}\.\d{1,2})\s*\/\s*l/i);
  if (rateMatch) {
    pricePerLitre = cleanNum(rateMatch[1]);
  }

  // 7. Total amount
  let totalAmount = '';
  const totalMatch = rawText.match(
    /(?:total|net\s*amt|net\s*amount|grand\s*total|amount|sale|amt)\s*[:=-]?\s*(?:rs\.?|₹|inr)?\s*(\d[\d,]*(?:\.\d{1,2})?)/i
  );
  if (totalMatch) {
    totalAmount = cleanNum(totalMatch[1]);
  }

  // 8. GST details (15-character Indian GSTIN)
  let gstDetails = '';
  const gstinMatch = rawText.match(/\b(\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z])\b/i);
  if (gstinMatch) {
    gstDetails = `GSTIN: ${gstinMatch[1].toUpperCase()}`;
  } else {
    const gstLine = lines.find((l) => /\bgst\b|\bcgst\b|\bsgst\b/i.test(l));
    if (gstLine) gstDetails = gstLine.slice(0, 80);
  }

  // 9. Payment method hint (STRICTLY informational — never auto-marks PAID)
  let detectedPaymentHint = '';
  if (/\bupi\b|\bgpay\b|\bphonepe\b|\bpaytm\b/i.test(rawText)) detectedPaymentHint = 'UPI';
  else if (/\bfleet\s*card\b|\bcredit\s*card\b|\bdebit\s*card\b|\bvisa\b|\bmastercard\b|\bcard\b/i.test(rawText))
    detectedPaymentHint = 'Card';
  else if (/\bneft\b|\bimps\b|\brtgs\b|\bbank\s*transfer\b/i.test(rawText)) detectedPaymentHint = 'Bank Transfer';
  else if (/\bcash\b/i.test(rawText)) detectedPaymentHint = 'Cash';

  const missingFields: string[] = [];
  if (!fuelStation) missingFields.push('Fuel station name');
  if (!receiptNumber) missingFields.push('Receipt / invoice number');
  if (!receiptDate) missingFields.push('Receipt date');
  if (!dieselLitres) missingFields.push('Diesel quantity (L)');
  if (!pricePerLitre) missingFields.push('Price per litre (₹/L)');
  if (!totalAmount) missingFields.push('Total amount (₹)');

  return {
    fuelStation,
    receiptNumber,
    receiptDate,
    receiptTime,
    lorryRegistration,
    dieselLitres,
    pricePerLitre,
    totalAmount,
    gstDetails,
    detectedPaymentHint,
    rawText: rawText.trim(),
    confidence: Math.round(confidence),
    missingFields,
  };
}

/**
 * Real client-side OCR using tesseract.js (WebAssembly Tesseract engine).
 * Throws if OCR fails so callers never fabricate extracted values.
 */
export async function runReceiptOcr(
  imageSource: string | File,
  onProgress?: (percent: number, status: string) => void
): Promise<OcrExtractedReceipt> {
  const Tesseract = await import('tesseract.js');
  const result = await Tesseract.recognize(imageSource, 'eng', {
    logger: (msg) => {
      if (onProgress && typeof msg.progress === 'number') {
        onProgress(Math.round(msg.progress * 100), msg.status || 'Processing');
      }
    },
  });

  const text = result.data?.text ?? '';
  const confidence = result.data?.confidence ?? 0;

  if (!text.trim()) {
    throw new Error('OCR could not read any text from this image. Please try a clearer photo or enter fields manually.');
  }

  return parseReceiptText(text, confidence);
}

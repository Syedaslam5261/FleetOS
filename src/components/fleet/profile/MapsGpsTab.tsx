import React from 'react';
import { ExternalLink, MapPin, Navigation, Radio } from 'lucide-react';
import { LorryRecordsService } from '../../../services/lorryRecordsService';
import { formatDate } from '../../../utils/formatters';
import { DemoNote, ProfileEmptyState } from './ProfileParts';

export const MapsGpsTab: React.FC<{ lorryId: string }> = ({ lorryId }) => {
  const report = LorryRecordsService.getLocationReport(lorryId);

  if (!report) {
    return (
      <ProfileEmptyState
        title="No location reported"
        message="No location has been reported for this lorry yet, and live GPS tracking is not connected."
      />
    );
  }

  const osmUrl = `https://www.openstreetmap.org/?mlat=${report.lat}&mlon=${report.lng}#map=12/${report.lat}/${report.lng}`;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <Radio className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
        <p>
          <strong>Live tracking unavailable.</strong> Showing the last reported location from a manual or driver
          update. No GPS device is connected to this lorry.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <MapPin className="h-4 w-4 text-blue-600" /> Last Reported Location
          </h4>
          <p className="text-sm font-bold text-slate-900">{report.place}</p>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Reported at</dt>
              <dd className="font-medium text-slate-800">{formatDate(report.reportedAt)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Source</dt>
              <dd className="font-medium text-slate-800">{report.source}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Coordinates</dt>
              <dd className="font-mono text-slate-800">
                {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
              </dd>
            </div>
          </dl>
          <a
            href={osmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            View on OpenStreetMap <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Navigation className="h-4 w-4 text-blue-600" /> Route Information
          </h4>
          {report.route ? (
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Route</dt>
                <dd className="font-semibold text-slate-900">
                  {report.route.from} → {report.route.to}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Trip reference</dt>
                <dd className="font-mono text-slate-800">{report.route.tripRef}</dd>
              </div>
              {report.route.eta && (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Planned ETA</dt>
                  <dd className="font-medium text-slate-800">{formatDate(report.route.eta)}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="py-6 text-center text-xs text-slate-400">No active route for this lorry.</p>
          )}
        </div>
      </div>
      <DemoNote />
    </div>
  );
};

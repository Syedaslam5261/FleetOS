import React from 'react';
import { CreditCard, Phone, User } from 'lucide-react';
import { Badge } from '../../common/Badge';
import { Lorry } from '../../../types/lorry';
import { formatDateOnly } from '../../../utils/formatters';
import { ProfileEmptyState } from './ProfileParts';

export const DriverTab: React.FC<{ lorry: Lorry }> = ({ lorry }) => {
  if (!lorry.driverName) {
    return (
      <ProfileEmptyState
        title="No driver assigned"
        message="This lorry has no assigned driver. Use Edit on the Lorry Management list to assign one."
      />
    );
  }

  let licenceBadge: React.ReactNode = null;
  if (lorry.licenceExpiryDate) {
    const days = Math.ceil((new Date(lorry.licenceExpiryDate).getTime() - Date.now()) / 86_400_000);
    licenceBadge =
      days < 0 ? (
        <Badge variant="critical" size="sm" dot>Expired</Badge>
      ) : days <= 90 ? (
        <Badge variant="warning" size="sm" dot>Expires in {days} days</Badge>
      ) : (
        <Badge variant="success" size="sm" dot>Valid</Badge>
      );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <User className="h-4 w-4 text-blue-600" /> Assigned Driver
        </h4>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {lorry.driverName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{lorry.driverName}</p>
            <p className="text-xs text-slate-500">Driver · {lorry.registrationNumber}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-700">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-mono">{lorry.driverMobile ? `+91 ${lorry.driverMobile}` : 'Not provided'}</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <CreditCard className="h-4 w-4 text-emerald-600" /> Driving Licence
        </h4>
        <dl className="space-y-3 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Licence number</dt>
            <dd className="font-mono font-semibold text-slate-900">{lorry.driverLicenceNumber ?? 'Not provided'}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Expiry date</dt>
            <dd className="flex items-center gap-2 font-medium text-slate-900">
              {lorry.licenceExpiryDate ? formatDateOnly(lorry.licenceExpiryDate) : 'Not provided'}
              {licenceBadge}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

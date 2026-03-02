import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import type { MEP } from '../types';
import { getGroupColor, getCountryFlag } from '../utils/helpers';

interface MEPCardProps {
  mep: MEP;
  compact?: boolean;
}

export default function MEPCard({ mep, compact }: MEPCardProps) {
  if (compact) {
    return (
      <Link
        to={`/meps/${mep.id}`}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
          <User size={16} className="text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{mep.fullName}</p>
          <p className="text-xs text-slate-500">
            {getCountryFlag(mep.countryCode)} {mep.politicalGroupShort}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/meps/${mep.id}`}
      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:border-primary-300 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border-2 border-slate-200 group-hover:border-primary-300 transition-colors">
          <User size={28} className="text-slate-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
            {mep.fullName}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {getCountryFlag(mep.countryCode)} {mep.country || mep.countryCode}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: getGroupColor(mep.politicalGroupShort) }}
            >
              {mep.politicalGroupShort}
            </span>
            {mep.nationalParty && (
              <span className="text-xs text-slate-400">{mep.nationalParty}</span>
            )}
          </div>
          {mep.committees && mep.committees.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {mep.committees.slice(0, 3).map((c) => (
                <span
                  key={c.shortName}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600"
                >
                  {c.shortName}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Building2, ExternalLink } from 'lucide-react';
import { useMEPById } from '../hooks/useParliamentData';
import LoadingSpinner from '../components/LoadingSpinner';
import GroupBadge from '../components/GroupBadge';
import { getCountryFlag } from '../utils/helpers';

export default function MEPProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: mep, isLoading, error } = useMEPById(id || '');

  if (isLoading) return <LoadingSpinner message="Loading MEP profile..." />;

  if (error || !mep) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">MEP not found</p>
        <Link to="/meps" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
          Back to MEP Tracker
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/meps"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} />
        Back to MEP Tracker
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border-2 border-slate-200">
            <User size={48} className="text-slate-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{mep.fullName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <GroupBadge group={mep.politicalGroupShort} size="md" />
              {mep.nationalParty && (
                <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {mep.nationalParty}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin size={16} />
                {getCountryFlag(mep.countryCode)} {mep.country || mep.countryCode}
              </span>
              {mep.gender && (
                <span className="capitalize">{mep.gender}</span>
              )}
            </div>
            <div className="mt-4">
              <a
                href={`https://www.europarl.europa.eu/meps/en/${mep.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline"
              >
                <ExternalLink size={14} />
                View on europarl.europa.eu
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Committees */}
      {mep.committees && mep.committees.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-emerald-600" />
            Committee Memberships
          </h2>
          <div className="space-y-3">
            {mep.committees.map((c) => (
              <Link
                key={c.shortName}
                to={`/committees?selected=${c.shortName}`}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <span className="font-medium text-slate-900">{c.shortName}</span>
                  <span className="text-slate-500 ml-2 text-sm">{c.name}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    c.role === 'Chair'
                      ? 'bg-amber-100 text-amber-700'
                      : c.role === 'Vice-Chair'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {c.role}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Political Group Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Political Group</h2>
        <div className="flex items-center gap-4">
          <GroupBadge group={mep.politicalGroupShort} size="lg" />
          <div>
            <p className="font-medium text-slate-900">{mep.politicalGroup}</p>
            <Link
              to={`/meps?group=${mep.politicalGroupShort}`}
              className="text-sm text-primary-600 hover:underline"
            >
              View all {mep.politicalGroupShort} members
            </Link>
          </div>
        </div>
      </div>

      {/* Country colleagues */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          {getCountryFlag(mep.countryCode)} Colleagues from {mep.country || mep.countryCode}
        </h2>
        <Link
          to={`/meps?country=${mep.countryCode}`}
          className="text-sm text-primary-600 hover:underline"
        >
          View all MEPs from {mep.country || mep.countryCode}
        </Link>
      </div>
    </div>
  );
}

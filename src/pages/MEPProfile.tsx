import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Building2, ExternalLink } from 'lucide-react';
import { useMEPById } from '../hooks/useParliamentData';
import LoadingSpinner, { SkeletonChart } from '../components/LoadingSpinner';
import GroupBadge from '../components/GroupBadge';
import { getCountryFlag } from '../utils/helpers';
import { useLanguage } from '../hooks/useLanguage';

export default function MEPProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: mep, isLoading, error } = useMEPById(id || '');
  const { t } = useLanguage();

  if (isLoading) return <LoadingSpinner message={t('common.loading')} />;

  if (error || !mep) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">MEP not found</p>
        <Link to="/meps" className="text-primary-600 dark:text-primary-400 hover:underline text-sm mt-2 inline-block">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/meps" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
        <ArrowLeft size={16} />{t('common.back')}
      </Link>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0 border-2 border-slate-200 dark:border-slate-600">
            <User size={48} className="text-slate-400 dark:text-slate-500" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">{mep.fullName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <GroupBadge group={mep.politicalGroupShort} size="md" />
              {mep.nationalParty && (
                <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">{mep.nationalParty}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5"><MapPin size={16} />{getCountryFlag(mep.countryCode)} {mep.country || mep.countryCode}</span>
              {mep.gender && <span className="capitalize">{mep.gender}</span>}
            </div>
            <div className="mt-4">
              <a href={`https://www.europarl.europa.eu/meps/en/${mep.id}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                <ExternalLink size={14} />View on europarl.europa.eu
              </a>
            </div>
          </div>
        </div>
      </div>

      {mep.committees && mep.committees.length > 0 && (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-emerald-600" />Committee Memberships
          </h2>
          <div className="space-y-3">
            {mep.committees.map((c) => (
              <Link key={c.shortName} to={`/committees?selected=${c.shortName}`}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{c.shortName}</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-2 text-sm">{c.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.role === 'Chair' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : c.role === 'Vice-Chair' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                  {c.role}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Political Group</h2>
        <div className="flex items-center gap-4">
          <GroupBadge group={mep.politicalGroupShort} size="lg" />
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{mep.politicalGroup}</p>
            <Link to={`/meps?group=${mep.politicalGroupShort}`} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              View all {mep.politicalGroupShort} members
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {getCountryFlag(mep.countryCode)} Colleagues from {mep.country || mep.countryCode}
        </h2>
        <Link to={`/meps?country=${mep.countryCode}`} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
          View all MEPs from {mep.country || mep.countryCode}
        </Link>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Users, Vote, Building2, Globe, TrendingUp } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useGroupStats, useCountryStats, useVotes } from '../hooks/useParliamentData';
import StatCard from '../components/StatCard';
import { SkeletonStatCards, SkeletonChart } from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Hemicycle from '../components/Hemicycle';
import { getGroupColor } from '../utils/helpers';
import { COUNTRY_FLAGS } from '../types';
import { useLanguage } from '../hooks/useLanguage';

export default function Dashboard() {
  const { data: groupStats, isLoading: groupsLoading, error: groupsError, refetch: refetchGroups } = useGroupStats();
  const { data: countryStats, isLoading: countriesLoading, error: countriesError, refetch: refetchCountries } = useCountryStats();
  const { data: votes, isLoading: votesLoading } = useVotes();
  const { t } = useLanguage();

  const hasError = groupsError || countriesError;

  if (hasError && !groupStats && !countryStats) {
    return (
      <ErrorMessage
        message={t('common.error')}
        detail="Could not load data from the European Parliament API. Please try again."
        onRetry={() => { refetchGroups(); refetchCountries(); }}
      />
    );
  }

  const totalMEPs = groupStats?.reduce((sum, g) => sum + g.mepCount, 0) || 0;
  const totalGroups = groupStats?.length || 0;
  const totalVotes = votes?.length || 0;

  const pieData = groupStats?.map((g) => ({
    name: g.short,
    value: g.mepCount,
    color: getGroupColor(g.short),
  })) || [];

  const topCountries = countryStats?.slice(0, 10).map((c) => ({
    name: `${COUNTRY_FLAGS[c.countryCode] || ''} ${c.countryCode}`,
    seats: c.totalSeats,
    meps: c.mepCount,
  })) || [];

  const recentVotes = votes?.slice(-5).reverse() || [];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-eu-blue to-blue-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="mt-2 text-blue-200 max-w-2xl">{t('dashboard.subtitle')}</p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link to="/meps" className="px-4 py-2 bg-white text-eu-blue rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors">
            {t('dashboard.browseMeps')}
          </Link>
          <Link to="/votes" className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium text-sm hover:bg-white/20 transition-colors border border-white/20">
            {t('dashboard.exploreVotes')}
          </Link>
          <Link to="/country" className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium text-sm hover:bg-white/20 transition-colors border border-white/20">
            {t('dashboard.countryMonitor')}
          </Link>
          <Link to="/sejm" className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium text-sm hover:bg-white/20 transition-colors border border-white/20">
            {t('dashboard.sejmComparator') || 'Sejm Comparator'}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      {groupsLoading || countriesLoading ? (
        <SkeletonStatCards count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label={t('dashboard.totalMeps')} value={totalMEPs} icon={Users} color="bg-primary-600" />
          <StatCard label={t('dashboard.politicalGroups')} value={totalGroups} icon={TrendingUp} color="bg-emerald-500" />
          <StatCard label={t('dashboard.memberStates')} value={countryStats?.length || 27} icon={Globe} color="bg-amber-500" />
          <StatCard label={t('dashboard.trackedVotes')} value={totalVotes} icon={Vote} color="bg-violet-500" />
        </div>
      )}

      {/* Hemicycle */}
      {groupsLoading ? (
        <SkeletonChart height="h-80" />
      ) : groupStats && groupStats.length > 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('dashboard.hemicycle')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('dashboard.hemicycleDesc')}</p>
          <Hemicycle groups={groupStats} />
        </div>
      ) : null}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Political Groups Pie */}
        {groupsLoading ? (
          <SkeletonChart />
        ) : pieData.length > 0 ? (
          <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('dashboard.groups')}</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value"
                    label={({ name, value }) => `${name} (${value})`} labelLine={true}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {groupStats?.map((g) => (
                <Link key={g.short} to={`/meps?group=${g.short}`}
                  className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full hover:opacity-80 transition-opacity text-white"
                  style={{ backgroundColor: getGroupColor(g.short) }}>
                  {g.short}: {g.mepCount}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {/* Country Seats Bar Chart */}
        {countriesLoading ? (
          <SkeletonChart />
        ) : topCountries.length > 0 ? (
          <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('dashboard.seatsByCountry')}</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCountries} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Bar dataKey="seats" fill="#003399" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}
      </div>

      {/* Recent Votes / Documents */}
      {votesLoading ? (
        <SkeletonChart height="h-48" />
      ) : recentVotes.length > 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.recentVotes')}</h2>
            <Link to="/votes" className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
              {t('dashboard.viewAllVotes')}
            </Link>
          </div>
          <div className="space-y-3">
            {recentVotes.map((vote) => {
              const total = vote.totalFor + vote.totalAgainst + vote.totalAbstention;
              const forPct = total ? (vote.totalFor / total) * 100 : 0;
              const againstPct = total ? (vote.totalAgainst / total) * 100 : 0;
              const hasVoteData = total > 0;
              return (
                <div key={vote.id} className="border border-slate-100 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">{vote.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {vote.date} {vote.documentRef && `| ${vote.documentRef}`}
                      </p>
                    </div>
                    {hasVoteData ? (
                      <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${vote.totalFor > vote.totalAgainst ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                        {vote.totalFor > vote.totalAgainst ? t('dashboard.passed') : t('dashboard.rejected')}
                      </span>
                    ) : (
                      <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                        Document
                      </span>
                    )}
                  </div>
                  {hasVoteData && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: `${forPct}%` }} />
                        <div className="bg-red-500 h-full" style={{ width: `${againstPct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                        {vote.totalFor} / {vote.totalAgainst} / {vote.totalAbstention}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/meps" className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6 hover:shadow-md transition-shadow group">
          <Users className="text-primary-600 mb-3" size={28} />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">{t('dashboard.mepTracker')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.mepTrackerDesc').replace('{count}', String(totalMEPs))}</p>
        </Link>
        <Link to="/committees" className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6 hover:shadow-md transition-shadow group">
          <Building2 className="text-emerald-600 mb-3" size={28} />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600">{t('nav.committees')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.committeesDesc')}</p>
        </Link>
        <Link to="/country" className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6 hover:shadow-md transition-shadow group">
          <Globe className="text-amber-500 mb-3" size={28} />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-amber-500">{t('nav.countryMonitor')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.countryMonitorDesc')}</p>
        </Link>
        <Link to="/sejm" className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6 hover:shadow-md transition-shadow group">
          <Building2 className="text-red-600 mb-3" size={28} />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-red-600">{t('nav.sejmComparator') || 'Sejm vs EP'}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.sejmDesc') || 'Compare Polish Sejm with European Parliament'}</p>
        </Link>
      </div>
    </div>
  );
}

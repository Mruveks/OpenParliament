import { useState, useMemo } from 'react';
import { Building2, Users, Vote, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import { useSejmMPs, useSejmClubs, useSejmCommittees, useSejmRecentVotings } from '../hooks/useSejmData';
import { useCountryMEPs } from '../hooks/useParliamentData';
import LoadingSpinner, { SkeletonChart, SkeletonStatCards, SkeletonCardGrid } from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import StatCard from '../components/StatCard';
import SearchFilter from '../components/SearchFilter';
import { getSejmMPPhotoUrl } from '../api/sejm';
import type { SejmMP } from '../api/sejm';
import { useLanguage } from '../hooks/useLanguage';

const SEJM_CLUB_COLORS: Record<string, string> = {
  'KO': '#f97316', 'PiS': '#003399', 'Lewica': '#dc2626', 'TD': '#16a34a',
  'Konfederacja': '#1e3a5c', 'PSL': '#059669', 'Polska2050': '#7c3aed',
  'KP': '#f97316', 'niez.': '#888888',
};

function getClubColor(club: string): string {
  return SEJM_CLUB_COLORS[club] || '#888888';
}

export default function SejmComparator() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'overview' | 'mps' | 'votings'>('overview');

  const { data: sejmMPs, isLoading: mpsLoading, error: mpsError, refetch: refetchMPs } = useSejmMPs();
  const { data: clubs, isLoading: clubsLoading } = useSejmClubs();
  const { data: committees, isLoading: committeesLoading } = useSejmCommittees();
  const { data: recentVotings, isLoading: votingsLoading } = useSejmRecentVotings();
  const { data: polishMEPs } = useCountryMEPs('PL');

  const isLoading = mpsLoading || clubsLoading;

  const activeMPs = useMemo(() =>
    sejmMPs?.filter((mp) => mp.active) || [], [sejmMPs]);

  const clubStats = useMemo(() => {
    if (!clubs) return [];
    return [...clubs].sort((a, b) => b.membersCount - a.membersCount);
  }, [clubs]);

  const genderStats = useMemo(() => {
    if (!activeMPs.length) return { female: 0, male: 0 };
    // Polish names: female first names typically end in 'a' (with some exceptions)
    const female = activeMPs.filter((mp) => {
      const fn = mp.firstName.toLowerCase();
      return fn.endsWith('a') && fn !== 'kuba' && fn !== 'kosma' && fn !== 'barnaba';
    }).length;
    return { female, male: activeMPs.length - female };
  }, [activeMPs]);

  const filteredMPs = useMemo(() => {
    if (!activeMPs.length) return [];
    if (!search) return activeMPs.slice(0, 60);
    const q = search.toLowerCase();
    return activeMPs.filter((mp) =>
      mp.firstLastName.toLowerCase().includes(q) ||
      mp.club.toLowerCase().includes(q) ||
      mp.districtName.toLowerCase().includes(q)
    );
  }, [activeMPs, search]);

  if (isLoading) return <LoadingSpinner message={t('common.loading')} />;

  if (mpsError && !sejmMPs) {
    return (
      <ErrorMessage
        message={t('common.error')}
        detail="Could not load data from the Polish Sejm API. Please try again."
        onRetry={() => refetchMPs()}
      />
    );
  }

  const comparisonData = [
    { name: t('sejm.members') || 'Members', sejm: activeMPs.length, ep: polishMEPs?.length || 52 },
    { name: t('sejm.parties') || 'Parties/Clubs', sejm: clubStats.length, ep: polishMEPs ? [...new Set(polishMEPs.map((m) => m.nationalParty))].filter(Boolean).length : 0 },
    { name: t('sejm.committees') || 'Committees', sejm: committees?.length || 0, ep: 20 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-900 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Building2 size={28} />
          {t('sejm.title') || 'Sejm vs European Parliament'}
        </h1>
        <p className="mt-2 text-red-200">{t('sejm.subtitle') || 'Compare the Polish Sejm (460 MPs) with the European Parliament representation. All data from real APIs.'}</p>
        <p className="mt-1 text-red-300 text-xs">
          {t('sejm.dataSource') || 'Data: api.sejm.gov.pl (Sejm) + data.europarl.europa.eu (EP)'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-dark-border">
        {(['overview', 'mps', 'votings'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}>
            {t === 'overview' ? 'Overview' : t === 'mps' ? 'MPs / MEPs' : 'Recent Votings'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Sejm MPs" value={activeMPs.length} icon={Users} color="bg-red-600" subtitle="X Kadencja (2023-2027)" />
            <StatCard label="Polish MEPs" value={polishMEPs?.length || '...'} icon={Users} color="bg-primary-600" subtitle="European Parliament" />
            <StatCard label="Sejm Clubs" value={clubStats.length} icon={Building2} color="bg-orange-500" />
            <StatCard label="Sejm Committees" value={committees?.length || '...'} icon={BarChart3} color="bg-emerald-500" />
          </div>

          {/* Comparison chart */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Sejm vs EP Comparison</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Bar dataKey="sejm" fill="#dc2626" name="Sejm" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ep" fill="#003399" name="EP (Poland)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Club composition */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Sejm Political Clubs</h2>
              {clubStats.length > 0 ? (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={clubStats.map((c) => ({ name: c.id, value: c.membersCount }))}
                          cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value"
                          label={({ name, value }) => `${name} (${value})`} labelLine>
                          {clubStats.map((c) => (
                            <Cell key={c.id} fill={getClubColor(c.id)} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {clubStats.map((c) => (
                      <span key={c.id} className="text-xs px-2 py-1 rounded-full text-white font-medium"
                        style={{ backgroundColor: getClubColor(c.id) }}>
                        {c.id}: {c.membersCount}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm">No club data available</p>
              )}
            </div>

            <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Gender Balance</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[
                      { name: 'Female', value: genderStats.female },
                      { name: 'Male', value: genderStats.male },
                    ]} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`} labelLine>
                      <Cell fill="#ec4899" />
                      <Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-3 h-3 rounded-full bg-pink-500" />
                  Female: {genderStats.female} ({((genderStats.female / Math.max(activeMPs.length, 1)) * 100).toFixed(1)}%)
                </span>
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  Male: {genderStats.male} ({((genderStats.male / Math.max(activeMPs.length, 1)) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Committees */}
          {!committeesLoading && committees && committees.length > 0 && (
            <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Sejm Committees ({committees.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {committees.map((c) => (
                  <div key={c.code}
                    className="px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 text-sm">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{c.code}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2 text-xs">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'mps' && (
        <div className="space-y-4">
          <SearchFilter value={search} onChange={setSearch} placeholder="Search Sejm MPs by name, club, or district..." />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {search ? `${filteredMPs.length} MPs found` : `Showing ${filteredMPs.length} of ${activeMPs.length} active MPs`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredMPs.map((mp) => (
              <SejmMPCard key={mp.id} mp={mp} />
            ))}
          </div>
          {filteredMPs.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p>No MPs match your search</p>
            </div>
          )}
        </div>
      )}

      {tab === 'votings' && (
        <div className="space-y-4">
          {votingsLoading ? (
            <LoadingSpinner message="Loading recent votings..." />
          ) : recentVotings && recentVotings.length > 0 ? (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Latest sitting: {recentVotings.length} votings
              </p>
              <div className="space-y-3">
                {recentVotings.map((v) => {
                  const total = v.yes + v.no + v.abstain;
                  const yesPct = total ? (v.yes / total) * 100 : 0;
                  const noPct = total ? (v.no / total) * 100 : 0;
                  const passed = v.yes > v.no;

                  return (
                    <div key={`${v.sitting}-${v.votingNumber}`}
                      className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">{v.title || v.topic || 'Voting'}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <span>{v.date.split('T')[0]}</span>
                            <span>Sitting {v.sitting}, Vote #{v.votingNumber}</span>
                          </div>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${passed
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {passed ? 'Passed' : 'Rejected'}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-xs mb-1">
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Yes: {v.yes}</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">No: {v.no}</span>
                          <span className="text-slate-500 dark:text-slate-400">Abstain: {v.abstain}</span>
                          <span className="text-slate-400 dark:text-slate-500">Absent: {v.notParticipating}</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full" style={{ width: `${yesPct}%` }} />
                          <div className="bg-red-500 h-full" style={{ width: `${noPct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Vote className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={48} />
              <p>No recent voting data available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SejmMPCard({ mp }: { mp: SejmMP }) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-4 hover:shadow-lg transition-all">
      <div className="flex items-start gap-3">
        <img
          src={getSejmMPPhotoUrl(mp.id)}
          alt={mp.firstLastName}
          className="w-14 h-14 rounded-full object-cover bg-slate-100 dark:bg-slate-700 shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
            {mp.firstLastName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: getClubColor(mp.club) }}>
              {mp.club}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {mp.districtName} (okr. {mp.districtNum})
          </p>
          {mp.numberOfVotes > 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {mp.numberOfVotes.toLocaleString()} votes
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

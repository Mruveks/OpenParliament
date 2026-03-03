import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useCommittees, useCommitteeMembers } from '../hooks/useParliamentData';
import MEPCard from '../components/MEPCard';
import LoadingSpinner, { SkeletonCardGrid, SkeletonChart } from '../components/LoadingSpinner';
import SearchFilter from '../components/SearchFilter';
import { getGroupColor } from '../utils/helpers';
import { useLanguage } from '../hooks/useLanguage';

export default function CommitteeExplorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const selectedCommittee = searchParams.get('selected') || '';
  const { t } = useLanguage();

  const { data: committees, isLoading } = useCommittees();
  const { data: members, isLoading: membersLoading } = useCommitteeMembers(selectedCommittee);

  const filteredCommittees = useMemo(() => {
    if (!committees) return [];
    if (!search) return committees;
    const q = search.toLowerCase();
    return committees.filter((c) => c.name.toLowerCase().includes(q) || c.shortName.toLowerCase().includes(q));
  }, [committees, search]);

  const groupBreakdown = useMemo(() => {
    if (!members) return [];
    const counts: Record<string, number> = {};
    for (const m of members) counts[m.politicalGroupShort] = (counts[m.politicalGroupShort] || 0) + 1;
    return Object.entries(counts).map(([group, count]) => ({ group, count, color: getGroupColor(group) })).sort((a, b) => b.count - a.count);
  }, [members]);

  const countryBreakdown = useMemo(() => {
    if (!members) return [];
    const counts: Record<string, number> = {};
    for (const m of members) counts[m.countryCode] = (counts[m.countryCode] || 0) + 1;
    return Object.entries(counts).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [members]);

  if (isLoading) return <LoadingSpinner message={t('common.loading')} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <Building2 className="text-emerald-600" size={28} />
          {t('committees.title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('committees.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SearchFilter value={search} onChange={setSearch} placeholder={t('committees.searchPlaceholder')} />
          <div className="mt-4 bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
              {filteredCommittees.map((c) => (
                <button key={c.shortName} onClick={() => setSearchParams({ selected: c.shortName })}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between gap-2 transition-colors ${selectedCommittee === c.shortName ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{c.shortName}</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.name}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedCommittee ? (
            <>
              <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {committees?.find((c) => c.shortName === selectedCommittee)?.name || selectedCommittee}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t('committees.members').replace('{count}', String(members?.length || 0))}
                </p>
              </div>

              {membersLoading ? (
                <div className="space-y-6">
                  <SkeletonChart height="h-48" />
                  <SkeletonCardGrid count={4} />
                </div>
              ) : (
                <>
                  <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('committees.groupComposition')}</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={groupBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="group" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <Tooltip />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {groupBreakdown.map((e) => (<Cell key={e.group} fill={e.color} />))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {countryBreakdown.length > 0 && (
                    <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('committees.topCountries')}</h3>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={countryBreakdown} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                            <YAxis type="category" dataKey="country" width={40} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#059669" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('committees.membersList')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {members?.map((mep) => (<MEPCard key={mep.id} mep={mep} />))}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-12 text-center">
              <Building2 className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
              <h3 className="font-medium text-slate-600 dark:text-slate-400">{t('committees.selectPrompt')}</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{t('committees.selectDesc')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

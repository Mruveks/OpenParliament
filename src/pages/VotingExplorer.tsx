import { useState, useMemo } from 'react';
import { Vote } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { useVotes } from '../hooks/useParliamentData';
import SearchFilter from '../components/SearchFilter';
import { SkeletonChart } from '../components/LoadingSpinner';
import { getGroupColor } from '../utils/helpers';
import { useLanguage } from '../hooks/useLanguage';

const SUBJECTS = [
  'All Topics', 'Environment', 'Digital', 'Migration', 'Agriculture',
  'Budget', 'Defence', 'Industry', 'Media', 'Consumer', 'Health',
  'Finance', 'Employment', 'Energy', 'Internal Affairs', 'Foreign Affairs',
];

export default function VotingExplorer() {
  const { data: votes, isLoading } = useVotes();
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All Topics');
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const { t } = useLanguage();

  const filteredVotes = useMemo(() => {
    if (!votes) return [];
    return votes.filter((v) => {
      if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (subject !== 'All Topics' && v.subject !== subject) return false;
      return true;
    });
  }, [votes, search, subject]);

  const selectedVoteData = useMemo(() => votes?.find((v) => v.id === selectedVote), [votes, selectedVote]);

  const groupChartData = useMemo(() => {
    if (!selectedVoteData?.groups) return [];
    return selectedVoteData.groups.map((g) => ({
      name: g.groupShort, For: g.votesFor, Against: g.votesAgainst, Abstention: g.abstentions,
    }));
  }, [selectedVoteData]);

  const topicStats = useMemo(() => {
    if (!votes) return [];
    const counts: Record<string, number> = {};
    for (const v of votes) { const s = v.subject || 'Other'; counts[s] = (counts[s] || 0) + 1; }
    return Object.entries(counts).map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count);
  }, [votes]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Vote className="text-violet-600" size={28} />
            {t('votes.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('votes.subtitle')}</p>
        </div>
        <SkeletonChart height="h-48" />
        <SkeletonChart height="h-64" />
        <SkeletonChart height="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <Vote className="text-violet-600" size={28} />
          {t('votes.title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('votes.subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('votes.byTopic')}</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topicStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="topic" tick={{ fontSize: 11, fill: '#94a3b8' }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#003399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchFilter value={search} onChange={setSearch} placeholder={t('votes.searchPlaceholder')} />
        </div>
        <select value={subject} onChange={(e) => setSubject(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
          {SUBJECTS.map((s) => (<option key={s} value={s}>{s === 'All Topics' ? t('common.allTopics') : s}</option>))}
        </select>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">{t('votes.found').replace('{count}', String(filteredVotes.length))}</p>

      <div className="space-y-3">
        {filteredVotes.map((vote) => {
          const total = vote.totalFor + vote.totalAgainst + vote.totalAbstention;
          const forPct = total ? (vote.totalFor / total) * 100 : 0;
          const againstPct = total ? (vote.totalAgainst / total) * 100 : 0;
          const absPct = total ? (vote.totalAbstention / total) * 100 : 0;
          const passed = vote.totalFor > vote.totalAgainst;
          const isSelected = selectedVote === vote.id;

          return (
            <div key={vote.id}
              className={`bg-white dark:bg-dark-card rounded-xl border p-5 cursor-pointer transition-all ${isSelected ? 'border-primary-300 dark:border-primary-600 ring-2 ring-primary-100 dark:ring-primary-900 shadow-md' : 'border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'}`}
              onClick={() => setSelectedVote(isSelected ? null : vote.id)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{vote.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{vote.date}</span>
                    {vote.subject && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-300">{vote.subject}</span>}
                    {vote.documentRef && <span className="text-xs text-slate-400 dark:text-slate-500">{vote.documentRef}</span>}
                  </div>
                </div>
                {total > 0 ? (
                  <span className={`shrink-0 px-3 py-1 rounded-lg text-sm font-medium ${passed ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                    {passed ? t('votes.passed') : t('votes.rejected')}
                  </span>
                ) : (
                  <span className="shrink-0 px-3 py-1 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                    Document
                  </span>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-3 text-sm mb-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t('votes.for')}: {vote.totalFor} ({forPct.toFixed(1)}%)</span>
                  <span className="text-red-600 dark:text-red-400 font-medium">{t('votes.against')}: {vote.totalAgainst} ({againstPct.toFixed(1)}%)</span>
                  <span className="text-slate-500 dark:text-slate-400">{t('votes.abstention')}: {vote.totalAbstention} ({absPct.toFixed(1)}%)</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${forPct}%` }} />
                  <div className="bg-red-500 h-full transition-all" style={{ width: `${againstPct}%` }} />
                  <div className="bg-slate-300 dark:bg-slate-500 h-full transition-all" style={{ width: `${absPct}%` }} />
                </div>
              </div>

              {isSelected && vote.groups && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">{t('votes.breakdown')}</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={groupChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="For" stackId="a" fill="#10b981" />
                        <Bar dataKey="Against" stackId="a" fill="#ef4444" />
                        <Bar dataKey="Abstention" stackId="a" fill="#94a3b8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-400">{t('votes.group')}</th>
                          <th className="text-right py-2 px-3 font-medium text-emerald-600 dark:text-emerald-400">{t('votes.for')}</th>
                          <th className="text-right py-2 px-3 font-medium text-red-600 dark:text-red-400">{t('votes.against')}</th>
                          <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">{t('votes.abstention')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vote.groups.map((g) => (
                          <tr key={g.groupShort} className="border-b border-slate-50 dark:border-slate-800">
                            <td className="py-2 px-3 text-slate-900 dark:text-slate-100">
                              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getGroupColor(g.groupShort) }} />
                              {g.groupShort}
                            </td>
                            <td className="text-right py-2 px-3 text-emerald-600 dark:text-emerald-400">{g.votesFor}</td>
                            <td className="text-right py-2 px-3 text-red-600 dark:text-red-400">{g.votesAgainst}</td>
                            <td className="text-right py-2 px-3 text-slate-500 dark:text-slate-400">{g.abstentions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

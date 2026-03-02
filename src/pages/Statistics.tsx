import { useMemo } from 'react';
import { BarChart3, Globe, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie, Treemap,
} from 'recharts';
import { useGroupStats, useCountryStats, useMEPs } from '../hooks/useParliamentData';
import LoadingSpinner from '../components/LoadingSpinner';
import { getGroupColor } from '../utils/helpers';
import { COUNTRY_FLAGS, POLITICAL_GROUP_COLORS } from '../types';
import { useLanguage } from '../hooks/useLanguage';

const TREEMAP_COLORS = [
  '#003399', '#0066CC', '#CC0000', '#FFD700', '#009933',
  '#003366', '#0099CC', '#990000', '#999999', '#5b3a1a',
  '#1a3a5c', '#6366f1', '#ec4899', '#14b8a6', '#f97316',
];

interface TreemapContentProps { x: number; y: number; width: number; height: number; name: string; index: number; }

function CustomTreemapContent({ x, y, width, height, name, index }: TreemapContentProps) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={TREEMAP_COLORS[index % TREEMAP_COLORS.length]} stroke="#1e293b" strokeWidth={2} rx={4} />
      {width > 40 && height > 20 && (
        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={width > 80 ? 12 : 10} fontWeight="bold">{name}</text>
      )}
    </g>
  );
}

export default function Statistics() {
  const { data: groupStats, isLoading: groupsLoading } = useGroupStats();
  const { data: countryStats, isLoading: countriesLoading } = useCountryStats();
  const { data: allMEPs, isLoading: mepsLoading } = useMEPs({ limit: 999 });
  const { t } = useLanguage();

  const isLoading = groupsLoading || countriesLoading || mepsLoading;

  const genderStats = useMemo(() => {
    if (!allMEPs?.items) return { female: 0, male: 0, unknown: 0 };
    const stats = { female: 0, male: 0, unknown: 0 };
    for (const m of allMEPs.items) {
      if (m.gender === 'female') stats.female++;
      else if (m.gender === 'male') stats.male++;
      else stats.unknown++;
    }
    return stats;
  }, [allMEPs]);

  const genderPieData = [
    { name: t('stats.female'), value: genderStats.female, color: '#ec4899' },
    { name: t('stats.male'), value: genderStats.male, color: '#3b82f6' },
  ];

  const countryGroupData = useMemo(() => {
    if (!countryStats) return [];
    return countryStats.slice(0, 15).map((c) => ({
      name: `${COUNTRY_FLAGS[c.countryCode] || ''} ${c.countryCode}`, ...c.groups, total: c.mepCount,
    }));
  }, [countryStats]);

  const allGroupKeys = useMemo(() => {
    if (!countryStats) return [];
    const keys = new Set<string>();
    for (const c of countryStats) Object.keys(c.groups).forEach((k) => keys.add(k));
    return Array.from(keys);
  }, [countryStats]);

  const treemapData = useMemo(() => {
    if (!countryStats) return [];
    return countryStats.map((c) => ({ name: c.countryCode, size: c.totalSeats }));
  }, [countryStats]);

  if (isLoading) return <LoadingSpinner message={t('common.loading')} />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <BarChart3 className="text-primary-600" size={28} />
          {t('stats.title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('stats.subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Globe size={20} className="text-amber-500" />{t('stats.seatsByCountry')}
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap data={treemapData} dataKey="size" aspectRatio={4 / 3}
              content={<CustomTreemapContent x={0} y={0} width={0} height={0} name="" index={0} />}>
              <Tooltip formatter={(value) => [`${value} seats`]} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('stats.genderBalance')}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`} labelLine>
                  {genderPieData.map((e) => (<Cell key={e.name} fill={e.color} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2 text-sm">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 rounded-full bg-pink-500" />
              {t('stats.female')}: {genderStats.female} ({((genderStats.female / (allMEPs?.total || 1)) * 100).toFixed(1)}%)
            </span>
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              {t('stats.male')}: {genderStats.male} ({((genderStats.male / (allMEPs?.total || 1)) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-500" />{t('stats.groupSizes')}
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="short" width={70} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="mepCount" radius={[0, 4, 4, 0]}>
                  {groupStats?.map((e) => (<Cell key={e.short} fill={getGroupColor(e.short)} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('stats.countryGroups')}</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={countryGroupData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip />
              <Legend />
              {allGroupKeys.map((key) => (<Bar key={key} dataKey={key} stackId="a" fill={getGroupColor(key)} />))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('stats.allCountries')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-400">{t('stats.country')}</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600 dark:text-slate-400">{t('stats.totalSeats')}</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600 dark:text-slate-400">{t('stats.mepsListed')}</th>
                {Object.keys(POLITICAL_GROUP_COLORS).slice(0, 7).map((g) => (
                  <th key={g} className="text-right py-2 px-3 font-medium text-slate-600 dark:text-slate-400 text-xs">{g}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {countryStats?.map((c) => (
                <tr key={c.countryCode} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2 px-3 text-slate-900 dark:text-slate-100">{COUNTRY_FLAGS[c.countryCode]} {c.country}</td>
                  <td className="text-right py-2 px-3 font-medium text-slate-900 dark:text-slate-100">{c.totalSeats}</td>
                  <td className="text-right py-2 px-3 text-slate-600 dark:text-slate-300">{c.mepCount}</td>
                  {Object.keys(POLITICAL_GROUP_COLORS).slice(0, 7).map((g) => (
                    <td key={g} className="text-right py-2 px-3 text-xs text-slate-500 dark:text-slate-400">{c.groups[g] || '-'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { BarChart3, Globe, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
  Treemap,
} from 'recharts';
import { useGroupStats, useCountryStats, useMEPs } from '../hooks/useParliamentData';
import LoadingSpinner from '../components/LoadingSpinner';
import { getGroupColor } from '../utils/helpers';
import { COUNTRY_FLAGS, POLITICAL_GROUP_COLORS } from '../types';

const TREEMAP_COLORS = [
  '#003399', '#0066CC', '#CC0000', '#FFD700', '#009933',
  '#003366', '#0099CC', '#990000', '#999999', '#5b3a1a',
  '#1a3a5c', '#6366f1', '#ec4899', '#14b8a6', '#f97316',
];

interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  index: number;
}

function CustomTreemapContent({ x, y, width, height, name, index }: TreemapContentProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={TREEMAP_COLORS[index % TREEMAP_COLORS.length]}
        stroke="#fff"
        strokeWidth={2}
        rx={4}
      />
      {width > 40 && height > 20 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={width > 80 ? 12 : 10}
          fontWeight="bold"
        >
          {name}
        </text>
      )}
    </g>
  );
}

export default function Statistics() {
  const { data: groupStats, isLoading: groupsLoading } = useGroupStats();
  const { data: countryStats, isLoading: countriesLoading } = useCountryStats();
  const { data: allMEPs, isLoading: mepsLoading } = useMEPs({ limit: 999 });

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
    { name: 'Female', value: genderStats.female, color: '#ec4899' },
    { name: 'Male', value: genderStats.male, color: '#3b82f6' },
  ];
  if (genderStats.unknown > 0) {
    genderPieData.push({ name: 'Unknown', value: genderStats.unknown, color: '#94a3b8' });
  }

  const countryGroupData = useMemo(() => {
    if (!countryStats) return [];
    return countryStats.slice(0, 15).map((c) => ({
      name: `${COUNTRY_FLAGS[c.countryCode] || ''} ${c.countryCode}`,
      ...c.groups,
      total: c.mepCount,
    }));
  }, [countryStats]);

  const allGroupKeys = useMemo(() => {
    if (!countryStats) return [];
    const keys = new Set<string>();
    for (const c of countryStats) {
      Object.keys(c.groups).forEach((k) => keys.add(k));
    }
    return Array.from(keys);
  }, [countryStats]);

  const treemapData = useMemo(() => {
    if (!countryStats) return [];
    return countryStats.map((c) => ({
      name: c.countryCode,
      size: c.totalSeats,
    }));
  }, [countryStats]);

  if (isLoading) return <LoadingSpinner message="Loading statistics..." />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <BarChart3 className="text-primary-600" size={28} />
          Parliament Statistics
        </h1>
        <p className="text-slate-500 mt-1">
          Comprehensive statistics about the European Parliament composition
        </p>
      </div>

      {/* Country Seats Treemap */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Globe size={20} className="text-amber-500" />
          Seat Distribution by Country
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4 / 3}
              content={<CustomTreemapContent x={0} y={0} width={0} height={0} name="" index={0} />}
            >
              <Tooltip formatter={(value: number) => [`${value} seats`]} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gender + Group Size */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Balance */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Gender Balance</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine
                >
                  {genderPieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-pink-500" />
              Female: {genderStats.female} ({((genderStats.female / (allMEPs?.total || 1)) * 100).toFixed(1)}%)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              Male: {genderStats.male} ({((genderStats.male / (allMEPs?.total || 1)) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Group Sizes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-500" />
            Political Group Sizes
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="short" width={70} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="mepCount" radius={[0, 4, 4, 0]}>
                  {groupStats?.map((entry) => (
                    <Cell key={entry.short} fill={getGroupColor(entry.short)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Country × Group Stacked Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Political Groups by Country (Top 15)
        </h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={countryGroupData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {allGroupKeys.map((key) => (
                <Bar key={key} dataKey={key} stackId="a" fill={getGroupColor(key)} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Country Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">All Countries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">Country</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">Total Seats</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">MEPs Listed</th>
                {Object.keys(POLITICAL_GROUP_COLORS).slice(0, 7).map((g) => (
                  <th key={g} className="text-right py-2 px-3 font-medium text-slate-600 text-xs">
                    {g}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {countryStats?.map((c) => (
                <tr key={c.countryCode} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 px-3">
                    {COUNTRY_FLAGS[c.countryCode]} {c.country}
                  </td>
                  <td className="text-right py-2 px-3 font-medium">{c.totalSeats}</td>
                  <td className="text-right py-2 px-3">{c.mepCount}</td>
                  {Object.keys(POLITICAL_GROUP_COLORS).slice(0, 7).map((g) => (
                    <td key={g} className="text-right py-2 px-3 text-xs">
                      {c.groups[g] || '-'}
                    </td>
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

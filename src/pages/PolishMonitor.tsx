import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Users, TrendingUp, User } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { usePolishMEPs } from '../hooks/useParliamentData';
import MEPCard from '../components/MEPCard';
import SearchFilter from '../components/SearchFilter';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import { getGroupColor } from '../utils/helpers';

export default function PolishMonitor() {
  const { data: meps, isLoading } = usePolishMEPs();
  const [search, setSearch] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  const filtered = useMemo(() => {
    if (!meps) return [];
    return meps.filter((m) => {
      if (search && !m.fullName.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedParty && m.nationalParty !== selectedParty) return false;
      if (selectedGroup && m.politicalGroupShort !== selectedGroup) return false;
      return true;
    });
  }, [meps, search, selectedParty, selectedGroup]);

  const partyStats = useMemo(() => {
    if (!meps) return [];
    const counts: Record<string, number> = {};
    for (const m of meps) {
      counts[m.nationalParty] = (counts[m.nationalParty] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([party, count]) => ({ party, count }))
      .sort((a, b) => b.count - a.count);
  }, [meps]);

  const groupStats = useMemo(() => {
    if (!meps) return [];
    const counts: Record<string, number> = {};
    for (const m of meps) {
      counts[m.politicalGroupShort] = (counts[m.politicalGroupShort] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([group, count]) => ({
        group,
        count,
        color: getGroupColor(group),
      }))
      .sort((a, b) => b.count - a.count);
  }, [meps]);

  const partyToGroup = useMemo(() => {
    if (!meps) return [];
    const map: Record<string, Record<string, number>> = {};
    for (const m of meps) {
      if (!map[m.nationalParty]) map[m.nationalParty] = {};
      map[m.nationalParty][m.politicalGroupShort] =
        (map[m.nationalParty][m.politicalGroupShort] || 0) + 1;
    }
    return Object.entries(map).map(([party, groups]) => ({
      party,
      ...groups,
    }));
  }, [meps]);

  const allGroups = useMemo(() => {
    if (!meps) return [];
    return [...new Set(meps.map((m) => m.politicalGroupShort))];
  }, [meps]);

  const partyColors: Record<string, string> = {
    'PiS': '#1a3a6a',
    'PO': '#f97316',
    'Lewica': '#dc2626',
    'PSL': '#16a34a',
    'Konfederacja': '#7c3aed',
    'Polska 2050': '#06b6d4',
  };

  const genderStats = useMemo(() => {
    if (!meps) return { female: 0, male: 0 };
    return {
      female: meps.filter((m) => m.gender === 'female').length,
      male: meps.filter((m) => m.gender === 'male').length,
    };
  }, [meps]);

  if (isLoading) return <LoadingSpinner message="Loading Polish MEPs..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <span className="text-3xl">&#127477;&#127473;</span>
          Polish MEP Monitor
        </h1>
        <p className="mt-2 text-red-200">
          Track Polish Members of the European Parliament - their parties, political groups, and activity
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Polish MEPs" value={meps?.length || 0} icon={Users} color="bg-red-500" subtitle="out of 720 total" />
        <StatCard label="National Parties" value={partyStats.length} icon={Flag} color="bg-orange-500" />
        <StatCard label="EP Groups" value={groupStats.length} icon={TrendingUp} color="bg-blue-500" />
        <StatCard
          label="Gender Balance"
          value={`${genderStats.female}F / ${genderStats.male}M`}
          icon={User}
          color="bg-violet-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By National Party */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">By National Party</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={partyStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="count"
                  nameKey="party"
                  label={({ party, count }) => `${party} (${count})`}
                  labelLine
                >
                  {partyStats.map((entry) => (
                    <Cell key={entry.party} fill={partyColors[entry.party] || '#888'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {partyStats.map((p) => (
              <button
                key={p.party}
                onClick={() => setSelectedParty(selectedParty === p.party ? '' : p.party)}
                className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                  selectedParty === p.party
                    ? 'text-white'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
                style={selectedParty === p.party ? { backgroundColor: partyColors[p.party] || '#888' } : undefined}
              >
                {p.party}: {p.count}
              </button>
            ))}
          </div>
        </div>

        {/* By EP Group */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">By EP Political Group</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="group" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {groupStats.map((entry) => (
                    <Cell key={entry.group} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {groupStats.map((g) => (
              <button
                key={g.group}
                onClick={() => setSelectedGroup(selectedGroup === g.group ? '' : g.group)}
                className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                  selectedGroup === g.group
                    ? 'text-white'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
                style={selectedGroup === g.group ? { backgroundColor: g.color } : undefined}
              >
                {g.group}: {g.count}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Party -> Group Mapping */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Polish Parties in EP Groups
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={partyToGroup} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="party" width={100} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {allGroups.map((g) => (
                <Bar key={g} dataKey={g} stackId="a" fill={getGroupColor(g)} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search + Filter MEPs */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">All Polish MEPs</h2>
        <SearchFilter
          value={search}
          onChange={setSearch}
          placeholder="Search Polish MEPs..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((mep) => (
          <MEPCard key={mep.id} mep={mep} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p>No MEPs match your search criteria</p>
        </div>
      )}
    </div>
  );
}

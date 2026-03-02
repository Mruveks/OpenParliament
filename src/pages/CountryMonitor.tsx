import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe, Users, TrendingUp, User, ChevronDown } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { useCountryMEPs } from '../hooks/useParliamentData';
import MEPCard from '../components/MEPCard';
import SearchFilter from '../components/SearchFilter';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import { getGroupColor } from '../utils/helpers';
import { EU_COUNTRIES, COUNTRY_FLAGS } from '../types';
import { useLanguage } from '../hooks/useLanguage';

export default function CountryMonitor() {
  const { countryCode: urlCountry } = useParams<{ countryCode: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [selectedCountry, setSelectedCountry] = useState(urlCountry || '');
  const countryCode = selectedCountry;
  const countryName = EU_COUNTRIES[countryCode] || countryCode;

  const { data: meps, isLoading } = useCountryMEPs(countryCode);
  const [search, setSearch] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  const handleCountryChange = (code: string) => {
    setSelectedCountry(code);
    setSearch('');
    setSelectedParty('');
    setSelectedGroup('');
    if (code) {
      navigate(`/country/${code}`, { replace: true });
    } else {
      navigate('/country', { replace: true });
    }
  };

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
      if (m.nationalParty) counts[m.nationalParty] = (counts[m.nationalParty] || 0) + 1;
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
      .map(([group, count]) => ({ group, count, color: getGroupColor(group) }))
      .sort((a, b) => b.count - a.count);
  }, [meps]);

  const partyToGroup = useMemo(() => {
    if (!meps) return [];
    const map: Record<string, Record<string, number>> = {};
    for (const m of meps) {
      const party = m.nationalParty || 'Independent';
      if (!map[party]) map[party] = {};
      map[party][m.politicalGroupShort] = (map[party][m.politicalGroupShort] || 0) + 1;
    }
    return Object.entries(map).map(([party, groups]) => ({ party, ...groups }));
  }, [meps]);

  const allGroups = useMemo(() => {
    if (!meps) return [];
    return [...new Set(meps.map((m) => m.politicalGroupShort))];
  }, [meps]);

  const partyColors = ['#003399', '#f97316', '#dc2626', '#16a34a', '#7c3aed', '#06b6d4', '#ec4899', '#eab308', '#8b5cf6', '#14b8a6'];

  const genderStats = useMemo(() => {
    if (!meps) return { female: 0, male: 0 };
    return {
      female: meps.filter((m) => m.gender === 'female').length,
      male: meps.filter((m) => m.gender === 'male').length,
    };
  }, [meps]);

  // Country selection view
  if (!countryCode) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Globe className="text-primary-600" size={28} />
            {t('country.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('country.subtitle')}</p>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-8 text-center">
          <Globe className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={64} />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('country.selectPrompt')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{t('country.selectDesc')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Object.entries(EU_COUNTRIES)
            .sort((a, b) => a[1].localeCompare(b[1]))
            .map(([code, name]) => (
              <button
                key={code}
                onClick={() => handleCountryChange(code)}
                className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-4 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all text-center group"
              >
                <span className="text-3xl block mb-2">{COUNTRY_FLAGS[code]}</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {name}
                </span>
              </button>
            ))}
        </div>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner message={t('common.loading')} />;

  return (
    <div className="space-y-6">
      {/* Header with country selector */}
      <div className="bg-gradient-to-r from-eu-blue to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <span className="text-3xl">{COUNTRY_FLAGS[countryCode]}</span>
              {t('country.meps').replace('{country}', countryName)}
            </h1>
            <p className="mt-2 text-blue-200">{t('country.subtitle')}</p>
          </div>
          <div className="relative">
            <select
              value={countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="appearance-none bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
            >
              {Object.entries(EU_COUNTRIES)
                .sort((a, b) => a[1].localeCompare(b[1]))
                .map(([code, name]) => (
                  <option key={code} value={code} className="text-slate-900">{COUNTRY_FLAGS[code]} {name}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('country.meps').replace('{country}', countryName)} value={meps?.length || 0} icon={Users} color="bg-primary-600" subtitle={t('country.outOf')} />
        <StatCard label={t('country.nationalParties')} value={partyStats.length} icon={Globe} color="bg-orange-500" />
        <StatCard label={t('country.epGroups')} value={groupStats.length} icon={TrendingUp} color="bg-blue-500" />
        <StatCard label={t('country.genderBalance')} value={`${genderStats.female}F / ${genderStats.male}M`} icon={User} color="bg-violet-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By National Party */}
        {partyStats.length > 0 && (
          <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('country.byParty')}</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={partyStats} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="count" nameKey="party"
                    label={({ name, value }) => `${name} (${value})`} labelLine>
                    {partyStats.map((entry, i) => (
                      <Cell key={entry.party} fill={partyColors[i % partyColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {partyStats.map((p, i) => (
                <button key={p.party} onClick={() => setSelectedParty(selectedParty === p.party ? '' : p.party)}
                  className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${selectedParty === p.party ? 'text-white' : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                  style={selectedParty === p.party ? { backgroundColor: partyColors[i % partyColors.length] } : undefined}>
                  {p.party}: {p.count}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* By EP Group */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('country.byGroup')}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="group" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
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
              <button key={g.group} onClick={() => setSelectedGroup(selectedGroup === g.group ? '' : g.group)}
                className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${selectedGroup === g.group ? 'text-white' : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                style={selectedGroup === g.group ? { backgroundColor: g.color } : undefined}>
                {g.group}: {g.count}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Party -> Group Mapping */}
      {partyToGroup.length > 1 && (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            {t('country.partyToGroup').replace('{country}', countryName)}
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partyToGroup} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="party" width={100} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip />
                <Legend />
                {allGroups.map((g) => (
                  <Bar key={g} dataKey={g} stackId="a" fill={getGroupColor(g)} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Search + Filter MEPs */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {t('country.allMeps').replace('{country}', countryName)}
        </h2>
        <SearchFilter value={search} onChange={setSearch} placeholder={t('country.searchPlaceholder').replace('{country}', countryName)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((mep) => (
          <MEPCard key={mep.id} mep={mep} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <p>{t('country.noResults')}</p>
        </div>
      )}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Users, Vote, Building2, Flag, TrendingUp, Globe } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useGroupStats, useCountryStats, useVotes } from '../hooks/useParliamentData';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getGroupColor } from '../utils/helpers';
import { COUNTRY_FLAGS } from '../types';

export default function Dashboard() {
  const { data: groupStats, isLoading: groupsLoading } = useGroupStats();
  const { data: countryStats, isLoading: countriesLoading } = useCountryStats();
  const { data: votes, isLoading: votesLoading } = useVotes();

  if (groupsLoading || countriesLoading || votesLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
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
        <h1 className="text-3xl font-bold">European Parliament Explorer</h1>
        <p className="mt-2 text-blue-200 max-w-2xl">
          Explore data about Members of the European Parliament, voting patterns,
          committees, and political groups. Track how your representatives vote on key issues.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            to="/meps"
            className="px-4 py-2 bg-white text-eu-blue rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors"
          >
            Browse MEPs
          </Link>
          <Link
            to="/votes"
            className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium text-sm hover:bg-white/20 transition-colors border border-white/20"
          >
            Explore Votes
          </Link>
          <Link
            to="/polish"
            className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium text-sm hover:bg-white/20 transition-colors border border-white/20"
          >
            Polish MEPs
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total MEPs" value={totalMEPs} icon={Users} color="bg-primary-600" />
        <StatCard label="Political Groups" value={totalGroups} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard label="Member States" value={countryStats?.length || 27} icon={Globe} color="bg-amber-500" />
        <StatCard label="Tracked Votes" value={totalVotes} icon={Vote} color="bg-violet-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Political Groups Pie */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Political Groups</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={true}
                >
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
              <Link
                key={g.short}
                to={`/meps?group=${g.short}`}
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full hover:opacity-80 transition-opacity text-white"
                style={{ backgroundColor: getGroupColor(g.short) }}
              >
                {g.short}: {g.mepCount}
              </Link>
            ))}
          </div>
        </div>

        {/* Country Seats Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Seats by Country (Top 10)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCountries} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="seats" fill="#003399" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Votes */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Key Votes</h2>
          <Link to="/votes" className="text-sm text-primary-600 hover:underline font-medium">
            View all votes
          </Link>
        </div>
        <div className="space-y-3">
          {recentVotes.map((vote) => {
            const total = vote.totalFor + vote.totalAgainst + vote.totalAbstention;
            const forPct = total ? (vote.totalFor / total) * 100 : 0;
            const againstPct = total ? (vote.totalAgainst / total) * 100 : 0;
            return (
              <div key={vote.id} className="border border-slate-100 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-slate-900 text-sm">{vote.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{vote.date} {vote.subject && `| ${vote.subject}`}</p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                      vote.totalFor > vote.totalAgainst
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {vote.totalFor > vote.totalAgainst ? 'Passed' : 'Rejected'}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${forPct}%` }}
                    />
                    <div
                      className="bg-red-500 h-full"
                      style={{ width: `${againstPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">
                    {vote.totalFor} / {vote.totalAgainst} / {vote.totalAbstention}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/meps"
          className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow group"
        >
          <Users className="text-primary-600 mb-3" size={28} />
          <h3 className="font-semibold text-slate-900 group-hover:text-primary-600">MEP Tracker</h3>
          <p className="text-sm text-slate-500 mt-1">
            Search and filter all {totalMEPs} Members of the European Parliament
          </p>
        </Link>
        <Link
          to="/committees"
          className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow group"
        >
          <Building2 className="text-emerald-600 mb-3" size={28} />
          <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600">Committees</h3>
          <p className="text-sm text-slate-500 mt-1">
            Explore 20 parliamentary committees and their members
          </p>
        </Link>
        <Link
          to="/polish"
          className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow group"
        >
          <Flag className="text-red-600 mb-3" size={28} />
          <h3 className="font-semibold text-slate-900 group-hover:text-red-600">Polish Monitor</h3>
          <p className="text-sm text-slate-500 mt-1">
            Track Polish MEPs, their parties and activity in the Parliament
          </p>
        </Link>
      </div>
    </div>
  );
}

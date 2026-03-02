import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Filter } from 'lucide-react';
import { useMEPs, useCommittees } from '../hooks/useParliamentData';
import MEPCard from '../components/MEPCard';
import SearchFilter from '../components/SearchFilter';
import LoadingSpinner from '../components/LoadingSpinner';
import { EU_COUNTRIES, COUNTRY_FLAGS, POLITICAL_GROUP_COLORS } from '../types';

const GROUPS = Object.keys(POLITICAL_GROUP_COLORS);
const PAGE_SIZE = 24;

export default function MEPTracker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [country, setCountry] = useState(searchParams.get('country') || '');
  const [group, setGroup] = useState(searchParams.get('group') || '');
  const [committee, setCommittee] = useState(searchParams.get('committee') || '');
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const { data: committees } = useCommittees();

  const { data, isLoading } = useMEPs({
    offset: page * PAGE_SIZE,
    limit: 999,
    countryCode: country || undefined,
    group: group || undefined,
    search: search || undefined,
    committee: committee || undefined,
  });

  const filteredMEPs = useMemo(() => data?.items || [], [data]);
  const paginatedMEPs = useMemo(
    () => filteredMEPs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filteredMEPs, page]
  );
  const totalPages = Math.ceil((filteredMEPs.length || 0) / PAGE_SIZE);

  const updateFilter = (key: string, value: string) => {
    setPage(0);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);

    switch (key) {
      case 'country': setCountry(value); break;
      case 'group': setGroup(value); break;
      case 'committee': setCommittee(value); break;
      case 'search': setSearch(value); break;
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCountry('');
    setGroup('');
    setCommittee('');
    setPage(0);
    setSearchParams({});
  };

  const hasFilters = search || country || group || committee;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="text-primary-600" size={28} />
            MEP Tracker
          </h1>
          <p className="text-slate-500 mt-1">
            Search and explore Members of the European Parliament
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <SearchFilter
          value={search}
          onChange={(v) => updateFilter('search', v)}
          placeholder="Search MEPs by name or party..."
        />

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${showFilters ? '' : 'hidden md:grid'}`}>
          <select
            value={country}
            onChange={(e) => updateFilter('country', e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Countries</option>
            {Object.entries(EU_COUNTRIES).sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => (
              <option key={code} value={code}>
                {COUNTRY_FLAGS[code]} {name}
              </option>
            ))}
          </select>

          <select
            value={group}
            onChange={(e) => updateFilter('group', e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Political Groups</option>
            {GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select
            value={committee}
            onChange={(e) => updateFilter('committee', e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Committees</option>
            {committees?.map((c) => (
              <option key={c.shortName} value={c.shortName}>
                {c.shortName} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">
              {filteredMEPs.length} result{filteredMEPs.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={clearFilters}
              className="text-primary-600 hover:underline font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <LoadingSpinner message="Loading MEPs..." />
      ) : paginatedMEPs.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Users className="mx-auto mb-3 text-slate-300" size={48} />
          <p className="font-medium">No MEPs found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedMEPs.map((mep) => (
              <MEPCard key={mep.id} mep={mep} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500 px-3">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useSejmProcesses } from '../hooks/useSejmData';
import { usePlenaryDocuments } from '../hooks/useParliamentData';
import { SkeletonChart, SkeletonStatCards } from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SearchFilter from '../components/SearchFilter';
import { useLanguage } from '../hooks/useLanguage';

export default function LegislativePipeline() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<'sejm' | 'ep'>('sejm');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: sejmProcesses, isLoading: sejmLoading, error: sejmError, refetch: refetchSejm } = useSejmProcesses({ limit: 200 });
  const { data: epDocuments, isLoading: epLoading, error: epError, refetch: refetchEP } = usePlenaryDocuments();

  const filteredSejmProcesses = useMemo(() => {
    if (!sejmProcesses) return [];
    let filtered = [...sejmProcesses];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.number.includes(q)
      );
    }
    if (statusFilter === 'passed') {
      filtered = filtered.filter((p) => p.passed === true);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter((p) => p.passed !== true);
    }
    // Sort by date descending (newest first)
    filtered.sort((a, b) => {
      const dateA = a.processStartDate || '';
      const dateB = b.processStartDate || '';
      return dateB.localeCompare(dateA);
    });
    return filtered;
  }, [sejmProcesses, search, statusFilter]);

  const filteredEPDocuments = useMemo(() => {
    if (!epDocuments) return [];
    let filtered = [...epDocuments];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((d) =>
        d.title.toLowerCase().includes(q) ||
        (d.documentRef || '').toLowerCase().includes(q)
      );
    }
    // Sort by date descending (newest first)
    filtered.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    });
    return filtered;
  }, [epDocuments, search]);

  const sejmStats = useMemo(() => {
    if (!sejmProcesses) return { total: 0, passed: 0, pending: 0, eu: 0 };
    return {
      total: sejmProcesses.length,
      passed: sejmProcesses.filter((p) => p.passed === true).length,
      pending: sejmProcesses.filter((p) => p.passed !== true).length,
      eu: sejmProcesses.filter((p) => p.uE === true).length,
    };
  }, [sejmProcesses]);

  const isLoading = tab === 'sejm' ? sejmLoading : epLoading;
  const hasError = tab === 'sejm' ? sejmError : epError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FileText size={28} />
            {t('pipeline.title') || 'Legislative Pipeline'}
          </h1>
          <p className="mt-2 text-indigo-200">
            {t('pipeline.subtitle') || 'Track legislative processes in the Polish Sejm and European Parliament plenary documents.'}
          </p>
        </div>
        <SkeletonStatCards count={4} />
        <SkeletonChart height="h-64" />
        <SkeletonChart height="h-64" />
      </div>
    );
  }

  if (hasError) {
    return (
      <ErrorMessage
        message={t('common.error')}
        detail={tab === 'sejm'
          ? 'Could not load data from the Polish Sejm API.'
          : 'Could not load data from the European Parliament API.'
        }
        onRetry={() => tab === 'sejm' ? refetchSejm() : refetchEP()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <FileText size={28} />
          {t('pipeline.title') || 'Legislative Pipeline'}
        </h1>
        <p className="mt-2 text-indigo-200">
          {t('pipeline.subtitle') || 'Track legislative processes in the Polish Sejm and European Parliament plenary documents. Real data from official APIs.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-dark-border">
        <button onClick={() => { setTab('sejm'); setSearch(''); setStatusFilter(''); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'sejm'
            ? 'border-red-600 text-red-600 dark:text-red-400'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}>
          Sejm Processes ({sejmStats.total})
        </button>
        <button onClick={() => { setTab('ep'); setSearch(''); setStatusFilter(''); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'ep'
            ? 'border-primary-600 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}>
          EP Plenary Documents ({epDocuments?.length || 0})
        </button>
      </div>

      {tab === 'sejm' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-4 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{sejmStats.total}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Processes</p>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{sejmStats.passed}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Passed</p>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{sejmStats.pending}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pending</p>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-4 text-center">
              <p className="text-2xl font-bold text-primary-600">{sejmStats.eu}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">EU Related</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchFilter value={search} onChange={setSearch} placeholder="Search processes by title or number..." />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">All statuses</option>
              <option value="passed">Passed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filteredSejmProcesses.length} processes found
          </p>

          {/* Process list */}
          <div className="space-y-2">
            {filteredSejmProcesses.slice(0, 100).map((proc) => (
              <div key={proc.number}
                className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                        #{proc.number}
                      </span>
                      {proc.uE && (
                        <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded font-medium">
                          EU
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm mt-1 line-clamp-2">
                      {proc.title}
                    </h3>
                    {proc.processStartDate && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Started: {proc.processStartDate}
                      </p>
                    )}
                    {proc.stages && proc.stages.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {proc.stages.slice(-3).map((stage, i) => (
                          <span key={i} className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded">
                            {stage.stageName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {proc.passed === true ? (
                      <CheckCircle size={18} className="text-emerald-500" />
                    ) : proc.passed === false ? (
                      <XCircle size={18} className="text-red-500" />
                    ) : (
                      <Clock size={18} className="text-amber-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'ep' && (
        <div className="space-y-4">
          <SearchFilter value={search} onChange={setSearch} placeholder="Search EP plenary documents..." />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filteredEPDocuments.length} documents found
          </p>

          <div className="space-y-2">
            {filteredEPDocuments.map((doc) => (
              <div key={doc.id}
                className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {doc.documentRef && (
                      <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                        {doc.documentRef}
                      </span>
                    )}
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm mt-1">
                      {doc.title}
                    </h3>
                    {doc.date && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {doc.date}
                      </p>
                    )}
                  </div>
                  <FileText size={16} className="text-slate-400 shrink-0" />
                </div>
              </div>
            ))}
          </div>

          {filteredEPDocuments.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <FileText className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={48} />
              <p>No plenary documents available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

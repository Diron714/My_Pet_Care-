import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { FileText, Plus, Edit, Eye, Search, Filter, PawPrint, User, Calendar, Stethoscope, Pill, AlertCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SEARCH_MIN_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 400;

const HealthRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const firstFetchRef = useRef(true);
  const [petNameInput, setPetNameInput] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [filters, setFilters] = useState({
    petName: '',
    customerName: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const p = petNameInput.trim();
      const c = customerNameInput.trim();
      const petApplied = p.length === 0 || p.length >= SEARCH_MIN_CHARS ? p : '';
      const custApplied = c.length === 0 || c.length >= SEARCH_MIN_CHARS ? c : '';
      setFilters((prev) => {
        if (prev.petName === petApplied && prev.customerName === custApplied) return prev;
        return { ...prev, petName: petApplied, customerName: custApplied };
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [petNameInput, customerNameInput]);

  const loadRecords = useCallback(async () => {
    try {
      if (firstFetchRef.current) {
        setLoading(true);
      } else {
        setListRefreshing(true);
      }
      const params = new URLSearchParams();
      if (filters.petName) params.append('petName', filters.petName);
      if (filters.customerName) params.append('customerName', filters.customerName);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await api.get(`/health-records?${params.toString()}`);
      setRecords(response.data.data || []);
    } catch (error) {
      console.error('Error loading health records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
      setListRefreshing(false);
      firstFetchRef.current = false;
    }
  }, [filters.petName, filters.customerName, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleViewDetails = async (recordId) => {
    try {
      const response = await api.get(`/health-records/${recordId}`);
      setSelectedRecord(response.data.data);
      setShowDetails(true);
    } catch (error) {
      console.error('Error loading record details:', error);
      toast.error('Failed to load record details');
    }
  };

  if (loading && firstFetchRef.current) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-shell max-w-6xl">

        {/* Filters — same pattern as admin (card, labels, placeholders, date hint) */}
        <div className="card mb-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
            </div>
            <Link to="/doctor/health-records/new">
              <Button className="!rounded-xl !font-medium !bg-slate-900 hover:!bg-slate-800">
                <Plus className="w-4 h-4 inline mr-2" />
                Create New Record
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pet name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Pet name (${SEARCH_MIN_CHARS}+ characters)...`}
                  value={petNameInput}
                  onChange={(e) => setPetNameInput(e.target.value)}
                  className="input-field pl-10 pr-8"
                />
                {petNameInput && (
                  <button
                    type="button"
                    onClick={() => setPetNameInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Clear pet name search"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
              {petNameInput.trim().length === 1 && (
                <p className="mt-1.5 text-xs text-amber-700">Enter at least {SEARCH_MIN_CHARS} characters to filter by pet name.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Customer name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Customer (${SEARCH_MIN_CHARS}+ characters)...`}
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  className="input-field pl-10 pr-8"
                />
                {customerNameInput && (
                  <button
                    type="button"
                    onClick={() => setCustomerNameInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Clear customer name search"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
              {customerNameInput.trim().length === 1 && (
                <p className="mt-1.5 text-xs text-amber-700">Enter at least {SEARCH_MIN_CHARS} characters to filter by customer.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">From date</label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  title="dd/mm/yyyy"
                  className={`input-field w-full ${filters.dateFrom ? 'text-slate-900' : 'text-transparent focus:text-slate-900'}`}
                />
                {!filters.dateFrom && (
                  <span
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-sm text-slate-400"
                    aria-hidden
                  >
                    dd/mm/yyyy
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">To date</label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                  title="dd/mm/yyyy"
                  className={`input-field w-full ${filters.dateTo ? 'text-slate-900' : 'text-transparent focus:text-slate-900'}`}
                />
                {!filters.dateTo && (
                  <span
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-sm text-slate-400"
                    aria-hidden
                  >
                    dd/mm/yyyy
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setPetNameInput('');
                  setCustomerNameInput('');
                  setFilters({ petName: '', customerName: '', dateFrom: '', dateTo: '' });
                }}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="relative min-h-[200px]">
          {listRefreshing && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur-[1px]"
              aria-busy="true"
              aria-live="polite"
            >
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" aria-hidden />
            </div>
          )}

          {!listRefreshing && records.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-8">
              <EmptyState
                icon={FileText}
                title="No health records found"
                message="Start by creating health records for your appointments"
              />
            </div>
          ) : records.length > 0 ? (
            <div className="table-shell">
              <table className="table">
                <thead>
                  <tr>
                    <th>Record Date</th>
                    <th>Pet Name</th>
                    <th>Species</th>
                    <th>Customer Name</th>
                    <th>Diagnosis Summary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.record_id} className="hover:bg-slate-50 transition-colors">
                      <td>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{formatDate(record.record_date)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <PawPrint className="w-4 h-4 text-slate-600" />
                          <span className="font-semibold text-slate-900">
                            {record.customer_pet?.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-slate-600">
                          {record.customer_pet?.species}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-800">
                            {record.customer?.user?.first_name}{' '}
                            {record.customer?.user?.last_name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-slate-700 line-clamp-2">
                          {record.diagnosis
                            ? `${record.diagnosis.substring(0, 70)}${record.diagnosis.length > 70 ? '...' : ''}`
                            : '-'}
                        </span>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(record.record_id)}
                            className="!rounded-xl !px-3 !py-1.5 text-xs !border-slate-200 hover:!bg-slate-50"
                          >
                            <Eye className="w-4 h-4 inline mr-1" />
                            View
                          </Button>
                          <Link to={`/doctor/health-records/${record.record_id}/edit`}>
                            <Button variant="outline" size="sm" className="!rounded-xl !px-3 !py-1.5 text-xs !border-slate-200 hover:!bg-slate-50">
                              <Edit className="w-4 h-4 inline mr-1" />
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden />
            </div>
          )}
        </div>

        {/* Record Details Modal */}
        {showDetails && selectedRecord && (
          <Modal
            isOpen={showDetails}
            onClose={() => setShowDetails(false)}
            title={`Health Record - ${formatDate(selectedRecord.record_date)}`}
            size="lg"
          >
            <div className="space-y-5 text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-blue-50/80 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-9 w-9 rounded-2xl bg-blue-100 flex items-center justify-center">
                      <PawPrint className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Pet Information</h3>
                  </div>
                  <p className="text-slate-700 text-sm"><span className="font-medium text-slate-500">Name:</span> {selectedRecord.customer_pet?.name}</p>
                  <p className="text-slate-700 text-sm"><span className="font-medium text-slate-500">Species:</span> {selectedRecord.customer_pet?.species}</p>
                  <p className="text-slate-700 text-sm"><span className="font-medium text-slate-500">Breed:</span> {selectedRecord.customer_pet?.breed || 'N/A'}</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-9 w-9 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Customer</h3>
                  </div>
                  <p className="text-slate-700 text-sm">
                    {selectedRecord.customer?.user?.first_name} {selectedRecord.customer?.user?.last_name}
                  </p>
                </div>
              </div>
              {selectedRecord.diagnosis && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-9 w-9 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-slate-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Diagnosis</h3>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-sm">{selectedRecord.diagnosis}</p>
                </div>
              )}
              {selectedRecord.prescription && (
                <div className="p-5 bg-emerald-50/80 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-9 w-9 rounded-2xl bg-emerald-100 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Prescription</h3>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-sm">{selectedRecord.prescription}</p>
                </div>
              )}
              {selectedRecord.treatment_notes && (
                <div className="p-5 bg-amber-50/80 rounded-2xl border border-amber-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-9 w-9 rounded-2xl bg-amber-100 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Treatment Notes</h3>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-sm">{selectedRecord.treatment_notes}</p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default HealthRecords;

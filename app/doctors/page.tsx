'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { branchService, Branch } from '@/services/branchService';
import { getDoctors, getDoctorDetail, updateDoctorInfo, updateDoctorCommissions, getDoctorEntries, downloadDoctorEntriesPDF } from '@/services/doctorService';
import { testService, BranchTest } from '@/services/testService';
import { fetchWithAuth } from '@/lib/api';

interface Doctor {
  name: string;
  address: string;
  branches: number[];
  is_verified: boolean;
  phone_number?: string;
  speciality?: string;
}

interface DoctorDetail extends Doctor {
  commissions: Array<{
    id: number;
    branch_id: number;
    branch_name: string | null;
    test_id: number;
    test_name: string;
    modality_name: string | null;
    amount: number;
    is_verified: boolean;
    effective_date?: string;
  }>;
}

const allowedRoles = ['Organization Head', 'Organization Partner', 'Branch Admin'];

const DoctorsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDetail | null>(null);
  const [doctorEntries, setDoctorEntries] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modalities, setModalities] = useState<{id:number,name:string}[]>([]);
  const [selectedModalityFilter, setSelectedModalityFilter] = useState('');
  const [filterBranchId, setFilterBranchId] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [dateFilterType, setDateFilterType] = useState<'all' | 'day' | 'range' | 'monthly' | 'yearly'>('all');

  const [monthValue, setMonthValue] = useState('');
  const [yearValue, setYearValue] = useState('');

  // Redirect if unauthorized
  useEffect(() => {
    if (isAuthenticated && user && !allowedRoles.includes(user.type)) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Load branches on mount
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await branchService.getBranches();
        setBranches(data);
        if (data.length > 0) setSelectedBranchId(data[0].id);
      } catch (err: any) {
        console.error(err.message || 'Failed to load branches');
      }
    };
    loadBranches();
  }, []);

  // Load doctors whenever filters or branch change
  useEffect(() => {
    const loadDoctors = async () => {
      if (!selectedBranchId) return;
      try {
        const params: any = { branch_id: selectedBranchId };
        if (nameFilter) params.name = nameFilter;
        if (verifiedFilter === 'verified') params.verified = true;
        else if (verifiedFilter === 'unverified') params.verified = false;
        const data = await getDoctors(params);
        setDoctors(data);
      } catch (err: any) {
        console.error(err.message || 'Failed to load doctors');
        setDoctors([]);
      }
    };
    loadDoctors();
  }, [selectedBranchId, nameFilter, verifiedFilter]);

  // Load modalities once
  useEffect(() => {
    const loadModalities = async () => {
      try {
        const data = await testService.getGlobalTests();
        setModalities(data);
      } catch (err) { console.error(err); setModalities([]); }
    };
    loadModalities();
  }, []);

  // Open the doctor detail modal and fetch data. The modal now appears immediately with a loading state.
  const openDoctorModal = async (doctorName: string) => {
    if (!selectedBranchId) return;
    setIsModalOpen(true);
    setSelectedDoctor(null);
    try {
      const detail = await getDoctorDetail(doctorName, selectedBranchId);
      setSelectedDoctor(detail);

      try {
        const entryList = await getDoctorEntries(doctorName, {}, 50);
        setDoctorEntries(entryList);
      } catch (e) { setDoctorEntries([]); }
    } catch (err: any) {
      console.error(err.message || 'Failed to load doctor details');
      setIsModalOpen(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDoctor(null);
  };

  const handleSaveDoctorInfo = async () => {
    if (!selectedDoctor) return;
    try {
      await updateDoctorInfo(selectedDoctor.name, {
        address: selectedDoctor.address,
        is_verified: selectedDoctor.is_verified,
        phone_number: selectedDoctor.phone_number,
        speciality: selectedDoctor.speciality,
      });

      // Also save (and retro-apply) commissions using the same logic as the dedicated save-commissions button
      await handleSaveCommissions();

      console.log('Doctor details & commissions saved');
      closeModal();
      // Refresh list
      const params: any = { branch_id: selectedBranchId };
      if (nameFilter) params.name = nameFilter;
      if (verifiedFilter === 'verified') params.verified = true;
      else if (verifiedFilter === 'unverified') params.verified = false;
      const data = await getDoctors(params);
      setDoctors(data);
    } catch (err: any) {
      console.error(err.message || 'Failed to save');
    }
  };

  const handleAddCommission = () => {
    if (!selectedDoctor) return;
    setSelectedDoctor({
      ...selectedDoctor,
      commissions: [
        ...selectedDoctor.commissions,
        {
          id: 0,
          branch_id: selectedBranchId!,
          branch_name: branches.find(b => b.id === selectedBranchId)?.name || '',
          test_id: 0,
          test_name: '',
          modality_name: '',
          amount: 0,
          is_verified: true,
        },
      ],
    });
  };

  const handleCommissionChange = (index: number, field: keyof DoctorDetail['commissions'][0], value: any) => {
    if (!selectedDoctor) return;
    const updated = [...selectedDoctor.commissions];
    updated[index] = { ...updated[index], [field]: value } as any;
    setSelectedDoctor({ ...selectedDoctor, commissions: updated });
  };

  const handleSaveCommissions = async () => {
    if (!selectedDoctor) return;
    try {
      const commissionsArr = selectedDoctor.commissions
        .filter(c => c.test_id && c.amount)
        .map(c => ({
          branch_id: c.branch_id,
          test_id: c.test_id,
          amount: c.amount,
          is_verified: true,
          effective_date: (c as any).effective_date || undefined,
        }));

      const extraFilters = buildFilterParams();
      const body = { commissions: commissionsArr, apply_to_entries: true, ...extraFilters };
      await fetchWithAuth(`/organization/doctors/${encodeURIComponent(selectedDoctor.name)}/commissions`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      // Refresh entries list to reflect updated commissions
      const updatedEntries = await getDoctorEntries(selectedDoctor.name, extraFilters, 100);
      setDoctorEntries(updatedEntries);

      console.log('Commissions saved');
      // keep modal open so user can see changes
    } catch (err: any) {
      console.error(err.message || 'Failed to save commissions');
    }
  };

  // Helper to build filter params
  const buildFilterParams = () => {
    const params: Record<string, string | number | undefined> = {};
    if (selectedModalityFilter) params.modality_id = selectedModalityFilter;
    if (filterBranchId) params.branch_id = filterBranchId;
    if (dateFilterType === 'day' && dateStart) {
      params.date_filter_type = 'specific';
      params.date = dateStart;
    } else if (dateFilterType === 'range' && dateStart && dateEnd) {
      params.date_filter_type = 'range';
      params.date_start = dateStart;
      params.date_end = dateEnd;
    } else if (dateFilterType === 'monthly' && monthValue) {
      params.date_filter_type = 'monthly';
      params.month = monthValue.split('-')[1];
      params.month_year = monthValue.split('-')[0];
    } else if (dateFilterType === 'yearly' && yearValue) {
      params.date_filter_type = 'yearly';
      params.year = yearValue;
    }
    return params;
  };

  const applyFilters = async () => {
    if (!selectedDoctor) return;
    try {
      const entries = await getDoctorEntries(selectedDoctor.name, buildFilterParams(), 100);
      setDoctorEntries(entries);
    } catch (err) { console.error(err); }
  };

  const clearFilters = () => {
    setSelectedModalityFilter('');
    setFilterBranchId('');
    setDateStart('');
    setDateEnd('');
    applyFilters();
  };

  const handlePrintPDF = async () => {
    if (!selectedDoctor) return;
    try {
      const blob = await downloadDoctorEntriesPDF(selectedDoctor.name, buildFilterParams());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedDoctor.name}_entries.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) { console.error(err); }
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Doctors</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your organization&apos;s doctors and their access permissions.</p>

      {/* Filters */}
      <div className="mt-10 mb-10 p-4 flex flex-wrap gap-6">
        <div className="min-w-[200px] w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
          <select
            className="bg-gray-50 dark:bg-gray-900 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            value={selectedBranchId ?? ''}
            onChange={e => setSelectedBranchId(Number(e.target.value))}
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px] w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            className="bg-gray-50 dark:bg-gray-900 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            value={nameFilter}
            onChange={e => setNameFilter(e.target.value)}
            placeholder="Search name"
          />
        </div>
        <div className="min-w-[200px] w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">Verified</label>
          <select
            className="bg-gray-50 dark:bg-gray-900 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            value={verifiedFilter}
            onChange={e => setVerifiedFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Doctors table – styled to match Tests page */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md mb-6">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Branches</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {doctors.map(doc => (
              <tr key={doc.name} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDoctorModal(doc.name)}>
                <td className="px-6 py-4 whitespace-nowrap font-medium" style={{ color: doc.is_verified ? 'inherit' : 'red' }}>{doc.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{doc.address || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">{doc.is_verified ? '✓' : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">{doc.branches.length}</td>
              </tr>
            ))}
            {doctors.length === 0 && (
              <tr><td className="px-6 py-4 text-center" colSpan={4}>No doctors found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Doctor Modal */}
      {isModalOpen && (
        selectedDoctor ? (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg p-6 relative">
              <button className="absolute top-2 right-2 text-gray-600" onClick={closeModal}>✕</button>
              <h2 className="text-xl font-semibold mb-4">Doctor: {selectedDoctor.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left pane: info */}
                <div>
                  <label className="block text-sm font-medium mb-1">Area</label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-md w-full px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedDoctor.address}
                    onChange={e => setSelectedDoctor({ ...selectedDoctor, address: e.target.value })}
                  />
                  {/* Phone */}
                  <label className="block text-sm font-medium mb-1 mt-4">Phone Number</label>
                  <input type="text" className="border border-gray-300 rounded-md w-full px-3 py-2 focus:ring-blue-500 focus:border-blue-500" value={selectedDoctor.phone_number || ''} onChange={e => setSelectedDoctor({ ...selectedDoctor, phone_number: e.target.value })} />

                  {/* Speciality */}
                  <label className="block text-sm font-medium mb-1 mt-4">Speciality</label>
                  <select className="border border-gray-300 rounded-md w-full px-3 py-2 focus:ring-blue-500 focus:border-blue-500" value={selectedDoctor.speciality || ''} onChange={e => setSelectedDoctor({ ...selectedDoctor, speciality: e.target.value })} >
                    <option value="">Select speciality</option>
                    {['Radiologist','Cardiologist','Orthopedics','Neurologist','Physician','Gynecologist','Other'].map(sp => <option key={sp} value={sp}>{sp}</option>)}
                  </select>

                  <div className="mt-4 flex items-center gap-2">
                    <input type="checkbox" id="verified_chk" className="w-6 h-6" checked={selectedDoctor.is_verified} onChange={e => setSelectedDoctor({ ...selectedDoctor, is_verified: e.target.checked })} />
                    <label htmlFor="verified_chk" className="text-base">Verified</label>
                  </div>
                </div>
                {/* Right pane: commissions */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Commissions</h3>
                    <button className="px-3 py-1 bg-green-600 text-white rounded text-sm" onClick={handleAddCommission}>+ Add</button>
                  </div>
                  <div className="overflow-x-auto overflow-y-auto bg-white rounded-lg shadow-md max-h-80 divide-y divide-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDoctor.commissions.map((c, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-1">
                              {c.test_name ? (
                                c.test_name
                              ) : (
                                <TestSelect
                                  branchId={selectedBranchId!}
                                  onSelect={(test) => {
                                    handleCommissionChange(idx, 'test_id', test.test_id);
                                    handleCommissionChange(idx, 'test_name', test.test_name);
                                    handleCommissionChange(idx, 'modality_name', test.modality_name);
                                  }}
                                />
                              )}
                            </td>
                            <td className="px-3 py-1 text-right">
                              <input
                                type="number"
                                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right"
                                placeholder="0"
                                value={c.amount === 0 ? '' : c.amount.toString()}
                                onChange={e => handleCommissionChange(idx, 'amount', Number(e.target.value || 0))}
                              />
                            </td>
                            <td className="px-3 py-1">
                              <input type="date" className="w-full px-2 py-1 border border-gray-300 rounded-md" value={(c as any).effective_date || ''} onChange={e => handleCommissionChange(idx, 'effective_date' as any, e.target.value)} />
                            </td>
                          </tr>
                        ))}
                        {selectedDoctor.commissions.length === 0 && (
                          <tr><td className="border p-2 text-center" colSpan={2}>No commissions</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Second row – entries list */}
              <div className="mt-8 overflow-x-auto overflow-y-auto bg-white rounded-lg shadow-md max-h-96">
                <h3 className="font-semibold mb-2 px-2">Patient Test Entries</h3>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 px-2 mb-4 text-xs">
                  {/* Modality */}
                  <div>
                    <label className="block mb-1 text-gray-600">Modality</label>
                    <select
                      className="border border-gray-300 rounded-md px-2 py-1"
                      value={selectedModalityFilter}
                      onChange={e => setSelectedModalityFilter(e.target.value)}
                    >
                      <option value="">All</option>
                      {modalities.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Branch */}
                  <div>
                    <label className="block mb-1 text-gray-600">Branch</label>
                    <select
                      className="border border-gray-300 rounded-md px-2 py-1"
                      value={filterBranchId ?? ''}
                      onChange={e => setFilterBranchId(e.target.value)}
                    >
                      <option value="">All</option>
                      {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
                    </select>
                  </div>
                  {/* Date filter type */}
                  <div>
                    <label className="block mb-1 text-gray-600">Date Type</label>
                    <select
                      className="border border-gray-300 rounded-md px-2 py-1"
                      value={dateFilterType}
                      onChange={e => setDateFilterType(e.target.value as 'all' | 'day' | 'range' | 'monthly' | 'yearly')}
                    >
                      <option value="all">All</option>
                      <option value="day">Day</option>
                      <option value="range">Range</option>
                      <option value="monthly">Month</option>
                      <option value="yearly">Year</option>
                    </select>
                  </div>

                  {dateFilterType === 'day' && (
                    <div>
                      <label className="block mb-1 text-gray-600">Date</label>
                      <input type="date" className="border border-gray-300 rounded-md px-2 py-1" value={dateStart} onChange={e => setDateStart(e.target.value)} />
                    </div>
                  )}
                  {dateFilterType === 'range' && (
                    <div className="flex items-end gap-1">
                      <div>
                        <label className="block mb-1 text-gray-600">From</label>
                        <input type="date" className="border border-gray-300 rounded-md px-2 py-1" value={dateStart} onChange={e => setDateStart(e.target.value)} />
                      </div>
                      <div>
                        <label className="block mb-1 text-gray-600">To</label>
                        <input type="date" className="border border-gray-300 rounded-md px-2 py-1" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
                      </div>
                    </div>
                  )}
                  {dateFilterType === 'monthly' && (
                    <div>
                      <label className="block mb-1 text-gray-600">Month</label>
                      <input type="month" className="border border-gray-300 rounded-md px-2 py-1" value={monthValue} onChange={e => setMonthValue(e.target.value)} />
                    </div>
                  )}
                  {dateFilterType === 'yearly' && (
                    <div>
                      <label className="block mb-1 text-gray-600">Year</label>
                      <input type="number" className="border border-gray-300 rounded-md px-2 py-1 w-24" value={yearValue} onChange={e => setYearValue(e.target.value)} />
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md" onClick={applyFilters}>Apply</button>
                    <button className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md" onClick={clearFilters}>Clear</button>
                  </div>
                  <div className="ml-auto">
                    <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md" onClick={handlePrintPDF}>Print</button>
                  </div>
                </div>

                {doctorEntries.length === 0 ? (
                  <p className="text-sm text-gray-500 px-2 pb-2">No recent entries</p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tests</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid (₹)</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Commission (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctorEntries.map(e => {
                        const breakdown = (e.commission_breakdown || []) as number[];
                        const totalCommission = typeof e.commission_total === 'number'
                          ? e.commission_total
                          : breakdown.reduce((sum, val) => sum + val, 0);
                        const commissionDisplay =
                          breakdown.length > 1
                            ? `${totalCommission.toFixed(2)} ( ${breakdown.map(a => a.toFixed(2)).join(' + ')} )`
                            : breakdown.length === 1
                              ? breakdown[0].toFixed(2)
                              : '-';
                        return (
                          <tr key={e.id}>
                            <td className="px-3 py-1">{new Date(e.created_at).toLocaleDateString()}</td>
                            <td className="px-3 py-1">{e.patient_name}</td>
                            <td className="px-3 py-1">{e.branch_name}</td>
                            <td className="px-3 py-1 text-[10px]">{e.tests.join(', ')}</td>
                            <td className="px-3 py-1 text-right">{e.amount_paid.toFixed(2)}</td>
                            <td className="px-3 py-1 text-right">{commissionDisplay}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Bottom actions */}
              <div className="col-span-full mt-6 flex justify-end">
                <button
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={handleSaveDoctorInfo}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <p className="text-center text-sm">Loading doctor details...</p>
            </div>
          </div>
        )
      )}
    </>
  );
};

// Helper component to select a test
const TestSelect = ({ branchId, onSelect }: { branchId: number; onSelect: (test: BranchTest) => void; }) => {
  const [tests, setTests] = useState<BranchTest[]>([]);
  const [query, setQuery] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const loadTests = async () => {
      try {
        const data = await testService.getBranchTests(branchId);
        setTests(data);
      } catch (err) {
        console.error(err);
        setTests([]);
      }
    };
    loadTests();
  }, [branchId]);

  const filtered = tests.filter(t => t.test_name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative">
      <input
        type="text"
        className="border rounded px-1 py-0.5 w-full"
        value={query}
        onChange={e => { setQuery(e.target.value); setShow(true);} }
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 100)}
        placeholder="Search test"/>
      {show && filtered.length > 0 && (
        <div className="absolute z-20 bg-white border rounded w-full max-h-48 overflow-auto text-xs">
          {filtered.slice(0,30).map(t => (
            <div key={t.id} className="p-1 hover:bg-gray-100 cursor-pointer" onMouseDown={() => { onSelect(t); setQuery(t.test_name); setShow(false);} }>
              {t.test_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorsPage; 
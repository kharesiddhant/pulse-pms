'use client';

import { useState, useEffect } from 'react';
import { 
  PatientEntryFilter, 
  searchPatientsByName, 
  searchPatientsByPhone, 
  searchPatientsByUID, 
  fetchReferringDoctors,
  SearchPatient,
  ReferringDoctor
} from '../../services/reportingDoctorService';

interface PatientEntrySearchFiltersProps {
  filters: PatientEntryFilter;
  onFilterChange: (filters: PatientEntryFilter) => void;
  onClearFilters: () => void;
}

type FilterType = 'all' | 'name' | 'uid' | 'phone' | 'doctor';

interface ExtendedFilters extends PatientEntryFilter {
  date_filter_type?: string;
  date_start?: string;
  date_end?: string;
  month?: string;
  month_year?: string;
  year?: string;
  referred_by?: string;
  has_pending?: string;
  sort?: string;
  date?: string;
  patient_name?: string;
  patient_uid?: string;
  phone_number?: string;
  status?: string;
}

const PatientEntrySearchFilters: React.FC<PatientEntrySearchFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const [localFilters, setLocalFilters] = useState<ExtendedFilters>(filters);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  
  // Custom dropdown states
  const [filterTypeDropdownOpen, setFilterTypeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [paymentStatusDropdownOpen, setPaymentStatusDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [dateFilterDropdownOpen, setDateFilterDropdownOpen] = useState(false);

  // Helper to derive date filter label based on current state
  const todayStr = new Date().toISOString().split('T')[0];
  const getDateFilterLabel = () => {
    switch (localFilters.date_filter_type) {
      case 'specific':
        return localFilters.date === todayStr ? 'Today' : 'Specific Date';
      case 'monthly':
        return 'Month';
      case 'yearly':
        return 'Year';
      case 'range':
        return 'Date Range';
      default:
        return 'All Dates';
    }
  };

  const resetAllDateFields = () => {
    const updatedFilters = { ...localFilters };
    ['date', 'date_start', 'date_end', 'month', 'month_year', 'year'].forEach((field) => {
      delete updatedFilters[field as keyof ExtendedFilters];
    });
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleDateFilterSelect = (optionKey: string) => {
    const updatedFilters = { ...localFilters };
    
    // Clear all date fields first
    ['date', 'date_start', 'date_end', 'month', 'month_year', 'year'].forEach((field) => {
      delete updatedFilters[field as keyof ExtendedFilters];
    });
    
    switch (optionKey) {
      case 'today':
        updatedFilters.date_filter_type = 'specific';
        updatedFilters.date = todayStr;
        break;
      case 'specific':
        updatedFilters.date_filter_type = 'specific';
        break;
      case 'month':
        updatedFilters.date_filter_type = 'monthly';
        const today = new Date();
        updatedFilters.month = String(today.getMonth() + 1).padStart(2, '0');
        updatedFilters.month_year = String(today.getFullYear());
        break;
      case 'year':
        updatedFilters.date_filter_type = 'yearly';
        const currentYear = String(new Date().getFullYear());
        updatedFilters.year = currentYear;
        break;
      case 'range':
        updatedFilters.date_filter_type = 'range';
        break;
      default:
        updatedFilters.date_filter_type = 'all';
        break;
    }
    
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
    setDateFilterDropdownOpen(false);
  };

  const filterKeyMap: Record<string, keyof ExtendedFilters> = {
    'name': 'patient_name',
    'uid': 'patient_uid',
    'phone': 'phone_number',
    'doctor': 'referred_by'
  };

  const currentFilterKey = filterKeyMap[filterType];

  // Filter type options
  const filterTypeOptions = [
    { value: 'all', label: 'All' },
    { value: 'name', label: 'Name' },
    { value: 'uid', label: 'Patient UID' },
    { value: 'phone', label: 'Phone number' },
    { value: 'doctor', label: 'Referring Doctor' }
  ];

  // Status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Waiting', label: 'Waiting' },
    { value: 'Scanning', label: 'Scanning' },
    { value: 'Scans done', label: 'Scans done' },
    { value: 'Under reporting', label: 'Under reporting' },
    { value: 'Report ready', label: 'Report ready' },
    { value: 'Report downloaded', label: 'Report downloaded' }
  ];

  // Payment status options
  const paymentStatusOptions = [
    { value: '', label: 'All Payments' },
    { value: 'true', label: 'Pending Balance' },
    { value: 'false', label: 'No Balance' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'desc', label: 'Newest First' },
    { value: 'asc', label: 'Oldest First' }
  ];

  const handleInputChangeLocal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.length >= 2) {
      try {
        let searchResults: any[] = [];
        
        switch (filterType) {
          case 'name':
            searchResults = await searchPatientsByName(value);
            break;
          case 'phone':
            searchResults = await searchPatientsByPhone(value);
            break;
          case 'uid':
            searchResults = await searchPatientsByUID(value);
            break;
          case 'doctor':
            const doctors = await fetchReferringDoctors();
            // Filter doctors by name containing the search value
            searchResults = doctors.filter((doctor) => 
              doctor.name.toLowerCase().includes(value.toLowerCase())
            );
            break;
          default:
            searchResults = [];
        }
        
        setSuggestions(searchResults);
        setShowSuggestions(searchResults.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: any) => {
    console.log('Suggestion selected:', suggestion, 'Filter type:', filterType);
    
    let selectedValue = '';
    
    switch (filterType) {
      case 'name':
        selectedValue = suggestion.name;
        break;
      case 'phone':
        selectedValue = suggestion.phone_number;
        break;
      case 'uid':
        selectedValue = suggestion.uid || suggestion.id;
        break;
      case 'doctor':
        selectedValue = suggestion.name;
        break;
    }
    
    console.log('Selected value:', selectedValue, 'Current filter key:', currentFilterKey);
    
    setInputValue(selectedValue);
    setShowSuggestions(false);
    
    // Apply the filter
    if (currentFilterKey && selectedValue.trim() !== '') {
      const updatedFilters = { ...localFilters };
      (updatedFilters as any)[currentFilterKey] = selectedValue.trim();
      
      // Clear other search filters
      Object.keys(filterKeyMap).forEach(key => {
        if (filterKeyMap[key] !== currentFilterKey) {
          delete (updatedFilters as any)[filterKeyMap[key]];
        }
      });
      
      console.log('Updated filters:', updatedFilters);
      
      setLocalFilters(updatedFilters);
      onFilterChange(updatedFilters);
    }
  };

  const handleFilterTypeChange = (newType: string) => {
    const filterType = newType as FilterType;
    setFilterType(filterType);
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setFilterTypeDropdownOpen(false);
    
    // Clear all search filters when changing type
    const updatedFilters = { ...localFilters };
    Object.values(filterKeyMap).forEach(key => {
      delete (updatedFilters as any)[key];
    });
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentFilterKey && inputValue.trim() !== '') {
      setShowSuggestions(false);
      const updatedFilters = { ...localFilters };
      (updatedFilters as any)[currentFilterKey] = inputValue.trim();
      
      // Clear other search filters
      Object.keys(filterKeyMap).forEach(key => {
        if (filterKeyMap[key] !== currentFilterKey) {
          delete (updatedFilters as any)[filterKeyMap[key]];
        }
      });
      
      setLocalFilters(updatedFilters);
      onFilterChange(updatedFilters);
    }
  };

  const handleInputChange = (field: keyof ExtendedFilters, value: string | number) => {
    console.log(`Filter change: ${field} = ${value}`); // Debug log
    const updatedFilters = { ...localFilters, [field]: value };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handlePaymentStatusChange = (value: string) => {
    const updatedFilters = { ...localFilters, has_pending: value };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleClear = () => {
    const emptyFilters: ExtendedFilters = {};
    setLocalFilters(emptyFilters);
    setFilterType('all');
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    onClearFilters();
  };

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.filter-dropdown-container') && 
          !target.closest('#filter_value') && 
          !target.closest('.suggestions-dropdown')) {
        setFilterTypeDropdownOpen(false);
        setStatusDropdownOpen(false);
        setPaymentStatusDropdownOpen(false);
        setSortDropdownOpen(false);
        setDateFilterDropdownOpen(false);
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Search Filters</h3>
      
      {/* Add CSS for date inputs to show DD/MM/YYYY format */}
      <style jsx>{`
        input[type="date"] {
          text-align: left;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent;
          cursor: pointer;
        }
        input[type="date"]::-webkit-datetime-edit-text {
          padding: 0 1px;
        }
        input[type="date"]::-webkit-datetime-edit-day-field {
          color: inherit;
        }
        input[type="date"]::-webkit-datetime-edit-month-field {
          color: inherit;
        }
        input[type="date"]::-webkit-datetime-edit-year-field {
          color: inherit;
        }
        /* Force DD/MM/YYYY display format in supported browsers */
        input[type="date"]::-webkit-datetime-edit {
          display: flex;
          flex-direction: row-reverse;
        }
        input[type="date"]::-webkit-datetime-edit-fields-wrapper {
          display: flex;
          flex-direction: row-reverse;
        }
        /* Improve date picker visibility */
        .date-input {
          position: relative;
          z-index: 10;
        }
        .date-input input[type="date"] {
          cursor: pointer;
          padding: 8px 12px;
          min-height: 42px;
        }
      `}</style>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
        {/* Search Input with Filter Type */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1" htmlFor="filter_value">Search</label>
          <div className="flex gap-2">
            {filterType !== 'all' && (
              <div className="relative flex-1" style={{ minWidth: 180 }}>
                <input 
                  id="filter_value" 
                  name="filter_value" 
                  type="text" 
                  className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                  value={inputValue} 
                  onChange={handleInputChangeLocal} 
                  onKeyDown={handleInputKeyDown} 
                  placeholder={`Search by ${filterType}`} 
                  autoComplete="off"
                />
                
                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="suggestions-dropdown absolute z-30 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-700 dark:text-gray-300"
                        onClick={() => handleSuggestionSelect(item)}
                      >
                        {filterType === 'name' && (
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {item.phone_number} • {item.gender}, {item.age}
                            </div>
                          </div>
                        )}
                        {filterType === 'phone' && (
                          <div>
                            <div className="font-medium">{item.phone_number}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {item.name} • {item.gender}, {item.age}
                            </div>
                          </div>
                        )}
                        {filterType === 'uid' && (
                          <div>
                            <div className="font-medium">{item.uid || item.id}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {item.name} • {item.phone_number}
                            </div>
                          </div>
                        )}
                        {filterType === 'doctor' && (
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {item.speciality && `${item.speciality} • `}
                              {item.area && `${item.area} • `}
                              {item.phone_number}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Custom Filter Type Dropdown */}
            <div className="relative filter-dropdown-container min-w-[90px]">
              <div
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 cursor-pointer flex justify-between items-center h-[42px]"
                onClick={() => setFilterTypeDropdownOpen(!filterTypeDropdownOpen)}
              >
                <span className="text-sm">
                  {filterTypeOptions.find(opt => opt.value === filterType)?.label || 'All'}
                </span>
                <svg className={`w-4 h-4 transition-transform ${filterTypeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {filterTypeDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filterTypeOptions.map(option => (
                    <div
                      key={option.value}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-700 dark:text-gray-300 text-sm"
                      onClick={() => handleFilterTypeChange(option.value)}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Date Filter Dropdown */}
        <div className="col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1">Date Filter</label>
          <div className="relative filter-dropdown-container">
            <div
              className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 cursor-pointer flex justify-between items-center h-[42px]"
              onClick={() => setDateFilterDropdownOpen(!dateFilterDropdownOpen)}
            >
              <span className="truncate">{getDateFilterLabel()}</span>
              <svg className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${dateFilterDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {dateFilterDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {[
                  { key: 'today', label: 'Today' },
                  { key: 'specific', label: 'Specific Date' },
                  { key: 'month', label: 'Month' },
                  { key: 'year', label: 'Year' },
                  { key: 'range', label: 'Date Range' },
                  { key: 'all', label: 'All Dates' },
                ].map(option => (
                  <div
                    key={option.key}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-700 dark:text-gray-300"
                    onClick={() => handleDateFilterSelect(option.key)}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional inputs based on date filter type */}
          {localFilters.date_filter_type === 'specific' && (
            <div className="mt-2">
              <input
                type="date"
                value={localFilters.date || ''}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                style={{ colorScheme: 'light' }}
              />
            </div>
          )}
          {localFilters.date_filter_type === 'monthly' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <select
                className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                value={localFilters.month || String(new Date().getMonth() + 1).padStart(2,'0')}
                onChange={(e) => handleInputChange('month', e.target.value)}
              >
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, idx) => (
                  <option key={idx+1} value={String(idx+1).padStart(2,'0')}>{m}</option>
                ))}
              </select>
              <select
                className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                value={localFilters.month_year || String(new Date().getFullYear())}
                onChange={(e) => handleInputChange('month_year', e.target.value)}
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          )}
          {localFilters.date_filter_type === 'yearly' && (
            <div className="mt-2">
              <select
                className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                value={localFilters.year || String(new Date().getFullYear())}
                onChange={(e) => handleInputChange('year', e.target.value)}
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          )}
          {localFilters.date_filter_type === 'range' && (
            <div className="space-y-2 mt-2">
              <input
                type="date"
                value={localFilters.date_start || ''}
                onChange={(e) => handleInputChange('date_start', e.target.value)}
                className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                placeholder="Start Date"
                style={{ colorScheme: 'light' }}
              />
              <input
                type="date"
                value={localFilters.date_end || ''}
                onChange={(e) => handleInputChange('date_end', e.target.value)}
                className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                placeholder="End Date"
                style={{ colorScheme: 'light' }}
              />
            </div>
          )}
        </div>
        
        {/* Custom Status Dropdown */}
        <div className="col-span-1">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1">Status</label>
          <div className="relative filter-dropdown-container">
            <div
              className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 cursor-pointer flex justify-between items-center h-[42px]"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            >
              <span className="truncate">
                {statusOptions.find(opt => opt.value === localFilters.status)?.label || 'All Statuses'}
              </span>
              <svg className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${statusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {statusDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {statusOptions.map(option => (
                  <div
                    key={option.value}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-700 dark:text-gray-300"
                    onClick={() => {
                      handleInputChange('status', option.value);
                      setStatusDropdownOpen(false);
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Custom Payment Status Dropdown */}
        <div className="col-span-1">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1">Payment Status</label>
          <div className="relative filter-dropdown-container">
            <div
              className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 cursor-pointer flex justify-between items-center h-[42px]"
              onClick={() => setPaymentStatusDropdownOpen(!paymentStatusDropdownOpen)}
            >
              <span className="truncate">
                {paymentStatusOptions.find(opt => opt.value === localFilters.has_pending)?.label || 'All Payments'}
              </span>
              <svg className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${paymentStatusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {paymentStatusDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {paymentStatusOptions.map(option => (
                  <div
                    key={option.value}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-700 dark:text-gray-300"
                    onClick={() => {
                      handlePaymentStatusChange(option.value);
                      setPaymentStatusDropdownOpen(false);
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Custom Sort Order Dropdown */}
        <div className="col-span-1">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1">Sort Order</label>
          <div className="relative filter-dropdown-container">
            <div
              className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 cursor-pointer flex justify-between items-center h-[42px]"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            >
              <span className="truncate">
                {sortOptions.find(opt => opt.value === localFilters.sort)?.label || 'Newest First'}
              </span>
              <svg className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {sortDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {sortOptions.map(option => (
                  <div
                    key={option.value}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-700 dark:text-gray-300"
                    onClick={() => {
                      handleInputChange('sort', option.value);
                      setSortDropdownOpen(false);
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clear Button */}
        <div className="col-span-1">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1">&nbsp;</label>
          <button
            onClick={handleClear}
            className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors duration-200 whitespace-nowrap h-[42px]"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientEntrySearchFilters; 
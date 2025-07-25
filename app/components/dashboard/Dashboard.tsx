'use client';

import React, { useState, useEffect } from 'react';
import SubscriptionInfo from './SubscriptionInfo';
import StatCard from './StatCard';
import DashboardFilter from './DashboardFilter';
import BranchPerformanceChart from './BranchPerformanceChart';
import { dashboardService, DashboardParams, Revenue, PatientEntries, AffiliatedHospitalAmount, ReportsPendingAssignment, WalkinPendingAmount } from '@/services/dashboardService';

interface Subscription {
  planType: 'annual' | 'half-yearly' | 'monthly';
  planStartDate: string;
  planEndDate: string;
}

async function fetchSubscriptionData(organizationId: number): Promise<Subscription> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        planType: 'annual',
        planStartDate: '2024-07-05',
        planEndDate: '2026-07-04',
      });
    }, 1200);
  });
}

const Dashboard = () => {
  // States for dashboard stats
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [walkinPending, setWalkinPending] = useState<WalkinPendingAmount | null>(null);
  const [patientEntries, setPatientEntries] = useState<PatientEntries | null>(null);
  const [affiliatedHospitalAmount, setAffiliatedHospitalAmount] = useState<AffiliatedHospitalAmount | null>(null);
  const [reportsPending, setReportsPending] = useState<ReportsPendingAssignment | null>(null);
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [filterParams, setFilterParams] = useState<DashboardParams>({});

  useEffect(() => {
    if (!subscription) {
      setIsLoadingSubscription(true);
    }
    fetchDashboardData(filterParams);
  }, [filterParams]);

  const fetchDashboardData = async (params: DashboardParams) => {
    try {
      setIsLoadingStats(true);
      const response = await dashboardService.getDashboardData(params);
      
      if (response.success) {
        setRevenue(response.data.revenue);
        setWalkinPending(response.data.walkin_pending_amount);
        setPatientEntries(response.data.patient_entries);
        setAffiliatedHospitalAmount(response.data.affiliated_hospital_amount);
        setReportsPending(response.data.reports_pending_assignment);
        
        if (!subscription && response.data.organization_id) {
          fetchSubscriptionData(response.data.organization_id)
            .then(subData => setSubscription(subData))
            .catch(error => console.error('Failed to fetch subscription data:', error))
            .finally(() => setIsLoadingSubscription(false));
        }
      } else {
        console.error('Failed to fetch dashboard data:', response.message);
        if (isLoadingSubscription) setIsLoadingSubscription(false);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (isLoadingSubscription) setIsLoadingSubscription(false);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleFilterChange = (params: DashboardParams) => {
    setFilterParams(params);
  };

  const formatPeriod = (period: string) => {
    switch (period) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      case 'lifetime': return 'All Time';
      default: return 'All Time';
    }
  };

  return (
    <>
      <header className="mb-8 flex flex-wrap justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Track the performance of your branches</p>
        </div>
        <div className="w-full md:w-auto mt-4 md:mt-0">
          {isLoadingSubscription ? (
            <SubscriptionInfo.Skeleton />
          ) : subscription ? (
            <SubscriptionInfo
              planType={subscription.planType}
              planStartDate={subscription.planStartDate}
              planEndDate={subscription.planEndDate}
            />
          ) : null}
        </div>
      </header>
      
      <DashboardFilter onFilterChange={handleFilterChange} />
      
      {/* --- MODIFIED grid to support five cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title={`Total Revenue (${revenue ? formatPeriod(revenue.period) : ''})`}
          value={revenue?.total || 0}
          formatAsCurrency={true}
          color="green"
          isLoading={isLoadingStats}
        />
        {/* --- ADDED the new StatCard for Walk-in Pending Amount --- */}
        <StatCard
          title={`Walk-in Pending (${walkinPending ? formatPeriod(walkinPending.period) : ''})`}
          value={walkinPending?.total || 0}
          formatAsCurrency={true}
          color="purple"
          isLoading={isLoadingStats}
        />
        <StatCard
          title={`Patient Entries (${patientEntries ? formatPeriod(patientEntries.period) : ''})`}
          value={patientEntries?.total || 0}
          color="blue"
          isLoading={isLoadingStats}
        />
        <StatCard
          title={`Affiliated Hospital Amount (${affiliatedHospitalAmount ? formatPeriod(affiliatedHospitalAmount.period) : ''})`}
          value={affiliatedHospitalAmount?.total || 0}
          formatAsCurrency={true}
          color="red"
          isLoading={isLoadingStats}
        />
        <StatCard
          title="Reports Pending Assignment"
          value={reportsPending?.total || 0}
          color="yellow"
          isLoading={isLoadingStats}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          }
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          <BranchPerformanceChart filterParams={filterParams} />
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Recent Updates</h2>
            <p className="text-gray-500 dark:text-gray-400">Updates will go here</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
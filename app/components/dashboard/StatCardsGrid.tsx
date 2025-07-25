'use client';

import React from 'react';
import StatCard from './StatCard';

const StatCardsGrid = () => {
  const stats = [
    { title: 'Total Revenue', value: '₹0' },
    { title: 'Commissions', value: '₹0' },
    { title: 'Affiliated Hospital Amount', value: '₹0' },
    { title: 'Employee Count', value: '0' },
    { title: 'Test Entries', value: '0' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={index} title={stat.title} value={stat.value} />
      ))}
    </div>
  );
};

export default StatCardsGrid; 
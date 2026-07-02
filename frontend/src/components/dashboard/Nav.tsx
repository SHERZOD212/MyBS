'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export type PageTab =
  | 'daily'
  | 'shtraf'
  | 'vse-voditeli'
  | 'vse-avtobusi'
  | 'tech'
  | 'zarplata'
  | 'rabochee-vremya';

interface NavProps {
  activeTab: PageTab;
  setActiveTab: (tab: PageTab) => void;
}

export default function Nav({ activeTab, setActiveTab }: NavProps) {
  const { t } = useApp();

  const navItems: { id: PageTab; labelKey: string }[] = [
    { id: 'daily', labelKey: 'navSchedule' },
    { id: 'shtraf', labelKey: 'navFines' },
    { id: 'vse-voditeli', labelKey: 'navDrivers' },
    { id: 'vse-avtobusi', labelKey: 'navBuses' },
    { id: 'tech', labelKey: 'navTech' },
    { id: 'zarplata', labelKey: 'navSalary' },
    { id: 'rabochee-vremya', labelKey: 'navHours' },
  ];

  return (
    <div className="nav-wrap" id="main-nav">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}
        >
          {t(item.labelKey)}
        </button>
      ))}
    </div>
  );
}

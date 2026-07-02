'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import AuthScreen from '@/components/auth/AuthScreen';
import Header from '@/components/dashboard/Header';
import Nav, { PageTab } from '@/components/dashboard/Nav';
import DailySchedule from '@/components/dashboard/DailySchedule';
import Fines from '@/components/dashboard/Fines';
import Drivers from '@/components/dashboard/Drivers';
import Buses from '@/components/dashboard/Buses';
import Technical from '@/components/dashboard/Technical';
import Salaries from '@/components/dashboard/Salaries';
import WorkingHours from '@/components/dashboard/WorkingHours';

export default function Home() {
  const { isAuthenticated } = useApp();
  const [activeTab, setActiveTab] = useState<PageTab>('daily');

  // Render auth screen if user is not logged in
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Render dashboard tab based on selection
  const renderTabContent = () => {
    switch (activeTab) {
      case 'daily':
        return <DailySchedule />;
      case 'shtraf':
        return <Fines />;
      case 'vse-voditeli':
        return <Drivers />;
      case 'vse-avtobusi':
        return <Buses />;
      case 'tech':
        return <Technical />;
      case 'zarplata':
        return <Salaries />;
      case 'rabochee-vremya':
        return <WorkingHours />;
      default:
        return <DailySchedule />;
    }
  };

  return (
    <div>
      {/* Top navbar */}
      <Header />

      {/* Horizontal Nav Tabs */}
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <div className="main-container">
        <main className="main">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}

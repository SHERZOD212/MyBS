'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import api from '@/services/api';
import { TechnicalStatus } from '@/types';

export default function Technical() {
  const { lang, t } = useApp();
  const [techList, setTechList] = useState<TechnicalStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'tires' | 'brakes'>('tires');

  const fetchTech = async () => {
    setLoading(true);
    try {
      const response = await api.get('/technical-statuses/');
      setTechList(response.data);
    } catch (error) {
      console.error('Failed to fetch technical status list', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTech();
  }, []);

  const tiresList = techList.filter((item) => item.category === 'tires' || !item.category);
  const brakesList = techList.filter((item) => item.category === 'brakes');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'var(--green)';
      case 'warn':
        return 'var(--accent)';
      case 'danger':
      case 'repair':
        return 'var(--red)';
      default:
        return 'var(--muted)';
    }
  };

  const renderList = (items: TechnicalStatus[]) => {
    if (loading) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
          {lang === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...'}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
          {lang === 'ru' ? 'Записей нет' : 'Yozuvlar topilmadi'}
        </div>
      );
    }

    return (
      <div className="tech-list-grid">
        {items.map((item) => {
          const busName = item.bus_display || 
            (typeof item.bus === 'object' && item.bus !== null ? item.bus.num : `Bus ID: ${item.bus}`);
          const statusText = item.status_display || item.status;
          
          return (
            <div key={item.id} className="tech-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="bus-num">{busName}</span>
                <span 
                  style={{ 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    color: getStatusColor(item.status),
                    textTransform: 'uppercase',
                    background: `${getStatusColor(item.status)}15`,
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}
                >
                  {statusText}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                <strong>{t('kmLeft')}:</strong> {item.km_left !== undefined ? `${item.km_left.toLocaleString()} km` : 'Yaxshi'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>
                {lang === 'ru' ? 'Последний осмотр:' : 'Oxirgi koʻrik:'} {item.last_service_date}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            Technical <span>Control</span>
          </h2>
          <div className="page-sub">
            {lang === 'ru'
              ? 'Мониторинг износа шин и тормозных систем автопарка'
              : 'Avtotransport vositalarining shinalari va tormoz tizimlari monitoringi'}
          </div>
        </div>
      </div>

      {/* Sub tabs switcher */}
      <div className="subtabs">
        <button
          className={`stab ${activeSubTab === 'tires' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('tires')}
        >
          {t('tiresTab')}
        </button>
        <button
          className={`stab ${activeSubTab === 'brakes' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('brakes')}
        >
          {t('brakesTab')}
        </button>
      </div>

      {/* Content area */}
      <div className="table-card" style={{ padding: '24px' }}>
        {activeSubTab === 'tires' ? renderList(tiresList) : renderList(brakesList)}
      </div>
    </div>
  );
}

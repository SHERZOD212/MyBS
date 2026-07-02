'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import api from '@/services/api';
import Modal from '../ui/Modal';
import Card from '../ui/Card';

export default function DailySchedule() {
  const { drivers, refreshDrivers, t, lang } = useApp();
  const [selectedDate, setSelectedDate] = useState('');
  const [isEvenDay, setIsEvenDay] = useState(false);
  
  // Modal states
  const [editingDriver, setEditingDriver] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('18:00');
  const [modalLoading, setModalLoading] = useState(false);

  // Initialize date to today on load
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  // Update Juft/Toq indicator based on selectedDate
  useEffect(() => {
    if (selectedDate) {
      const dateNum = new Date(selectedDate).getDate();
      setIsEvenDay(dateNum % 2 === 0);
    }
  }, [selectedDate]);

  // Calculations
  const targetSchedule = isEvenDay ? 'even' : 'odd';
  let onlineCount = 0;
  let totalDrivers = drivers.length;
  let inRepairCount = 0;

  const processedDrivers = drivers.map((driver) => {
    let status = driver.black ? t('statusBlocked') : t('statusResting');
    
    // Check if the driver is on route
    // Driver can be associated with a Bus object or just ID
    const hasBus = !!driver.bus;
    
    if (hasBus && driver.schedule === targetSchedule && !driver.black) {
      status = t('statusOnRoute');
      onlineCount++;
    } else if (driver.black) {
      inRepairCount++;
    }

    return {
      ...driver,
      computedStatus: status,
    };
  });

  const handleOpenEditModal = (driverId: number, shiftStr?: string) => {
    setEditingDriver(driverId);
    if (shiftStr && shiftStr.includes(' - ')) {
      const parts = shiftStr.split(' - ');
      setStartTime(parts[0] || '06:00');
      setEndTime(parts[1] || '18:00');
    } else {
      setStartTime('06:00');
      setEndTime('18:00');
    }
  };

  const handleSaveShift = async () => {
    if (!editingDriver) return;
    setModalLoading(true);
    try {
      const response = await api.patch(`/drivers/${editingDriver}/`, {
        shift: `${startTime} - ${endTime}`,
      });
      if (response.status === 200) {
        await refreshDrivers();
        setEditingDriver(null);
      }
    } catch (error) {
      console.error('Failed to update driver shift', error);
      alert('Smenani yangilashda xatolik yuz berdi.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            {lang === 'ru' ? (
              <>
                Расписание <span>рейсов</span>
              </>
            ) : (
              <>
                Yoʻnalishlar <span>jadvali</span>
              </>
            )}
          </h2>
          <div className="page-sub">{t('scheduleSub')}</div>
        </div>
      </div>

      {/* Date Filter & Indicator Panel */}
      <div className="filter-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 'bold' }}>{t('selectDate')}:</label>
          <input
            type="date"
            className="ctrl-input"
            style={{ width: '200px' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div
          id="day-type-indicator"
          style={{
            fontWeight: '700',
            fontSize: '16px',
            color: isEvenDay ? 'var(--green)' : 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {isEvenDay ? t('evenDay') : t('oddDay')}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="metrics">
        <Card title={t('metricOnline')} value={onlineCount} color="green" />
        <Card title={t('metricDrivers')} value={totalDrivers} />
        <Card title={t('metricRoutes')} value={3} />
        <Card title={t('metricRepair')} value={inRepairCount} color="red" />
      </div>

      {/* Schedule Table */}
      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('colDriver')}</th>
                <th>{t('colBusNum')}</th>
                <th>{t('colRoute')}</th>
                <th>{t('colShift')}</th>
                <th>{t('colDayType')}</th>
                <th>{t('colStatus')}</th>
                <th className="actions-cell">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {processedDrivers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    {lang === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...'}
                  </td>
                </tr>
              ) : (
                processedDrivers.map((driver) => {
                  const busData = typeof driver.bus === 'object' && driver.bus !== null ? driver.bus : null;
                  const busNumber = busData ? busData.num : 'Biriktirilmagan';
                  const routeName = busData ? busData.route : '-';
                  const isOnline = driver.computedStatus === t('statusOnRoute');
                  const isBlocked = driver.computedStatus === t('statusBlocked');

                  let badgeClass = 'cancel';
                  if (isOnline) badgeClass = 'btn-edit';
                  if (isBlocked) badgeClass = 'btn-delete';

                  return (
                    <tr key={driver.id}>
                      <td>
                        <strong>{driver.name}</strong>
                      </td>
                      <td>
                        <span className="bus-num">{busNumber}</span>
                      </td>
                      <td>{routeName}</td>
                      <td>{driver.shift || '06:00 - 18:00'}</td>
                      <td>{driver.schedule === 'even' ? 'Juft kunlar' : 'Toq kunlar'}</td>
                      <td>
                        <span className={`modal-btn ${badgeClass}`} style={{ padding: '4px 10px', fontSize: '12px' }}>
                          {driver.computedStatus}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleOpenEditModal(driver.id, driver.shift)}
                        >
                          {t('btnEditShift')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Shift Modal */}
      {editingDriver !== null && (
        <Modal
          title={lang === 'ru' ? 'Изменить рейс (Смену)' : 'Reysni oʻzgartirish (Smena)'}
          onClose={() => setEditingDriver(null)}
        >
          <div className="time-range-group">
            <div className="input-group">
              <label>{lang === 'ru' ? 'Время начала:' : 'Boshlanish vaqti:'}</label>
              <input
                type="time"
                className="ctrl-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>{lang === 'ru' ? 'Время конца:' : 'Tugash vaqti:'}</label>
              <input
                type="time"
                className="ctrl-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="modal-btn cancel-btn" onClick={() => setEditingDriver(null)}>
              {t('btnCancel')}
            </button>
            <button className="modal-btn save primary-btn" onClick={handleSaveShift} disabled={modalLoading}>
              {modalLoading ? '...' : t('btnSave')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

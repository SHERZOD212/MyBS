'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import api from '@/services/api';
import Modal from '../ui/Modal';
import Card from '../ui/Card';

export default function DailySchedule() {
  const { drivers, refreshDrivers, buses, t, lang } = useApp();
  const [selectedDate, setSelectedDate] = useState('');
  const [isEvenDay, setIsEvenDay] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'even' | 'odd' | 'all'>('even');
  
  // Modal states
  const [editingDriver, setEditingDriver] = useState<number | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverBus, setDriverBus] = useState('');
  const [driverSchedule, setDriverSchedule] = useState<'even' | 'odd'>('even');
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('18:00');
  const [driverBlack, setDriverBlack] = useState(false);
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
      const isEven = dateNum % 2 === 0;
      setIsEvenDay(isEven);
      setActiveSubTab(isEven ? 'even' : 'odd');
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

  const filteredDrivers = processedDrivers.filter(
    (driver) => activeSubTab === 'all' ? true : driver.schedule === activeSubTab
  );

  const handleOpenEditModal = (driver: any) => {
    setEditingDriver(driver.id);
    setDriverName(driver.name || '');
    setDriverPhone(driver.phone || '');
    const busId = typeof driver.bus === 'object' && driver.bus !== null ? driver.bus.id : driver.bus;
    setDriverBus(busId ? String(busId) : '');
    setDriverSchedule(driver.schedule || 'even');
    
    if (driver.shift_start) {
      setStartTime(driver.shift_start.substring(0, 5));
    } else {
      setStartTime('06:00');
    }
    if (driver.shift_end) {
      setEndTime(driver.shift_end.substring(0, 5));
    } else {
      setEndTime('18:00');
    }
    setDriverBlack(driver.black || false);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    setModalLoading(true);
    try {
      const response = await api.put(`/drivers/${editingDriver}/`, {
        name: driverName,
        phone: driverPhone,
        bus: driverBus ? parseInt(driverBus) : null,
        schedule: driverSchedule,
        shift_start: startTime + ':00',
        shift_end: endTime + ':00',
        black: driverBlack,
      });
      if (response.status === 200) {
        await refreshDrivers();
        setEditingDriver(null);
      }
    } catch (error: any) {
      console.error('Failed to update driver', error);
      alert('Haydovchini yangilashda xatolik yuz berdi: ' + JSON.stringify(error.response?.data || error.message));
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteDriver = async (id: number) => {
    const confirmed = window.confirm(
      lang === 'ru'
        ? 'Вы уверены, что хотите удалить этого водителя?'
        : 'Ushbu haydovchini oʻchirishni xohlaysizmi?'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/drivers/${id}/`);
      await refreshDrivers();
    } catch (error) {
      console.error('Failed to delete driver', error);
      alert('Oʻchirishda xatolik yuz berdi.');
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

      {/* Even/Odd Subtabs Switcher */}
      <div className="subtabs">
        <button
          className={`stab ${activeSubTab === 'even' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('even')}
        >
          {lang === 'ru' ? 'Четные дни' : 'Juft kunlar grafigi'}
        </button>
        <button
          className={`stab ${activeSubTab === 'odd' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('odd')}
        >
          {lang === 'ru' ? 'Нечетные дни' : 'Toq kunlar grafigi'}
        </button>
        <button
          className={`stab ${activeSubTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('all')}
        >
          {lang === 'ru' ? 'Все дни' : 'Hamma kunlar grafigi'}
        </button>
      </div>

      {/* Schedule Table */}
      <div className="table-card" style={{ marginTop: '16px' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>№</th>
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
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                    {lang === 'ru' ? 'Нет записей для этой группы' : 'Ushbu guruh uchun yozuvlar mavjud emas'}
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver, idx) => {
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
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
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
                      <td className="actions-cell" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleOpenEditModal(driver)}
                        >
                          {t('btnEdit')}
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteDriver(driver.id)}
                        >
                          {t('btnDelete')}
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

      {/* Edit Driver/Shift Modal */}
      {editingDriver !== null && (
        <Modal
          title={lang === 'ru' ? 'Редактировать водителя и рейс' : 'Haydovchi va reysni tahrirlash'}
          onClose={() => setEditingDriver(null)}
        >
          <form onSubmit={handleSaveDriver}>
            <div className="input-group">
              <label>{lang === 'ru' ? 'Имя Фамилия:' : 'Ism Familiya:'}</label>
              <input
                type="text"
                className="ctrl-input"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>{lang === 'ru' ? 'Телефон:' : 'Telefon:'}</label>
              <input
                type="text"
                className="ctrl-input"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>{lang === 'ru' ? 'Автобус:' : 'Avtobus:'}</label>
                <select
                  className="ctrl-input"
                  value={driverBus}
                  onChange={(e) => setDriverBus(e.target.value)}
                >
                  <option value="">{lang === 'ru' ? 'Не выбран' : 'Tanlanmagan'}</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.num} ({b.route})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group" style={{ flex: 1 }}>
                <label>{lang === 'ru' ? 'График:' : 'Grafik:'}</label>
                <select
                  className="ctrl-input"
                  value={driverSchedule}
                  onChange={(e) => setDriverSchedule(e.target.value as any)}
                >
                  <option value="even">{lang === 'ru' ? 'Четные дни' : 'Juft kunlar'}</option>
                  <option value="odd">{lang === 'ru' ? 'Нечетные дни' : 'Toq kunlar'}</option>
                </select>
              </div>
            </div>

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

            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
              <input
                type="checkbox"
                id="driver-black-checkbox"
                checked={driverBlack}
                onChange={(e) => setDriverBlack(e.target.checked)}
              />
              <label htmlFor="driver-black-checkbox" style={{ margin: 0, cursor: 'pointer' }}>
                {lang === 'ru' ? 'Заблокирован / В ремонте' : 'Bloklangan / Taʼmirlashda'}
              </label>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="modal-btn cancel-btn" onClick={() => setEditingDriver(null)}>
                {t('btnCancel')}
              </button>
              <button type="submit" disabled={modalLoading} className="modal-btn save primary-btn">
                {modalLoading ? '...' : t('btnSave')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

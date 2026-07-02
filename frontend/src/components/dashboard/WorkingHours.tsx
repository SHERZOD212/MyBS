'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import api from '@/services/api';
import { WorkAttendance } from '@/types';
import Modal from '../ui/Modal';

export default function WorkingHours() {
  const { lang, t, refreshDrivers } = useApp();
  const [attendances, setAttendances] = useState<WorkAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('5'); // Default is June (index 5)

  // Shift Edit Modal States
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('18:00');
  const [modalLoading, setModalLoading] = useState(false);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const response = await api.get('/work-attendances/', {
        params: {
          year: selectedYear,
          month: selectedMonth
        }
      });
      setAttendances(response.data);
    } catch (error) {
      console.error('Failed to fetch attendances list', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [selectedYear, selectedMonth]);

  const handleOpenEditModal = (driverId: number, shiftStr?: string) => {
    setEditingDriverId(driverId);
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
    if (!editingDriverId) return;
    setModalLoading(true);
    try {
      const response = await api.patch(`/drivers/${editingDriverId}/`, {
        shift: `${startTime} - ${endTime}`,
      });
      if (response.status === 200) {
        await refreshDrivers();
        await fetchAttendances();
        setEditingDriverId(null);
      }
    } catch (error) {
      console.error('Failed to update driver shift from attendance', error);
      alert('Smenani yangilashda xatolik yuz berdi.');
    } finally {
      setModalLoading(false);
    }
  };

  const monthsList = [
    { value: '0', label: { ru: 'Январь', uz: 'Yanvar' } },
    { value: '1', label: { ru: 'Февраль', uz: 'Fevral' } },
    { value: '2', label: { ru: 'Март', uz: 'Mart' } },
    { value: '3', label: { ru: 'Апрель', uz: 'Aprel' } },
    { value: '4', label: { ru: 'Май', uz: 'May' } },
    { value: '5', label: { ru: 'Июнь', uz: 'Iyun' } },
    { value: '6', label: { ru: 'Июль', uz: 'Iyul' } },
    { value: '7', label: { ru: 'Август', uz: 'Avgust' } },
    { value: '8', label: { ru: 'Сентябрь', uz: 'Sentabr' } },
    { value: '9', label: { ru: 'Октябрь', uz: 'Oktabr' } },
    { value: '10', label: { ru: 'Ноябрь', uz: 'Noyabr' } },
    { value: '11', label: { ru: 'Декабрь', uz: 'Dekabr' } },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            {lang === 'ru' ? (
              <>
                Рабочее <span>время</span>
              </>
            ) : (
              <>
                Ish vaqti <span>nazorati</span>
              </>
            )}
          </h2>
          <div className="page-sub">
            {lang === 'ru'
              ? 'Учет запланированного и отработанного времени водителей'
              : 'Haydovchilarning rejalashtirilgan va haqiqiy ishlagan soatlari tabeli'}
          </div>
        </div>
      </div>

      {/* Date Filters Panel */}
      <div className="filter-container">
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            className="ctrl-input"
            style={{ width: '150px' }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="2026">2026 yil</option>
            <option value="2027">2027 yil</option>
          </select>
          
          <select
            className="ctrl-input"
            style={{ width: '160px' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label[lang]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>№</th>
                <th>{t('colBusNum')}</th>
                <th>{t('hoursGraph')}</th>
                <th>{t('colDriver')}</th>
                <th>{t('hoursStart')}</th>
                <th>{t('hoursEnd')}</th>
                <th>{t('hoursWorked')}</th>
                <th className="actions-cell">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    {lang === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...'}
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    {lang === 'ru' ? 'Данные посещаемости не найдены' : 'Ish vaqti maʻlumotlari topilmadi'}
                  </td>
                </tr>
              ) : (
                attendances.map((att, idx) => {
                  const driverObj = typeof att.driver === 'object' && att.driver !== null ? att.driver : null;
                  const driverName = att.driver_display || (driverObj ? driverObj.name : `Driver ID: ${att.driver}`);
                  
                  // Extract bus info from driver object if available
                  const busObj = driverObj && typeof driverObj.bus === 'object' ? driverObj.bus : null;
                  const busNum = busObj ? busObj.num : 'M-NavBatch';
                  const schedule = driverObj ? driverObj.schedule : 'even';
                  const shift = driverObj ? driverObj.shift : '06:00 - 18:00';

                  return (
                    <tr key={att.id}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                      <td>
                        <span className="bus-num">{busNum}</span>
                      </td>
                      <td>{schedule === 'even' ? 'Juft kunlar' : 'Toq kunlar'}</td>
                      <td>
                        <strong>{driverName}</strong>
                      </td>
                      <td>{att.check_in || '06:00'}</td>
                      <td>{att.check_out || '22:30'}</td>
                      <td style={{ fontWeight: '600' }}>{att.actual_hours || 168} {t('hoursUnit')}</td>
                      <td className="actions-cell">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => {
                            if (driverObj) {
                              handleOpenEditModal(driverObj.id, shift);
                            } else if (typeof att.driver === 'number') {
                              handleOpenEditModal(att.driver, shift);
                            }
                          }}
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

      {/* Edit Shift Modal (copied from schedule for ease of navigation) */}
      {editingDriverId !== null && (
        <Modal
          title={lang === 'ru' ? 'Изменить рейс (Смену)' : 'Reysni oʻzgartirish (Smena)'}
          onClose={() => setEditingDriverId(null)}
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
            <button className="modal-btn cancel-btn" onClick={() => setEditingDriverId(null)}>
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

'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import api from '@/services/api';
import { WorkAttendance } from '@/types';
import Modal from '../ui/Modal';

export default function WorkingHours() {
  const { lang, t, refreshDrivers, drivers, buses } = useApp();
  const [attendances, setAttendances] = useState<WorkAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('5'); // Default is June (index 5)
  const [selectedBusId, setSelectedBusId] = useState('all');
  const [selectedSchedule, setSelectedSchedule] = useState('all');

  // Shift Edit Modal States (for editing Driver's default shift)
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('18:00');
  const [driverBusId, setDriverBusId] = useState('');
  const [driverSchedule, setDriverSchedule] = useState<'even' | 'odd'>('even');
  const [modalLoading, setModalLoading] = useState(false);

  // Attendance Add/Edit Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [attendanceBusId, setAttendanceBusId] = useState('');
  const [attendanceSchedule, setAttendanceSchedule] = useState<'even' | 'odd'>('even');
  const [attendanceDate, setAttendanceDate] = useState('');
  const [plannedHours, setPlannedHours] = useState('8');
  const [actualHours, setActualHours] = useState('8');
  const [attendanceStatus, setAttendanceStatus] = useState('Ishda');
  const [checkIn, setCheckIn] = useState('06:00');
  const [checkOut, setCheckOut] = useState('22:30');
  const [saveLoading, setSaveLoading] = useState(false);

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
    const drv = drivers.find((d) => d.id === driverId);
    if (drv) {
      const busObj = drv.bus && typeof drv.bus === 'object' ? drv.bus : null;
      const busId = busObj ? busObj.id : (drv.bus || '');
      setDriverBusId(busId ? String(busId) : '');
      setDriverSchedule(drv.schedule || 'even');
    } else {
      setDriverBusId('');
      setDriverSchedule('even');
    }
  };

  const handleSaveShift = async () => {
    if (!editingDriverId) return;
    setModalLoading(true);
    try {
      const response = await api.patch(`/drivers/${editingDriverId}/`, {
        shift: `${startTime} - ${endTime}`,
        bus: driverBusId ? parseInt(driverBusId) : null,
        schedule: driverSchedule,
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

  // CRUD for work attendance
  const handleOpenAdd = () => {
    setEditingId(null);
    const initialDriver = drivers.length > 0 ? drivers[0] : null;
    const initialDriverIdStr = initialDriver ? String(initialDriver.id) : '';
    setSelectedDriverId(initialDriverIdStr);

    if (initialDriver) {
      const busObj = initialDriver.bus && typeof initialDriver.bus === 'object' ? initialDriver.bus : null;
      const busId = busObj ? busObj.id : (initialDriver.bus || '');
      setAttendanceBusId(busId ? String(busId) : '');
      setAttendanceSchedule(initialDriver.schedule || 'even');
    } else {
      setAttendanceBusId('');
      setAttendanceSchedule('even');
    }

    setAttendanceDate(new Date().toISOString().split('T')[0]);
    setPlannedHours('8');
    setActualHours('8');
    setAttendanceStatus('Ishda');
    setCheckIn('06:00');
    setCheckOut('22:30');
    setModalOpen(true);
  };

  const handleOpenEdit = (att: WorkAttendance) => {
    setEditingId(att.id);
    const driverObj = typeof att.driver === 'object' && att.driver !== null ? att.driver : null;
    const driverId = driverObj ? driverObj.id : att.driver;
    setSelectedDriverId(String(driverId));

    const drv = drivers.find((d) => d.id === driverId);
    if (drv) {
      const busObj = drv.bus && typeof drv.bus === 'object' ? drv.bus : null;
      const busId = busObj ? busObj.id : (drv.bus || '');
      setAttendanceBusId(busId ? String(busId) : '');
      setAttendanceSchedule(drv.schedule || 'even');
    } else {
      setAttendanceBusId('');
      setAttendanceSchedule('even');
    }

    setAttendanceDate(att.date);
    setPlannedHours(String(att.planned_hours));
    setActualHours(String(att.actual_hours));
    setAttendanceStatus(att.status || 'Ishda');
    setCheckIn(att.check_in || '06:00');
    setCheckOut(att.check_out || '22:30');
    setModalOpen(true);
  };

  const handleDriverChange = (driverIdStr: string) => {
    setSelectedDriverId(driverIdStr);
    const drv = drivers.find((d) => String(d.id) === driverIdStr);
    if (drv) {
      const busObj = drv.bus && typeof drv.bus === 'object' ? drv.bus : null;
      const busId = busObj ? busObj.id : (drv.bus || '');
      setAttendanceBusId(busId ? String(busId) : '');
      setAttendanceSchedule(drv.schedule || 'even');
      
      // Auto-prefill check-in/out times from driver's default shift if available
      if (drv.shift_start) {
        setCheckIn(drv.shift_start.substring(0, 5));
      }
      if (drv.shift_end) {
        setCheckOut(drv.shift_end.substring(0, 5));
      }
    } else {
      setAttendanceBusId('');
      setAttendanceSchedule('even');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId || !attendanceDate || !plannedHours || !actualHours) {
      alert(lang === 'ru' ? 'Заполните обязательные поля!' : 'Majburiy maydonlarni toʻldiring!');
      return;
    }

    setSaveLoading(true);

    // Save driver's bus and schedule assignment first
    try {
      await api.patch(`/drivers/${selectedDriverId}/`, {
        bus: attendanceBusId ? parseInt(attendanceBusId) : null,
        schedule: attendanceSchedule,
      });
      await refreshDrivers();
    } catch (err) {
      console.error('Failed to auto-assign bus/schedule to driver during attendance save', err);
    }

    const payload = {
      driver: parseInt(selectedDriverId),
      date: attendanceDate,
      planned_hours: parseInt(plannedHours),
      actual_hours: parseInt(actualHours),
      status: attendanceStatus,
      check_in: checkIn,
      check_out: checkOut,
    };

    const url = editingId ? `/work-attendances/${editingId}/` : '/work-attendances/';
    const method = editingId ? 'put' : 'post';

    try {
      const response = await api[method](url, payload);
      if (response.status === 200 || response.status === 201) {
        await fetchAttendances();
        setModalOpen(false);
      }
    } catch (error: any) {
      console.error('Failed to save attendance', error);
      alert('Xatolik: ' + JSON.stringify(error.response?.data || error.message));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      lang === 'ru'
        ? 'Вы уверены, что хотите удалить эту запись о посещаемости?'
        : 'Ushbu ish vaqti yozuvini oʻchirishni xohlaysizmi?'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/work-attendances/${id}/`);
      await fetchAttendances();
    } catch (error) {
      console.error('Failed to delete attendance', error);
      alert('Oʻchirishda xatolik yuz berdi.');
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

  const filteredAttendances = attendances.filter((att) => {
    const driverObj = typeof att.driver === 'object' && att.driver !== null ? att.driver : null;
    
    // Bus filter
    if (selectedBusId !== 'all') {
      const busObj = driverObj && typeof driverObj.bus === 'object' ? driverObj.bus : null;
      const busId = busObj ? busObj.id : (driverObj ? driverObj.bus : null);
      if (String(busId) !== selectedBusId) {
        return false;
      }
    }
    
    // Schedule filter
    if (selectedSchedule !== 'all') {
      const schedule = driverObj ? driverObj.schedule : 'even';
      if (schedule !== selectedSchedule) {
        return false;
      }
    }
    
    return true;
  });

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
        <button className="add-btn primary-btn" onClick={handleOpenAdd}>
          {lang === 'ru' ? '+ Добавить раб. время' : '+ Ish vaqti qoʻshish'}
        </button>
      </div>

      {/* Date Filters Panel */}
      <div className="filter-container">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="ctrl-input"
            style={{ width: '130px' }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="2026">2026 yil</option>
            <option value="2027">2027 yil</option>
          </select>
          
          <select
            className="ctrl-input"
            style={{ width: '140px' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label[lang]}
              </option>
            ))}
          </select>

          <select
            className="ctrl-input"
            style={{ width: '180px' }}
            value={selectedBusId}
            onChange={(e) => setSelectedBusId(e.target.value)}
          >
            <option value="all">{lang === 'ru' ? 'Все автобусы' : 'Barcha avtobuslar'}</option>
            {buses?.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.num} ({b.route})
              </option>
            ))}
          </select>

          <select
            className="ctrl-input"
            style={{ width: '160px' }}
            value={selectedSchedule}
            onChange={(e) => setSelectedSchedule(e.target.value)}
          >
            <option value="all">{lang === 'ru' ? 'Все графики' : 'Barcha grafiklar'}</option>
            <option value="even">{lang === 'ru' ? 'Четные дни' : 'Juft kunlar'}</option>
            <option value="odd">{lang === 'ru' ? 'Нечетные дни' : 'Toq kunlar'}</option>
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
                <th>{lang === 'ru' ? 'Дата' : 'Sana'}</th>
                <th>{t('hoursStart')}</th>
                <th>{t('hoursEnd')}</th>
                <th>{t('hoursWorked')}</th>
                <th>{lang === 'ru' ? 'Статус' : 'Holat'}</th>
                <th className="actions-cell">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    {lang === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...'}
                  </td>
                </tr>
              ) : filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    {lang === 'ru' ? 'Данные посещаемости не найдены' : 'Ish vaqti maʻlumotlari topilmadi'}
                  </td>
                </tr>
              ) : (
                filteredAttendances.map((att, idx) => {
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
                      <td>{att.date}</td>
                      <td>{att.check_in || '06:00'}</td>
                      <td>{att.check_out || '22:30'}</td>
                      <td style={{ fontWeight: '600' }}>{att.actual_hours} / {att.planned_hours} {t('hoursUnit')}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: att.status === 'Ishda' ? 'rgba(0, 200, 83, 0.15)' : 'rgba(213, 0, 0, 0.15)',
                          color: att.status === 'Ishda' ? 'var(--green)' : 'var(--red)',
                        }}>
                          {att.status || 'Ishda'}
                        </span>
                      </td>
                      <td className="actions-cell" style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleOpenEdit(att)}
                        >
                          {t('btnEdit')}
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(att.id)}
                        >
                          {t('btnDelete')}
                        </button>
                        <button
                          className="btn-action btn-edit"
                          style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}
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
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>{lang === 'ru' ? 'Автобус:' : 'Avtobus:'}</label>
              <select
                className="ctrl-input"
                value={driverBusId}
                onChange={(e) => setDriverBusId(e.target.value)}
              >
                <option value="">{lang === 'ru' ? 'Не выбран' : 'Tanlanmagan'}</option>
                {buses?.map((b: any) => (
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

      {/* Attendance Add/Edit Modal */}
      {modalOpen && (
        <Modal
          title={
            editingId
              ? lang === 'ru'
                ? 'Редактировать рабочее время'
                : 'Ish vaqtini tahrirlash'
              : lang === 'ru'
              ? 'Добавить запись рабочего времени'
              : 'Yangi ish vaqti qoʻshish'
          }
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSave}>
            <div className="input-group">
              <label>{t('colDriver')}:</label>
              <select
                className="ctrl-input"
                required
                value={selectedDriverId}
                onChange={(e) => handleDriverChange(e.target.value)}
              >
                {drivers.map((d) => {
                  const busObj = d.bus && typeof d.bus === 'object' ? d.bus : null;
                  const busNum = busObj ? busObj.num : 'Navbatchi';
                  const scheduleText = d.schedule === 'even' ? (lang === 'ru' ? 'Чет' : 'Juft') : (lang === 'ru' ? 'Неchet' : 'Toq');
                  return (
                    <option key={d.id} value={d.id}>
                      {d.name} ({busNum} - {scheduleText})
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>{lang === 'ru' ? 'Автобус:' : 'Avtobus:'}</label>
                <select
                  className="ctrl-input"
                  value={attendanceBusId}
                  onChange={(e) => setAttendanceBusId(e.target.value)}
                >
                  <option value="">{lang === 'ru' ? 'Не выбран' : 'Tanlanmagan'}</option>
                  {buses?.map((b: any) => (
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
                  value={attendanceSchedule}
                  onChange={(e) => setAttendanceSchedule(e.target.value as any)}
                >
                  <option value="even">{lang === 'ru' ? 'Четные дни' : 'Juft kunlar'}</option>
                  <option value="odd">{lang === 'ru' ? 'Нечетные дни' : 'Toq kunlar'}</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>{lang === 'ru' ? 'Дата:' : 'Sana:'}</label>
              <input
                type="date"
                className="ctrl-input"
                required
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>{lang === 'ru' ? 'План (часов):' : 'Rejalashtirilgan (soat):'}</label>
                <input
                  type="number"
                  className="ctrl-input"
                  required
                  value={plannedHours}
                  onChange={(e) => setPlannedHours(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ flex: 1 }}>
                <label>{lang === 'ru' ? 'Факт (часов):' : 'Haqiqiy ishlagan (soat):'}</label>
                <input
                  type="number"
                  className="ctrl-input"
                  required
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label>{lang === 'ru' ? 'Статус:' : 'Status:'}</label>
              <select
                className="ctrl-input"
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value)}
              >
                <option value="Ishda">{lang === 'ru' ? 'В работе (Ishda)' : 'Ishda'}</option>
                <option value="Kelmadi">{lang === 'ru' ? 'Не явился (Kelmadi)' : 'Kelmadi'}</option>
                <option value="Kasal">{lang === 'ru' ? 'Болен (Kasal)' : 'Kasal'}</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>{lang === 'ru' ? 'Начало смены:' : 'Kelgan vaqti (Boshlanish):'}</label>
                <input
                  type="time"
                  className="ctrl-input"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ flex: 1 }}>
                <label>{lang === 'ru' ? 'Конец смены:' : 'Ketgan vaqti (Tugash):'}</label>
                <input
                  type="time"
                  className="ctrl-input"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="modal-btn cancel-btn" onClick={() => setModalOpen(false)}>
                {t('btnCancel')}
              </button>
              <button type="submit" disabled={saveLoading} className="modal-btn save primary-btn">
                {saveLoading ? '...' : t('btnSave')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

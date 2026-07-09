'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import api from '@/services/api';
import { Salary } from '@/types';
import Modal from '../ui/Modal';

export default function Salaries() {
  const { lang, t, drivers } = useApp();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('5'); // Default is June (index 5)

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [salaryYear, setSalaryYear] = useState('2026');
  const [salaryMonth, setSalaryMonth] = useState('5');
  const [fixedSalary, setFixedSalary] = useState('4000000');
  const [bonus, setBonus] = useState('0');
  const [finesDeduction, setFinesDeduction] = useState('0');
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const response = await api.get('/salaries/', {
        params: {
          year: selectedYear,
          month: selectedMonth
        }
      });
      setSalaries(response.data);
    } catch (error) {
      console.error('Failed to fetch salaries list', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (modalOpen && selectedDriverId) {
      const fetchFinesForDriver = async () => {
        try {
          const response = await api.get('/fines/by_driver/', {
            params: { driver_id: selectedDriverId }
          });
          const driverFines = response.data;
          
          const targetYear = parseInt(salaryYear);
          const targetMonth = parseInt(salaryMonth); // 0-indexed
          
          const sum = driverFines
            .filter((fine: any) => {
              if (!fine.date) return false;
              const dateParts = fine.date.split('-');
              if (dateParts.length < 2) return false;
              const y = parseInt(dateParts[0]);
              const m = parseInt(dateParts[1]) - 1;
              return y === targetYear && m === targetMonth;
            })
            .reduce((acc: number, fine: any) => acc + parseFloat(fine.amount || '0'), 0);
            
          setFinesDeduction(String(sum));
        } catch (error) {
          console.error('Failed to fetch fines for driver', error);
        }
      };
      
      fetchFinesForDriver();
    }
  }, [modalOpen, selectedDriverId, salaryYear, salaryMonth]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setSelectedDriverId(drivers.length > 0 ? String(drivers[0].id) : '');
    setSalaryYear(selectedYear);
    setSalaryMonth(selectedMonth);
    setFixedSalary('4000000');
    setBonus('0');
    setFinesDeduction('0');
    setModalOpen(true);
  };

  const handleOpenEdit = (salary: Salary) => {
    setEditingId(salary.id);
    const driverId = typeof salary.driver === 'object' && salary.driver !== null ? salary.driver.id : salary.driver;
    setSelectedDriverId(String(driverId));
    setSalaryYear(String(salary.year));
    setSalaryMonth(String(salary.month));
    setFixedSalary(salary.fixed_salary);
    setBonus(salary.bonus);
    setFinesDeduction(salary.fines_deduction);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId || !salaryYear || !salaryMonth || !fixedSalary) {
      alert(lang === 'ru' ? 'Заполните обязательные поля!' : 'Majburiy maydonlarni toʻldiring!');
      return;
    }

    setSaveLoading(true);
    const payload = {
      driver: parseInt(selectedDriverId),
      year: parseInt(salaryYear),
      month: parseInt(salaryMonth),
      fixed_salary: parseFloat(fixedSalary),
      bonus: parseFloat(bonus || '0'),
      fines_deduction: parseFloat(finesDeduction || '0'),
    };
    
    const url = editingId ? `/salaries/${editingId}/` : '/salaries/';
    const method = editingId ? 'put' : 'post';

    try {
      const response = await api[method](url, payload);
      if (response.status === 200 || response.status === 201) {
        await fetchSalaries();
        setModalOpen(false);
      }
    } catch (error: any) {
      console.error('Failed to save salary', error);
      alert('Xatolik: ' + JSON.stringify(error.response?.data || error.message));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      lang === 'ru'
        ? 'Вы уверены, что хотите удалить эту запись о зарплате?'
        : 'Ushbu oylik maosh maʻlumotini oʻchirishni xohlaysizmi?'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/salaries/${id}/`);
      await fetchSalaries();
    } catch (error) {
      console.error('Failed to delete salary', error);
      alert('Oʻchirishda xatolik yuz berdi.');
    }
  };

  const handlePayConfirm = (driverName: string) => {
    alert(
      lang === 'ru'
        ? `Выплата для ${driverName} успешно подтверждена!`
        : `${driverName} uchun oylik toʻlovi tasdiqlandi!`
    );
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
                Учет <span>зарплаты</span>
              </>
            ) : (
              <>
                Oylik maosh <span>hisobi</span>
              </>
            )}
          </h2>
          <div className="page-sub">
            {lang === 'ru'
              ? 'Расчет оклада, вычетов по штрафам и чистых выплат'
              : 'Oylik fiksa, jarimalar chegirilishi va jami toʻlanadigan summalar'}
          </div>
        </div>
        <button className="add-btn primary-btn" onClick={handleOpenAdd}>
          {lang === 'ru' ? '+ Добавить зарплату' : '+ Oylik maosh qoʻshish'}
        </button>
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

      {/* Salary Table */}
      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '70px', textAlign: 'center' }}>№</th>
                <th>{t('colDriver')}</th>
                <th>{t('salaryFixed')}</th>
                <th>{t('salaryFines')}</th>
                <th>{t('salaryTotal')}</th>
                <th className="actions-cell">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    {lang === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...'}
                  </td>
                </tr>
              ) : salaries.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    {lang === 'ru' ? 'Данные о зарплате отсутствуют' : 'Maosh maʻlumotlari topilmadi'}
                  </td>
                </tr>
              ) : (
                salaries.map((salary, idx) => {
                  const driverName = salary.driver_display || 
                    (typeof salary.driver === 'object' && salary.driver !== null ? salary.driver.name : `Driver ID: ${salary.driver}`);

                  return (
                    <tr key={salary.id}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                      <td>
                        <strong>{driverName}</strong>
                      </td>
                      <td>{parseInt(salary.fixed_salary || '4000000').toLocaleString()} sum</td>
                      <td style={{ color: 'var(--red)', fontWeight: 500 }}>
                        -{parseInt(salary.fines_deduction || '0').toLocaleString()} sum
                      </td>
                      <td style={{ color: 'var(--green)', fontWeight: '700' }}>
                        {parseInt(salary.total_paid || '4000000').toLocaleString()} sum
                      </td>
                      <td className="actions-cell" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleOpenEdit(salary)}
                        >
                          {t('btnEdit')}
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(salary.id)}
                        >
                          {t('btnDelete')}
                        </button>
                        <button
                          className="btn-action btn-edit"
                          style={{ background: 'var(--green)', borderColor: 'var(--green)' }}
                          onClick={() => handlePayConfirm(driverName)}
                        >
                          {t('salaryPay')}
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

      {/* Salary Add/Edit Modal */}
      {modalOpen && (
        <Modal
          title={
            editingId
              ? lang === 'ru'
                ? 'Редактировать зарплату'
                : 'Oylik maoshni tahrirlash'
              : lang === 'ru'
              ? 'Добавить начисление зарплаты'
              : 'Yangi oylik maosh qoʻshish'
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
                onChange={(e) => setSelectedDriverId(e.target.value)}
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>{lang === 'ru' ? 'Год:' : 'Yil:'}</label>
                <select
                  className="ctrl-input"
                  value={salaryYear}
                  onChange={(e) => setSalaryYear(e.target.value)}
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              <div className="input-group" style={{ flex: 1 }}>
                <label>{lang === 'ru' ? 'Месяц:' : 'Oy:'}</label>
                <select
                  className="ctrl-input"
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                >
                  {monthsList.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label[lang]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>{t('salaryFixed')} (sum):</label>
              <input
                type="number"
                className="ctrl-input"
                required
                value={fixedSalary}
                onChange={(e) => setFixedSalary(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>{lang === 'ru' ? 'Бонус (sum):' : 'Mukofot puli (sum):'}</label>
                <input
                  type="number"
                  className="ctrl-input"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ flex: 1 }}>
                <label>{t('salaryFines')} (sum):</label>
                <input
                  type="number"
                  className="ctrl-input"
                  value={finesDeduction}
                  onChange={(e) => setFinesDeduction(e.target.value)}
                />
                <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                  {lang === 'ru' ? 'Сумма штрафов за месяц (авторасчет)' : 'Oy uchun jami jarimalar (avto-hisob)'}
                </span>
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

'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import api from '@/services/api';
import { Salary } from '@/types';

export default function Salaries() {
  const { lang, t } = useApp();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('5'); // Default is June (index 5)

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      // Typically backends support filter queries, let's pass parameters if available
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
                      <td className="actions-cell">
                        <button
                          className="btn-action btn-edit"
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
    </div>
  );
}

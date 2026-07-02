'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import api from '@/services/api';
import { Fine } from '@/types';

export default function Fines() {
  const { drivers, t, lang } = useApp();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [fineDate, setFineDate] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const response = await api.get('/fines/');
      setFines(response.data);
    } catch (error) {
      console.error('Failed to fetch fines', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
    // Default fineDate to today
    setFineDate(new Date().toISOString().split('T')[0]);
  }, []);

  // Pre-select first driver if list loads
  useEffect(() => {
    if (drivers.length > 0 && !selectedDriverId) {
      setSelectedDriverId(String(drivers[0].id));
    }
  }, [drivers, selectedDriverId]);

  const handleAddFine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId || !fineDate || !amount || !reason.trim()) {
      alert('Barcha maydonlarni toʻldiring!');
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await api.post('/fines/', {
        driver: parseInt(selectedDriverId),
        date: fineDate,
        amount: parseFloat(amount),
        reason: reason.trim(),
      });

      if (response.status === 200 || response.status === 201) {
        setAmount('');
        setReason('');
        await fetchFines();
      }
    } catch (error: any) {
      console.error('Failed to add fine', error);
      alert('Xatolik: ' + JSON.stringify(error.response?.data || error.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteFine = async (fineId: number) => {
    const confirmed = window.confirm(
      lang === 'ru'
        ? 'Вы уверены, что хотите удалить этот штраф?'
        : 'Ushbu jarimani oʻchirishni xohlaysizmi?'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/fines/${fineId}/`);
      await fetchFines();
    } catch (error) {
      console.error('Failed to delete fine', error);
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
                Учет <span>Штрафов</span>
              </>
            ) : (
              <>
                Jarimalar <span>hisobi</span>
              </>
            )}
          </h2>
          <div className="page-sub">
            {lang === 'ru'
              ? 'Выставление и просмотр штрафов водителей'
              : 'Haydovchilarga jarima yozish va koʻrish'}
          </div>
        </div>
      </div>

      {/* Add Fine Form Section */}
      <div className="table-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 600 }}>{t('addFineTitle')}</h3>
        <form onSubmit={handleAddFine}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>{t('colDriver')}:</label>
              <select
                className="ctrl-input"
                style={{ width: '220px' }}
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>{t('labelFineDate')}</label>
              <input
                type="date"
                className="ctrl-input"
                style={{ width: '180px' }}
                value={fineDate}
                onChange={(e) => setFineDate(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>{t('labelFineAmount')}</label>
              <input
                type="number"
                className="ctrl-input"
                placeholder="50000"
                style={{ width: '180px' }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>{t('labelFineReason')}</label>
              <input
                type="text"
                className="ctrl-input"
                placeholder={lang === 'ru' ? 'Превышение скорости' : 'Tezlikni oshirish'}
                style={{ width: '240px' }}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            
            <button type="submit" disabled={submitLoading} className="add-btn primary-btn" style={{ height: '44px' }}>
              {submitLoading ? '...' : t('btnAdd')}
            </button>
          </div>
        </form>
      </div>

      {/* Fines Table */}
      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>№</th>
                <th>{t('colDriver')}</th>
                <th>{lang === 'ru' ? 'Дата' : 'Sana'}</th>
                <th>{lang === 'ru' ? 'Сумма штрафа' : 'Jarima summasi'}</th>
                <th>{lang === 'ru' ? 'Причина' : 'Sababi'}</th>
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
              ) : fines.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    {lang === 'ru' ? 'Штрафов нет' : 'Jarimalar mavjud emas'}
                  </td>
                </tr>
              ) : (
                fines.map((fine, idx) => {
                  const driverName = fine.driver_display || 
                    (typeof fine.driver === 'object' && fine.driver !== null ? fine.driver.name : `Driver ID: ${fine.driver}`);

                  return (
                    <tr key={fine.id}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                      <td>
                        <strong>{driverName}</strong>
                      </td>
                      <td>{fine.date}</td>
                      <td style={{ color: 'var(--red)', fontWeight: '600' }}>
                        {parseInt(fine.amount).toLocaleString()} sum
                      </td>
                      <td>{fine.reason}</td>
                      <td className="actions-cell">
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteFine(fine.id)}
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
    </div>
  );
}

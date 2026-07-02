'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import api from '@/services/api';
import Modal from '../ui/Modal';

export default function Buses() {
  const { buses, refreshBuses, t, lang } = useApp();
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busNum, setBusNum] = useState('');
  const [busRoute, setBusRoute] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const handleOpenAdd = () => {
    setEditingId(null);
    setBusNum('');
    setBusRoute('');
    setModalOpen(true);
  };

  const handleOpenEdit = (id: number, num: string, route: string) => {
    setEditingId(id);
    setBusNum(num);
    setBusRoute(route);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busNum.trim() || !busRoute.trim()) {
      alert('Maʻlumotlarni toʻliq kiriting!');
      return;
    }

    setSaveLoading(true);
    const payload = { num: busNum.trim(), route: busRoute.trim() };
    const url = editingId ? `/buses/${editingId}/` : '/buses/';
    const method = editingId ? 'put' : 'post';

    try {
      const response = await api[method](url, payload);
      if (response.status === 200 || response.status === 201) {
        await refreshBuses();
        setModalOpen(false);
      }
    } catch (error: any) {
      console.error('Failed to save bus', error);
      alert('Xatolik: ' + JSON.stringify(error.response?.data || error.message));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      lang === 'ru'
        ? 'Вы уверены, что хотите удалить этот автобус?'
        : 'Ushbu avtobusni oʻchirishni xohlaysizmi?'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/buses/${id}/`);
      await refreshBuses();
    } catch (error) {
      console.error('Failed to delete bus', error);
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
                Все <span>автобусы</span>
              </>
            ) : (
              <>
                Barcha <span>avtobuslar</span>
              </>
            )}
          </h2>
          <div className="page-sub">
            {lang === 'ru'
              ? 'Управление автопарком автобусной станции'
              : 'Avtobus saroyi transport vositalarini boshqarish'}
          </div>
        </div>
        <button className="add-btn primary-btn" onClick={handleOpenAdd}>
          {t('addBus')}
        </button>
      </div>

      {/* Buses Table */}
      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '70px', textAlign: 'center' }}>№</th>
                <th>{lang === 'ru' ? 'Гос. номер автобуса' : 'Avtobus davlat raqami'}</th>
                <th>{lang === 'ru' ? 'Маршрут' : 'Yoʻnalish'}</th>
                <th className="actions-cell">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {buses.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    {lang === 'ru' ? 'Автобусы не найдены' : 'Avtobuslar topilmadi'}
                  </td>
                </tr>
              ) : (
                buses.map((bus, idx) => (
                  <tr key={bus.id}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td>
                      <span className="bus-num">{bus.num}</span>
                    </td>
                    <td>
                      <strong>{bus.route}</strong>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-action btn-edit"
                        style={{ marginRight: '8px' }}
                        onClick={() => handleOpenEdit(bus.id, bus.num, bus.route)}
                      >
                        {t('btnEdit')}
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(bus.id)}
                      >
                        {t('btnDelete')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bus Add/Edit Modal */}
      {modalOpen && (
        <Modal
          title={
            editingId
              ? lang === 'ru'
                ? 'Редактировать автобус'
                : 'Avtobusni tahrirlash'
              : lang === 'ru'
              ? 'Добавить новый автобус'
              : 'Yangi avtobus qoʻshish'
          }
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSave}>
            <div className="input-group">
              <label>{lang === 'ru' ? 'Гос. номер автобуса:' : 'Avtobus davlat raqami:'}</label>
              <input
                type="text"
                className="ctrl-input"
                placeholder="01 | 777 AAA"
                required
                value={busNum}
                onChange={(e) => setBusNum(e.target.value)}
              />
            </div>
            
            <div className="input-group">
              <label>{lang === 'ru' ? 'Маршрут:' : 'Yoʻnalish:'}</label>
              <input
                type="text"
                className="ctrl-input"
                placeholder="Т-5"
                required
                value={busRoute}
                onChange={(e) => setBusRoute(e.target.value)}
              />
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

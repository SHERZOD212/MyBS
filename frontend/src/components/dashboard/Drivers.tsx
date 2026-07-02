'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import api from '@/services/api';
import Modal from '../ui/Modal';

export default function Drivers() {
  const { drivers, refreshDrivers, t, lang } = useApp();
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const handleOpenAdd = () => {
    setEditingId(null);
    setDriverName('');
    setDriverPhone('');
    setModalOpen(true);
  };

  const handleOpenEdit = (id: number, name: string, phone: string | null) => {
    setEditingId(id);
    setDriverName(name);
    setDriverPhone(phone || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim() || !driverPhone.trim()) {
      alert('Maʻlumotlarni toʻliq kiriting!');
      return;
    }

    setSaveLoading(true);
    const payload = { name: driverName.trim(), phone: driverPhone.trim() };
    const url = editingId ? `/drivers/${editingId}/` : '/drivers/';
    const method = editingId ? 'put' : 'post';

    try {
      const response = await api[method](url, payload);
      if (response.status === 200 || response.status === 201) {
        await refreshDrivers();
        setModalOpen(false);
      }
    } catch (error: any) {
      console.error('Failed to save driver', error);
      alert('Xatolik: ' + JSON.stringify(error.response?.data || error.message));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
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
                Все <span>водители</span>
              </>
            ) : (
              <>
                Barcha <span>haydovchilar</span>
              </>
            )}
          </h2>
          <div className="page-sub">
            {lang === 'ru'
              ? 'Управление списком водителей автобусного парка'
              : 'Avtobus saroyi haydovchilar roʻyxatini boshqarish'}
          </div>
        </div>
        <button className="add-btn primary-btn" onClick={handleOpenAdd}>
          {t('addDriver')}
        </button>
      </div>

      {/* Drivers Table */}
      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '70px', textAlign: 'center' }}>№</th>
                <th>{lang === 'ru' ? 'Имя Фамилия' : 'Ism Familiya'}</th>
                <th>{lang === 'ru' ? 'Телефон' : 'Telefon'}</th>
                <th className="actions-cell">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    {lang === 'ru' ? 'Водители не найдены' : 'Haydovchilar topilmadi'}
                  </td>
                </tr>
              ) : (
                drivers.map((driver, idx) => (
                  <tr key={driver.id}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td>
                      <strong>{driver.name}</strong>
                    </td>
                    <td>{driver.phone || '+998 -- --- -- --'}</td>
                    <td className="actions-cell">
                      <button
                        className="btn-action btn-edit"
                        style={{ marginRight: '8px' }}
                        onClick={() => handleOpenEdit(driver.id, driver.name, driver.phone)}
                      >
                        {t('btnEdit')}
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(driver.id)}
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

      {/* Driver Add/Edit Modal */}
      {modalOpen && (
        <Modal
          title={
            editingId
              ? lang === 'ru'
                ? 'Редактировать водителя'
                : 'Haydovchini tahrirlash'
              : lang === 'ru'
              ? 'Добавить нового водителя'
              : 'Yangi haydovchi qoʻshish'
          }
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSave}>
            <div className="input-group">
              <label>{lang === 'ru' ? 'Имя Фамилия водителя:' : 'Haydovchining ism familiyasi:'}</label>
              <input
                type="text"
                className="ctrl-input"
                placeholder="Sherzod Karimov"
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
                placeholder="+998 (90) 123-45-67"
                required
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
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

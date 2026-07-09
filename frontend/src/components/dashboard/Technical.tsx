'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import api from '@/services/api';
import { TechnicalStatus } from '@/types';
import Modal from '../ui/Modal';

export default function Technical() {
  const { lang, t, buses } = useApp();
  const [techList, setTechList] = useState<TechnicalStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'tires' | 'brakes' | 'oil'>('tires');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [category, setCategory] = useState<'tires' | 'brakes' | 'oil' | 'engine' | 'battery'>('tires');
  const [lastServiceDate, setLastServiceDate] = useState('');
  const [currentKm, setCurrentKm] = useState('0');
  const [maxKm, setMaxKm] = useState('50000');
  const [status, setStatus] = useState<'ok' | 'warn' | 'danger' | 'repair'>('ok');
  const [saveLoading, setSaveLoading] = useState(false);

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
  const oilList = techList.filter((item) => item.category === 'oil');

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

  const handleOpenAdd = () => {
    setEditingId(null);
    setSelectedBusId(buses.length > 0 ? String(buses[0].id) : '');
    setCategory(activeSubTab);
    setLastServiceDate(new Date().toISOString().split('T')[0]);
    setCurrentKm('0');
    setMaxKm('50000');
    setStatus('ok');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: TechnicalStatus) => {
    setEditingId(item.id);
    const busId = typeof item.bus === 'object' && item.bus !== null ? item.bus.id : item.bus;
    setSelectedBusId(String(busId));
    setCategory(item.category);
    setLastServiceDate(item.last_service_date);
    setCurrentKm(String(item.current_km));
    setMaxKm(String(item.max_km));
    setStatus(item.status);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusId || !category || !lastServiceDate || !currentKm || !maxKm) {
      alert(lang === 'ru' ? 'Заполните обязательные поля!' : 'Majburiy maydonlarni toʻldiring!');
      return;
    }

    setSaveLoading(true);
    const payload = {
      bus: parseInt(selectedBusId),
      category: category,
      last_service_date: lastServiceDate,
      current_km: parseInt(currentKm),
      max_km: parseInt(maxKm),
      status: status,
    };
    
    const url = editingId ? `/technical-statuses/${editingId}/` : '/technical-statuses/';
    const method = editingId ? 'put' : 'post';

    try {
      const response = await api[method](url, payload);
      if (response.status === 200 || response.status === 201) {
        await fetchTech();
        setModalOpen(false);
      }
    } catch (error: any) {
      console.error('Failed to save technical status', error);
      alert('Xatolik: ' + JSON.stringify(error.response?.data || error.message));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      lang === 'ru'
        ? 'Вы уверены, что хотите удалить эту запись о тех. обслуживании?'
        : 'Ushbu texnik koʻrik yozuvini oʻchirishni xohlaysizmi?'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/technical-statuses/${id}/`);
      await fetchTech();
    } catch (error) {
      console.error('Failed to delete technical status', error);
      alert('Oʻchirishda xatolik yuz berdi.');
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                  className="btn-action btn-edit"
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                  onClick={() => handleOpenEdit(item)}
                >
                  {t('btnEdit')}
                </button>
                <button
                  className="btn-action btn-delete"
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                  onClick={() => handleDelete(item.id)}
                >
                  {t('btnDelete')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getActiveList = () => {
    switch (activeSubTab) {
      case 'tires':
        return tiresList;
      case 'brakes':
        return brakesList;
      case 'oil':
        return oilList;
      default:
        return tiresList;
    }
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
              ? 'Мониторинг износа шин, тормозных систем и уровня масла'
              : 'Avtotransport vositalarining shinalari, tormoz tizimlari va moy monitoringi'}
          </div>
        </div>
        <button className="add-btn primary-btn" onClick={handleOpenAdd}>
          {lang === 'ru' ? '+ Добавить тех. состояние' : '+ Texnik holat qoʻshish'}
        </button>
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
        <button
          className={`stab ${activeSubTab === 'oil' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('oil')}
        >
          {lang === 'ru' ? 'Масло / Антифриз' : 'Moy / Antifriz'}
        </button>
      </div>

      {/* Content area */}
      <div className="table-card" style={{ padding: '24px' }}>
        {renderList(getActiveList())}
      </div>

      {/* Tech Status Add/Edit Modal */}
      {modalOpen && (
        <Modal
          title={
            editingId
              ? lang === 'ru'
                ? 'Редактировать тех. состояние'
                : 'Texnik holatni tahrirlash'
              : lang === 'ru'
              ? 'Добавить тех. состояние'
              : 'Yangi texnik holat qoʻshish'
          }
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSave}>
            <div className="input-group">
              <label>{lang === 'ru' ? 'Автобус:' : 'Avtobus:'}</label>
              <select
                className="ctrl-input"
                required
                value={selectedBusId}
                onChange={(e) => setSelectedBusId(e.target.value)}
              >
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.num} ({b.route})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>{lang === 'ru' ? 'Категория:' : 'Kategoriya:'}</label>
              <select
                className="ctrl-input"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
              >
                <option value="tires">{t('tiresTab')}</option>
                <option value="brakes">{t('brakesTab')}</option>
                <option value="oil">{lang === 'ru' ? 'Масло / Антифриз (Moy)' : 'Moy / Antifriz'}</option>
              </select>
            </div>

            <div className="input-group">
              <label>{lang === 'ru' ? 'Дата последнего осмотра:' : 'Oxirgi koʻrik sanasi:'}</label>
              <input
                type="date"
                className="ctrl-input"
                required
                value={lastServiceDate}
                onChange={(e) => setLastServiceDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>{lang === 'ru' ? 'Текущий пробег (km):' : 'Hozirgi yurgan masofa (km):'}</label>
                <input
                  type="number"
                  className="ctrl-input"
                  required
                  value={currentKm}
                  onChange={(e) => setCurrentKm(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ flex: 1 }}>
                <label>{lang === 'ru' ? 'Макс. пробег (km):' : 'Maksimal masofa (km):'}</label>
                <input
                  type="number"
                  className="ctrl-input"
                  required
                  value={maxKm}
                  onChange={(e) => setMaxKm(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label>{lang === 'ru' ? 'Состояние:' : 'Holati:'}</label>
              <select
                className="ctrl-input"
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="ok">{lang === 'ru' ? 'Хорошо (OK)' : 'Yaxshi (OK)'}</option>
                <option value="warn">{lang === 'ru' ? 'Предупреждение (Warning)' : 'Ogohlantirish (Warning)'}</option>
                <option value="danger">{lang === 'ru' ? 'Опасно (Danger)' : 'Xavfli (Danger)'}</option>
                <option value="repair">{lang === 'ru' ? 'В ремонте' : 'Taʻmir talab'}</option>
              </select>
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

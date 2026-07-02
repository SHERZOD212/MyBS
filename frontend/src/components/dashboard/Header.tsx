'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export default function Header() {
  const { theme, toggleTheme, lang, setLanguage, logout, t } = useApp();
  const [timeStr, setTimeStr] = useState('00:00:00');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    // Tick function
    const tick = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);

      // Formatted date
      const daysRu = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
      const daysUz = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
      const dayName = lang === 'ru' ? daysRu[now.getDay()] : daysUz[now.getDay()];
      
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();

      setDateStr(`${day}.${month}.${year} | ${dayName}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  return (
    <div className="topbar">
      <div className="logo">
        {t('logoTitle')}
        <span>{t('logoSub')}</span>
      </div>

      <div className="topbar-right-wrap">
        {/* Language buttons */}
        <div className="lang-buttons">
          <button
            className={`lang-btn ${lang === 'ru' ? 'active' : ''}`}
            onClick={() => setLanguage('ru')}
          >
            RU
          </button>
          <span className="lang-divider">|</span>
          <button
            className={`lang-btn ${lang === 'uz' ? 'active' : ''}`}
            onClick={() => setLanguage('uz')}
          >
            UZ
          </button>
        </div>

        {/* Live Clock widget */}
        <div className="topbar-right">
          <div id="live-clock">{timeStr}</div>
          <div id="live-date">{dateStr}</div>
        </div>

        {/* Theme toggle */}
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          <span>{theme === 'light' ? '🌙' : '☀️'}</span>
          <span>{theme === 'light' ? t('darkTheme') : t('lightTheme')}</span>
        </button>

        {/* Logout wrapper */}
        <div id="logout-wrapper" style={{ display: 'block' }}>
          <button
            className="btn-action btn-delete"
            style={{ padding: '8px 16px', borderRadius: '8px' }}
            onClick={logout}
          >
            {t('exit')}
          </button>
        </div>
      </div>
    </div>
  );
}

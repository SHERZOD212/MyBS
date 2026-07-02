'use client';

import React, { useState } from 'react';
import api from '@/services/api';
import { useApp } from '@/context/AppContext';

export default function AuthScreen() {
  const { login, lang, setLanguage, theme, toggleTheme, t } = useApp();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register fields
  const [regUser, setRegUser] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPassConfirm, setRegPassConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await api.post('/login/', {
        username: loginUser.trim(),
        password: loginPass,
      });

      if (response.data?.access) {
        login(response.data.access, response.data.refresh);
      } else {
        setLoginError('Format xatosi (token topilmadi)');
      }
    } catch (err: any) {
      console.error(err);
      setLoginError(err.response?.data?.detail || 'Username yoki parol xato!');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (regPass !== regPassConfirm) {
      setRegError('Parollar mos kelmadi!');
      return;
    }

    setRegLoading(true);

    try {
      const response = await api.post('/register/', {
        username: regUser.trim(),
        email: regEmail.trim(),
        password: regPass,
      });

      if (response.status === 200 || response.status === 201) {
        setRegSuccess(t('authSuccess'));
        setRegUser('');
        setRegEmail('');
        setRegPass('');
        setRegPassConfirm('');
        setTimeout(() => {
          setActiveTab('login');
          setRegSuccess('');
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      const errData = err.response?.data || {};
      let errMsg = 'Roʻyxatdan oʻtishda xatolik!';
      if (errData.username) errMsg = `Username: ${errData.username[0]}`;
      else if (errData.email) errMsg = `Email: ${errData.email[0]}`;
      else if (errData.password) errMsg = `Password: ${errData.password[0]}`;
      setRegError(errMsg);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="auth-screen-overlay">
      <div className="login-card">
        {/* Top bar controls inside Auth Screen */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div className="logo" style={{ fontSize: '24px' }}>
            My<span>BS</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
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
            <button className="theme-toggle-btn" onClick={toggleTheme} style={{ padding: '6px 12px' }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>

        {/* Tab triggers */}
        <div className="auth-tabs">
          <button
            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('login');
              setLoginError('');
            }}
          >
            {t('loginTitle')}
          </button>
          <button
            className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('register');
              setRegError('');
            }}
          >
            {t('registerTitle')}
          </button>
        </div>

        {/* Form rendering */}
        {activeTab === 'login' ? (
          <div>
            {loginError && <div className="alert-msg alert-danger">{loginError}</div>}
            
            <form onSubmit={handleLoginSubmit}>
              <div className="input-group">
                <label htmlFor="login-username">{t('usernameLabel')}</label>
                <input
                  type="text"
                  id="login-username"
                  className="ctrl-input"
                  required
                  placeholder="admin"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="login-pass">{t('passwordLabel')}</label>
                <input
                  type="password"
                  id="login-pass"
                  className="ctrl-input"
                  required
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="modal-btn primary-btn"
                style={{ width: '100%', height: '42px', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                {loginLoading ? '...' : t('loginBtn')}
              </button>
            </form>
          </div>
        ) : (
          <div>
            {regError && <div className="alert-msg alert-danger">{regError}</div>}
            {regSuccess && <div className="alert-msg alert-success">{regSuccess}</div>}

            <form onSubmit={handleRegisterSubmit}>
              <div className="input-group">
                <label htmlFor="reg-username">Username</label>
                <input
                  type="text"
                  id="reg-username"
                  className="ctrl-input"
                  required
                  placeholder="sherzod_01"
                  value={regUser}
                  onChange={(e) => setRegUser(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="reg-email">{t('emailLabel')}</label>
                <input
                  type="email"
                  id="reg-email"
                  className="ctrl-input"
                  required
                  placeholder="example@mail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="reg-password">{t('passwordLabel')}</label>
                <input
                  type="password"
                  id="reg-password"
                  className="ctrl-input"
                  required
                  placeholder={lang === 'ru' ? 'Минимум 6 символов' : 'Kamida 6 ta belgi'}
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="reg-confirm">{t('confirmPasswordLabel')}</label>
                <input
                  type="password"
                  id="reg-confirm"
                  className="ctrl-input"
                  required
                  placeholder={lang === 'ru' ? 'Повторите пароль' : 'Parolni takrorlang'}
                  value={regPassConfirm}
                  onChange={(e) => setRegPassConfirm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={regLoading}
                className="modal-btn primary-btn"
                style={{ width: '100%', height: '42px', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                {regLoading ? '...' : t('registerBtn')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

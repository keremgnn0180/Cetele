import React from 'react';
import './SplashScreen.css';
import leafLogo from '../assets/leaf-logo.svg';
import appIconPng from '../assets/app-icon.png';

function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-gradient splash-gradient-one" />
      <div className="splash-gradient splash-gradient-two" />

      <div className="splash-content">
        <div className="splash-logo-wrap">
          <img
            src={leafLogo}
            alt="Çetele Logo"
            className="splash-logo"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = appIconPng;
            }}
          />
        </div>
        <h1 className="splash-title">Çetele</h1>
        <p className="splash-subtitle">Tarım Takip ve Yönetim Sistemi</p>
      </div>

      <div className="splash-loader">
        <span className="splash-loader-bar" />
      </div>
    </div>
  );
}

export default SplashScreen;

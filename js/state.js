/**
 * Application State & Configuration Management
 * Handles localStorage persistence, service metadata, and default emblems.
 */
(function (global) {
  'use strict';

  const STORAGE_LOGO_KEY = 'cm_studio_offline_logo_v3';
  const STORAGE_SEC_LOGO_KEY = 'cm_studio_offline_sec_logo_v3';
  const STORAGE_CFG_KEY = 'cm_studio_offline_cfg_v3';

  const todayISO = new Date().toISOString().slice(0, 10);

  function formatHumanDate(isoStr) {
    try {
      const parts = (isoStr || todayISO).split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return isoStr;
    }
  }

  function buildDefaultLogoDataUrl() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 92" width="340" height="92">
      <rect x="6" y="6" width="80" height="80" rx="18" fill="#ffffff" fill-opacity="0.16" stroke="#ffffff" stroke-width="4"/>
      <path d="M46 20V72M26 39H66" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
      <text x="104" y="45" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="25" letter-spacing="1.2">CHURCH MEDIA</text>
      <text x="104" y="69" fill="#ffffff" fill-opacity="0.85" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="14" letter-spacing="2.8">OFFICIAL PHOTO</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function buildDefaultSecLogoDataUrl() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 64" width="280" height="64">
      <rect x="4" y="4" width="272" height="56" rx="28" fill="#111116" fill-opacity="0.75" stroke="#ffffff" stroke-width="2"/>
      <circle cx="32" cy="32" r="14" fill="#fbbf24"/>
      <text x="56" y="38" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="16" letter-spacing="0.5">@ChurchMediaOnline</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  const defaultCfg = {
    logoPos: 'bottom-right',
    logoScale: 14,
    logoOpacity: 90,
    logoMargin: 3.5,
    logoEffect: 'shadow', // 'none' | 'shadow' | 'glow' | 'pill'
    enableSecLogo: false,
    secLogoPos: 'top-left',
    secLogoScale: 11,
    secLogoOpacity: 85,
    serviceDate: todayISO,
    serviceType: 'Sunday_Service',
    text: `Sunday Service • ${formatHumanDate(todayISO)}`,
    textPos: 'dock-below',
    textSize: 1.8,
    textColor: '#ffffff',
    textBg: 'shadow', // 'shadow' | 'pill' | 'none'
    exportResolution: '2048', // 'orig' | '3840' | '2048' | '1920' | '1280'
    exportFormat: 'image/jpeg',
    exportQuality: 0.92
  };

  const state = {
    photos: [], // { id, name, url, thumbUrl, img, w, h, isStarred: false, flipCorner: false, invertText: false }
    activeIndex: -1,
    filterMode: 'all', // 'all' | 'highlights'
    primaryLogoImg: null,
    secondaryLogoImg: null,
    cfg: Object.assign({}, defaultCfg)
  };

  function saveConfig() {
    try {
      localStorage.setItem(STORAGE_CFG_KEY, JSON.stringify(state.cfg));
    } catch (e) {}
  }

  function loadConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_CFG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        Object.assign(state.cfg, parsed);
      }
    } catch (e) {}
  }

  function resetConfig() {
    try {
      localStorage.removeItem(STORAGE_CFG_KEY);
    } catch (e) {}
    state.cfg = Object.assign({}, defaultCfg);
    state.cfg.text = `Sunday Service • ${formatHumanDate(todayISO)}`;
  }

  function getExt() {
    if (state.cfg.exportFormat === 'image/png') return 'png';
    if (state.cfg.exportFormat === 'image/webp') return 'webp';
    return 'jpg';
  }

  function getBasePrefix(isHighlight) {
    const datePart = state.cfg.serviceDate || todayISO;
    const typePart = (state.cfg.serviceType || 'Sunday_Service').replace(/[^a-zA-Z0-9_-]/g, '_');
    const tag = isHighlight ? 'Highlight' : 'Photo';
    return `${datePart}_${typePart}_${tag}`;
  }

  // Export module to global scope
  global.ChurchState = {
    STORAGE_LOGO_KEY,
    STORAGE_SEC_LOGO_KEY,
    todayISO,
    state,
    formatHumanDate,
    buildDefaultLogoDataUrl,
    buildDefaultSecLogoDataUrl,
    saveConfig,
    loadConfig,
    resetConfig,
    getExt,
    getBasePrefix
  };
})(window);

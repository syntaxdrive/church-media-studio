/**
 * Church Media Suite Hub Controller
 * Adobe Creative Cloud style workspace orchestration & Shared Brand Identity sync.
 * Built by Phosters Ministries • 100% Offline
 */
(function (global) {
  'use strict';

  const STORAGE_SUITE_CHURCH = 'cm_suite_church_name';
  const STORAGE_SUITE_SPEAKER = 'cm_suite_speaker_name';
  const STORAGE_SUITE_SERIES = 'cm_suite_series_title';

  const dom = {
    // Nav elements
    navHub: document.getElementById('navModuleHub'),
    navWatermark: document.getElementById('navModuleWatermark'),
    navQuotes: document.getElementById('navModuleQuotes'),
    navAudio: document.getElementById('navModuleAudio'),

    // Drawer elements
    drawerHub: document.getElementById('drawerNavHub'),
    drawerWatermark: document.getElementById('drawerNavWatermark'),
    drawerQuotes: document.getElementById('drawerNavQuotes'),
    drawerAudio: document.getElementById('drawerNavAudio'),
    mobileDrawer: document.getElementById('mobileDrawer'),

    // Workspaces
    moduleHubView: document.getElementById('moduleHubView'),
    moduleWatermarkView: document.getElementById('moduleWatermarkView'),
    moduleQuotesView: document.getElementById('moduleQuotesView'),
    moduleAudioView: document.getElementById('moduleAudioView'),

    // Hub Quick Launch buttons
    hubOpenPhotoTabBtn: document.getElementById('hubOpenPhotoTabBtn'),
    hubOpenQuotesTabBtn: document.getElementById('hubOpenQuotesTabBtn'),
    hubOpenAudioTabBtn: document.getElementById('hubOpenAudioTabBtn'),

    // Shared Brand Identity inputs
    hubChurchName: document.getElementById('hubChurchName'),
    hubPastorName: document.getElementById('hubPastorName'),
    hubSeriesTitle: document.getElementById('hubSeriesTitle'),
    hubSyncSaveBtn: document.getElementById('hubSyncSaveBtn'),
    hubSyncBadge: document.getElementById('hubSyncBadge')
  };

  function closeMobileDrawer() {
    if (dom.mobileDrawer) dom.mobileDrawer.classList.remove('open');
  }

  function activateSuiteView(viewName) {
    // Reset all nav buttons and workspaces
    document.querySelectorAll('.suite-nav-btn').forEach(function (btn) {
      btn.classList.remove('active');
    });
    document.querySelectorAll('.drawer-nav-item').forEach(function (btn) {
      btn.classList.remove('active');
    });
    document.querySelectorAll('.workspace').forEach(function (ws) {
      ws.classList.add('hidden');
    });

    closeMobileDrawer();

    if (viewName === 'watermark' || viewName === 'photo') {
      if (dom.navWatermark) dom.navWatermark.classList.add('active');
      if (dom.drawerWatermark) dom.drawerWatermark.classList.add('active');
      if (dom.moduleWatermarkView) dom.moduleWatermarkView.classList.remove('hidden');
      if (window.renderActiveCanvas) window.renderActiveCanvas();
    } else if (viewName === 'quotes' || viewName === 'rhema') {
      if (dom.navQuotes) dom.navQuotes.classList.add('active');
      if (dom.drawerQuotes) dom.drawerQuotes.classList.add('active');
      if (dom.moduleQuotesView) dom.moduleQuotesView.classList.remove('hidden');
      if (window.updateQuotePreview) window.updateQuotePreview();
    } else if (viewName === 'audio') {
      if (dom.navAudio) dom.navAudio.classList.add('active');
      if (dom.drawerAudio) dom.drawerAudio.classList.add('active');
      if (dom.moduleAudioView) dom.moduleAudioView.classList.remove('hidden');
    } else {
      // Default: Hub View
      if (dom.navHub) dom.navHub.classList.add('active');
      if (dom.drawerHub) dom.drawerHub.classList.add('active');
      if (dom.moduleHubView) dom.moduleHubView.classList.remove('hidden');
    }
  }

  function loadSharedIdentity() {
    let church = localStorage.getItem(STORAGE_SUITE_CHURCH);
    let speaker = localStorage.getItem(STORAGE_SUITE_SPEAKER);
    let series = localStorage.getItem(STORAGE_SUITE_SERIES);

    if (!church) church = 'Phosters Ministries';
    if (!speaker) speaker = 'Pastor Sam Adeyemi';
    if (!series) series = 'Supernatural Dominion Series';

    if (dom.hubChurchName) dom.hubChurchName.value = church;
    if (dom.hubPastorName) dom.hubPastorName.value = speaker;
    if (dom.hubSeriesTitle) dom.hubSeriesTitle.value = series;

    applyIdentityToEngines(church, speaker, series);
  }

  function saveSharedIdentity() {
    const church = (dom.hubChurchName ? dom.hubChurchName.value.trim() : '') || 'Phosters Ministries';
    const speaker = (dom.hubPastorName ? dom.hubPastorName.value.trim() : '') || 'Pastor Sam Adeyemi';
    const series = (dom.hubSeriesTitle ? dom.hubSeriesTitle.value.trim() : '') || 'Supernatural Dominion Series';

    try {
      localStorage.setItem(STORAGE_SUITE_CHURCH, church);
      localStorage.setItem(STORAGE_SUITE_SPEAKER, speaker);
      localStorage.setItem(STORAGE_SUITE_SERIES, series);
    } catch (e) {
      console.warn('Local storage write error:', e);
    }

    applyIdentityToEngines(church, speaker, series);

    if (dom.hubSyncBadge) {
      const origText = dom.hubSyncBadge.textContent;
      dom.hubSyncBadge.textContent = 'Synced Locally';
      dom.hubSyncBadge.style.color = 'var(--gold)';
      setTimeout(function () {
        dom.hubSyncBadge.textContent = origText;
        dom.hubSyncBadge.style.color = 'var(--success)';
      }, 2000);
    }
  }

  function applyIdentityToEngines(church, speaker, series) {
    // 1. Sync to Rhema inputs if available
    const quotePreacher = document.getElementById('quotePreacherName');
    const quoteSeries = document.getElementById('quoteSeriesTitle');
    if (quotePreacher && !quotePreacher.dataset.userEdited) {
      quotePreacher.value = speaker;
      quotePreacher.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (quoteSeries && !quoteSeries.dataset.userEdited) {
      quoteSeries.value = series;
      quoteSeries.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 2. Sync to Audio Metadata inputs if available
    const audioArtist = document.getElementById('audioMetaArtist');
    const audioAlbum = document.getElementById('audioMetaAlbum');
    if (audioArtist && !audioArtist.dataset.userEdited) {
      audioArtist.value = speaker;
      audioArtist.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (audioAlbum && !audioAlbum.dataset.userEdited) {
      audioAlbum.value = series;
      audioAlbum.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function initSuiteHub() {
    // Query DOM fresh in case scripts loaded dynamically
    dom.navHub = document.getElementById('navModuleHub');
    dom.navWatermark = document.getElementById('navModuleWatermark');
    dom.navQuotes = document.getElementById('navModuleQuotes');
    dom.navAudio = document.getElementById('navModuleAudio');

    dom.drawerHub = document.getElementById('drawerNavHub');
    dom.drawerWatermark = document.getElementById('drawerNavWatermark');
    dom.drawerQuotes = document.getElementById('drawerNavQuotes');
    dom.drawerAudio = document.getElementById('drawerNavAudio');
    dom.mobileDrawer = document.getElementById('mobileDrawer');

    dom.moduleHubView = document.getElementById('moduleHubView');
    dom.moduleWatermarkView = document.getElementById('moduleWatermarkView');
    dom.moduleQuotesView = document.getElementById('moduleQuotesView');
    dom.moduleAudioView = document.getElementById('moduleAudioView');

    dom.hubOpenPhotoTabBtn = document.getElementById('hubOpenPhotoTabBtn');
    dom.hubOpenQuotesTabBtn = document.getElementById('hubOpenQuotesTabBtn');
    dom.hubOpenAudioTabBtn = document.getElementById('hubOpenAudioTabBtn');

    dom.hubChurchName = document.getElementById('hubChurchName');
    dom.hubPastorName = document.getElementById('hubPastorName');
    dom.hubSeriesTitle = document.getElementById('hubSeriesTitle');
    dom.hubSyncSaveBtn = document.getElementById('hubSyncSaveBtn');
    dom.hubSyncBadge = document.getElementById('hubSyncBadge');

    // Desktop Nav Switcher
    if (dom.navHub) dom.navHub.onclick = function () { activateSuiteView('hub'); };
    if (dom.navWatermark) dom.navWatermark.onclick = function () { activateSuiteView('watermark'); };
    if (dom.navQuotes) dom.navQuotes.onclick = function () { activateSuiteView('quotes'); };
    if (dom.navAudio) dom.navAudio.onclick = function () { activateSuiteView('audio'); };

    // Mobile Drawer Navigation
    if (dom.drawerHub) dom.drawerHub.onclick = function () { activateSuiteView('hub'); };
    if (dom.drawerWatermark) dom.drawerWatermark.onclick = function () { activateSuiteView('watermark'); };
    if (dom.drawerQuotes) dom.drawerQuotes.onclick = function () { activateSuiteView('quotes'); };
    if (dom.drawerAudio) dom.drawerAudio.onclick = function () { activateSuiteView('audio'); };

    // Hub Quick Launch buttons
    if (dom.hubOpenPhotoTabBtn) dom.hubOpenPhotoTabBtn.onclick = function () { activateSuiteView('watermark'); };
    if (dom.hubOpenQuotesTabBtn) dom.hubOpenQuotesTabBtn.onclick = function () { activateSuiteView('quotes'); };
    if (dom.hubOpenAudioTabBtn) dom.hubOpenAudioTabBtn.onclick = function () { activateSuiteView('audio'); };

    // Shared Brand Identity
    if (dom.hubSyncSaveBtn) dom.hubSyncSaveBtn.onclick = saveSharedIdentity;
    if (dom.hubChurchName) dom.hubChurchName.oninput = saveSharedIdentity;
    if (dom.hubPastorName) dom.hubPastorName.oninput = saveSharedIdentity;
    if (dom.hubSeriesTitle) dom.hubSeriesTitle.oninput = saveSharedIdentity;

    loadSharedIdentity();

    // Check URL Hash for direct engine routing
    const hash = window.location.hash.toLowerCase();
    if (hash === '#photo' || hash === '#watermark') {
      activateSuiteView('watermark');
    } else if (hash === '#quotes' || hash === '#rhema') {
      activateSuiteView('quotes');
    } else if (hash === '#audio') {
      activateSuiteView('audio');
    } else {
      activateSuiteView('hub');
    }
  }

  // Export functions globally
  global.ChurchMediaSuite = {
    init: initSuiteHub,
    activateView: activateSuiteView,
    saveSharedIdentity: saveSharedIdentity,
    loadSharedIdentity: loadSharedIdentity
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSuiteHub);
  } else {
    initSuiteHub();
  }

})(window);

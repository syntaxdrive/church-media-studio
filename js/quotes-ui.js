/**
 * Sermon Quote Studio UI Controller & Mobile Drawer Navigation
 * Handles instant quote updates, preacher presets, movement controls,
 * custom background uploads, aspect ratios, mobile hamburger menu,
 * and reliable canvas-to-blob downloads.
 */
(function () {
  'use strict';

  const { todayISO, quoteState, RATIOS, BUILTIN_BACKGROUNDS, SAMPLE_QUOTES, renderQuoteCard, STORAGE_CUSTOM_BG_KEY, STORAGE_PREACHER_IMG_KEY } = ChurchQuotes;

  // DOM Elements
  const dom = {
    // Header & Mobile Navigation
    navModuleWatermark: document.getElementById('navModuleWatermark'),
    navModuleQuotes: document.getElementById('navModuleQuotes'),
    moduleWatermarkView: document.getElementById('moduleWatermarkView'),
    moduleQuotesView: document.getElementById('moduleQuotesView'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileDrawer: document.getElementById('mobileDrawer'),
    closeMobileDrawerBtn: document.getElementById('closeMobileDrawerBtn'),
    drawerBackdrop: document.getElementById('drawerBackdrop'),
    drawerNavWatermark: document.getElementById('drawerNavWatermark'),
    drawerNavQuotes: document.getElementById('drawerNavQuotes'),
    drawerThemeBtn: document.getElementById('drawerThemeBtn'),
    drawerResetBtn: document.getElementById('drawerResetBtn'),
    drawerHelpBtn: document.getElementById('drawerHelpBtn'),

    // Aspect Ratio & Layout
    quoteRatioGroup: document.getElementById('quoteRatioGroup'),
    quoteTemplateSelect: document.getElementById('quoteTemplateSelect'),

    // Typography & Template Styling
    quoteFontFamily: document.getElementById('quoteFontFamily'),
    quoteTextAlign: document.getElementById('quoteTextAlign'),
    quoteMarksSelect: document.getElementById('quoteMarksSelect'),
    quoteFontSizeSlider: document.getElementById('quoteFontSizeSlider'),
    quoteFontSizeVal: document.getElementById('quoteFontSizeVal'),
    quoteTextColor: document.getElementById('quoteTextColor'),
    quoteAccentColor: document.getElementById('quoteAccentColor'),

    // Quote Content
    quoteTextInput: document.getElementById('quoteTextInput'),
    scriptureInput: document.getElementById('scriptureInput'),
    seriesInput: document.getElementById('seriesInput'),
    loadSampleQuoteBtn: document.getElementById('loadSampleQuoteBtn'),

    // Preacher Details & Movement
    preacherStyleSelect: document.getElementById('preacherStyleSelect'),
    preacherMovementSection: document.getElementById('preacherMovementSection'),
    preacherAlignSelect: document.getElementById('preacherAlignSelect'),
    preacherScaleSlider: document.getElementById('preacherScaleSlider'),
    preacherScaleVal: document.getElementById('preacherScaleVal'),
    preacherOffsetXSlider: document.getElementById('preacherOffsetXSlider'),
    preacherOffsetXVal: document.getElementById('preacherOffsetXVal'),
    preacherOffsetYSlider: document.getElementById('preacherOffsetYSlider'),
    preacherOffsetYVal: document.getElementById('preacherOffsetYVal'),
    preacherFlipHCheck: document.getElementById('preacherFlipHCheck'),
    preacherNameInput: document.getElementById('preacherNameInput'),
    preacherTitleInput: document.getElementById('preacherTitleInput'),
    preacherAvatarInput: document.getElementById('preacherAvatarInput'),
    preacherAvatarThumb: document.getElementById('preacherAvatarThumb'),
    removePreacherAvatarBtn: document.getElementById('removePreacherAvatarBtn'),

    // Background Controls
    quoteBgSelect: document.getElementById('quoteBgSelect'),
    customBgRow: document.getElementById('customBgRow'),
    customBgInput: document.getElementById('customBgInput'),
    customBgThumb: document.getElementById('customBgThumb'),
    removeCustomBgBtn: document.getElementById('removeCustomBgBtn'),
    bgAlignYSelect: document.getElementById('bgAlignYSelect'),
    quoteDimmerSlider: document.getElementById('quoteDimmerSlider'),
    quoteDimmerVal: document.getElementById('quoteDimmerVal'),

    // Canvas & Export
    quoteCanvas: document.getElementById('quoteCanvas'),
    downloadQuoteBtn: document.getElementById('downloadQuoteBtn'),
    copyQuoteClipboardBtn: document.getElementById('copyQuoteClipboardBtn')
  };

  let sampleIdx = 0;

  function notify(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function updateQuotePreview() {
    if (!dom.quoteCanvas) return;
    renderQuoteCard(dom.quoteCanvas);
  }

  // Load Saved Custom Background
  function loadSavedCustomBg() {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_BG_KEY);
      if (saved) {
        const img = new Image();
        img.onload = function () {
          quoteState.customBgImg = img;
          dom.customBgThumb.src = saved;
          dom.customBgThumb.style.display = 'block';
          updateQuotePreview();
        };
        img.src = saved;
      }
    } catch (e) {}
  }

  // Load Saved Preacher Image
  function loadSavedPreacherImg() {
    try {
      const saved = localStorage.getItem(STORAGE_PREACHER_IMG_KEY);
      if (saved) {
        const img = new Image();
        img.onload = function () {
          quoteState.preacherImg = img;
          dom.preacherAvatarThumb.src = saved;
          dom.preacherAvatarThumb.style.display = 'block';
          updateQuotePreview();
        };
        img.src = saved;
      }
    } catch (e) {}
  }

  function syncQuoteUI() {
    dom.quoteTextInput.value = quoteState.quoteText || '';
    dom.scriptureInput.value = quoteState.scriptureRef || '';
    dom.seriesInput.value = quoteState.seriesTitle || '';

    // Typography
    dom.quoteFontFamily.value = quoteState.fontFamily || 'sans';
    dom.quoteTextAlign.value = quoteState.textAlign || 'left';
    dom.quoteMarksSelect.value = quoteState.quoteMarks || 'large';
    dom.quoteFontSizeSlider.value = quoteState.customFontSize || 0;
    dom.quoteFontSizeVal.textContent = quoteState.customFontSize > 0 ? quoteState.customFontSize + 'px' : 'Auto';
    dom.quoteTextColor.value = quoteState.textColor || '#ffffff';
    dom.quoteAccentColor.value = quoteState.accentColor || '#f59e0b';

    // Preacher Details & Movement
    dom.preacherStyleSelect.value = quoteState.preacherStyle || 'badge';
    dom.preacherNameInput.value = quoteState.preacherName || '';
    dom.preacherTitleInput.value = quoteState.preacherTitle || '';
    dom.preacherAlignSelect.value = quoteState.preacherAlign || 'right';
    dom.preacherScaleSlider.value = quoteState.preacherScale || 75;
    dom.preacherScaleVal.textContent = (quoteState.preacherScale || 75) + '%';
    dom.preacherOffsetXSlider.value = quoteState.preacherOffsetX || 0;
    dom.preacherOffsetXVal.textContent = (quoteState.preacherOffsetX || 0) + '%';
    dom.preacherOffsetYSlider.value = quoteState.preacherOffsetY || 0;
    dom.preacherOffsetYVal.textContent = (quoteState.preacherOffsetY || 0) + '%';
    dom.preacherFlipHCheck.checked = !!quoteState.preacherFlipH;

    // Movement controls visibility (Only relevant if cutout or split style)
    const showMovement = quoteState.preacherStyle === 'cutout' || quoteState.preacherStyle === 'split';
    dom.preacherMovementSection.classList.toggle('hidden', !showMovement);

    // Background
    dom.quoteBgSelect.value = quoteState.bgType || 'midnight';
    dom.customBgRow.classList.toggle('hidden', quoteState.bgType !== 'custom');
    dom.bgAlignYSelect.value = quoteState.bgAlignY || 'center';
    dom.quoteDimmerSlider.value = quoteState.bgDim || 45;
    dom.quoteDimmerVal.textContent = (quoteState.bgDim || 45) + '%';

    // Ratio segmented buttons
    const ratioBtns = dom.quoteRatioGroup.querySelectorAll('.seg-btn');
    ratioBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ratio === quoteState.ratio);
    });

    updateQuotePreview();
  }

  function openMobileDrawer() {
    dom.mobileDrawer.classList.add('open');
  }

  function closeMobileDrawer() {
    dom.mobileDrawer.classList.remove('open');
  }

  function switchToWatermarkModule() {
    dom.navModuleWatermark.classList.add('active');
    dom.navModuleQuotes.classList.remove('active');
    dom.drawerNavWatermark.classList.add('active');
    dom.drawerNavQuotes.classList.remove('active');
    dom.moduleWatermarkView.classList.remove('hidden');
    dom.moduleQuotesView.classList.add('hidden');
    closeMobileDrawer();
  }

  function switchToQuotesModule() {
    dom.navModuleQuotes.classList.add('active');
    dom.navModuleWatermark.classList.remove('active');
    dom.drawerNavQuotes.classList.add('active');
    dom.drawerNavWatermark.classList.remove('active');
    dom.moduleQuotesView.classList.remove('hidden');
    dom.moduleWatermarkView.classList.add('hidden');
    closeMobileDrawer();
    updateQuotePreview();
  }

  function bindQuoteEvents() {
    // 1. Suite Switcher (Desktop Header)
    dom.navModuleWatermark.onclick = switchToWatermarkModule;
    dom.navModuleQuotes.onclick = switchToQuotesModule;

    // 2. Mobile Drawer Navigation
    if (dom.mobileMenuBtn) dom.mobileMenuBtn.onclick = openMobileDrawer;
    if (dom.closeMobileDrawerBtn) dom.closeMobileDrawerBtn.onclick = closeMobileDrawer;
    if (dom.drawerBackdrop) dom.drawerBackdrop.onclick = closeMobileDrawer;
    if (dom.drawerNavWatermark) dom.drawerNavWatermark.onclick = switchToWatermarkModule;
    if (dom.drawerNavQuotes) dom.drawerNavQuotes.onclick = switchToQuotesModule;

    if (dom.drawerThemeBtn) {
      dom.drawerThemeBtn.onclick = function () {
        const html = document.documentElement;
        const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
      };
    }
    if (dom.drawerResetBtn) {
      dom.drawerResetBtn.onclick = function () {
        document.getElementById('resetBtn').click();
        closeMobileDrawer();
      };
    }
    if (dom.drawerHelpBtn) {
      dom.drawerHelpBtn.onclick = function () {
        document.getElementById('shortcutsHelpBtn').click();
        closeMobileDrawer();
      };
    }

    // 3. Aspect Ratio Switcher
    dom.quoteRatioGroup.onclick = function (e) {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      quoteState.ratio = btn.dataset.ratio;
      syncQuoteUI();
    };

    // 4. Typography Template Controls
    dom.quoteFontFamily.onchange = function (e) {
      quoteState.fontFamily = e.target.value;
      updateQuotePreview();
    };
    dom.quoteTextAlign.onchange = function (e) {
      quoteState.textAlign = e.target.value;
      updateQuotePreview();
    };
    dom.quoteMarksSelect.onchange = function (e) {
      quoteState.quoteMarks = e.target.value;
      updateQuotePreview();
    };
    dom.quoteFontSizeSlider.oninput = function (e) {
      quoteState.customFontSize = parseInt(e.target.value, 10);
      dom.quoteFontSizeVal.textContent = quoteState.customFontSize > 0 ? quoteState.customFontSize + 'px' : 'Auto';
      updateQuotePreview();
    };
    dom.quoteTextColor.oninput = function (e) {
      quoteState.textColor = e.target.value;
      updateQuotePreview();
    };
    dom.quoteAccentColor.oninput = function (e) {
      quoteState.accentColor = e.target.value;
      updateQuotePreview();
    };

    // 5. Quote Text & Metadata
    dom.quoteTextInput.oninput = function (e) {
      quoteState.quoteText = e.target.value;
      updateQuotePreview();
    };
    dom.scriptureInput.oninput = function (e) {
      quoteState.scriptureRef = e.target.value;
      updateQuotePreview();
    };
    dom.seriesInput.oninput = function (e) {
      quoteState.seriesTitle = e.target.value;
      updateQuotePreview();
    };

    // 6. Preacher Presentation Style & Movement Controls
    dom.preacherStyleSelect.onchange = function (e) {
      quoteState.preacherStyle = e.target.value;
      const showMovement = quoteState.preacherStyle === 'cutout' || quoteState.preacherStyle === 'split';
      dom.preacherMovementSection.classList.toggle('hidden', !showMovement);
      updateQuotePreview();
    };
    dom.preacherAlignSelect.onchange = function (e) {
      quoteState.preacherAlign = e.target.value;
      updateQuotePreview();
    };
    dom.preacherScaleSlider.oninput = function (e) {
      quoteState.preacherScale = parseInt(e.target.value, 10);
      dom.preacherScaleVal.textContent = quoteState.preacherScale + '%';
      updateQuotePreview();
    };
    dom.preacherOffsetXSlider.oninput = function (e) {
      quoteState.preacherOffsetX = parseInt(e.target.value, 10);
      dom.preacherOffsetXVal.textContent = quoteState.preacherOffsetX + '%';
      updateQuotePreview();
    };
    dom.preacherOffsetYSlider.oninput = function (e) {
      quoteState.preacherOffsetY = parseInt(e.target.value, 10);
      dom.preacherOffsetYVal.textContent = quoteState.preacherOffsetY + '%';
      updateQuotePreview();
    };
    dom.preacherFlipHCheck.onchange = function (e) {
      quoteState.preacherFlipH = e.target.checked;
      updateQuotePreview();
    };

    dom.preacherNameInput.oninput = function (e) {
      quoteState.preacherName = e.target.value;
      updateQuotePreview();
    };
    dom.preacherTitleInput.oninput = function (e) {
      quoteState.preacherTitle = e.target.value;
      updateQuotePreview();
    };

    // Preacher Avatar / Cutout Upload
    dom.preacherAvatarInput.onchange = function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        const dataUrl = ev.target.result;
        const img = new Image();
        img.onload = function () {
          quoteState.preacherImg = img;
          dom.preacherAvatarThumb.src = dataUrl;
          dom.preacherAvatarThumb.style.display = 'block';
          try { localStorage.setItem(STORAGE_PREACHER_IMG_KEY, dataUrl); } catch (err) {}
          updateQuotePreview();
          notify('Preacher image loaded');
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };

    dom.removePreacherAvatarBtn.onclick = function () {
      quoteState.preacherImg = null;
      dom.preacherAvatarThumb.style.display = 'none';
      try { localStorage.removeItem(STORAGE_PREACHER_IMG_KEY); } catch (err) {}
      updateQuotePreview();
      notify('Preacher image removed');
    };

    // 7. Background Graphic Controls
    dom.quoteBgSelect.onchange = function (e) {
      quoteState.bgType = e.target.value;
      dom.customBgRow.classList.toggle('hidden', quoteState.bgType !== 'custom');
      updateQuotePreview();
    };

    dom.bgAlignYSelect.onchange = function (e) {
      quoteState.bgAlignY = e.target.value;
      updateQuotePreview();
    };

    dom.customBgInput.onchange = function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        const dataUrl = ev.target.result;
        const img = new Image();
        img.onload = function () {
          quoteState.customBgImg = img;
          dom.customBgThumb.src = dataUrl;
          dom.customBgThumb.style.display = 'block';
          try { localStorage.setItem(STORAGE_CUSTOM_BG_KEY, dataUrl); } catch (err) {}
          updateQuotePreview();
          notify('Custom series graphic loaded');
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };

    dom.removeCustomBgBtn.onclick = function () {
      quoteState.customBgImg = null;
      dom.customBgThumb.style.display = 'none';
      try { localStorage.removeItem(STORAGE_CUSTOM_BG_KEY); } catch (err) {}
      updateQuotePreview();
      notify('Custom graphic cleared');
    };

    dom.quoteDimmerSlider.oninput = function (e) {
      quoteState.bgDim = parseInt(e.target.value, 10);
      dom.quoteDimmerVal.textContent = quoteState.bgDim + '%';
      updateQuotePreview();
    };

    // 8. Sample Quote Loader
    dom.loadSampleQuoteBtn.onclick = function () {
      const s = SAMPLE_QUOTES[sampleIdx % SAMPLE_QUOTES.length];
      sampleIdx++;
      quoteState.quoteText = s.quote;
      quoteState.scriptureRef = s.scripture;
      quoteState.seriesTitle = s.series;
      quoteState.preacherName = s.preacher;
      quoteState.preacherTitle = s.title;
      syncQuoteUI();
      notify(`Loaded quote: ${s.preacher}`);
    };

    // 9. Download Quote Card (Reliable Blob Download)
    dom.downloadQuoteBtn.onclick = function () {
      const canvas = dom.quoteCanvas;
      if (!canvas) return;

      const ratioName = quoteState.ratio;
      const preacherTag = (quoteState.preacherName || 'Quote').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${todayISO}_${preacherTag}_${ratioName}.jpg`;

      // Use canvas.toBlob for high-res images to avoid data URL limitations
      if (canvas.toBlob) {
        canvas.toBlob(function (blob) {
          if (!blob) {
            notify('Error generating image blob');
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 4000);
          notify(`Downloaded ${filename}`);
        }, 'image/jpeg', 0.94);
      } else {
        // Fallback
        const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        notify(`Downloaded ${filename}`);
      }
    };

    // 10. Copy Image to Clipboard
    dom.copyQuoteClipboardBtn.onclick = async function () {
      try {
        if (!navigator.clipboard || !window.ClipboardItem) {
          notify('Direct clipboard copy is not supported in this browser. Use Download instead.');
          return;
        }
        dom.quoteCanvas.toBlob(async function (blob) {
          if (!blob) return;
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            notify('Copied quote card to clipboard! Paste directly into WhatsApp Web or Telegram.');
          } catch (err) {
            notify('Clipboard copy blocked by browser. Click Download to save.');
          }
        }, 'image/png');
      } catch (e) {
        notify('Click Download to save image');
      }
    };
  }

  // Initialize Quote Studio
  loadSavedCustomBg();
  loadSavedPreacherImg();
  syncQuoteUI();
  bindQuoteEvents();
})();

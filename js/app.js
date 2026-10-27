/**
 * Church Media Studio — Main Application Controller
 * High-speed batch processing, keyboard shortcuts, social highlights culling,
 * lightweight memory-optimized thumbnails, and multi-mode export pipelines.
 */
(function () {
  'use strict';

  const { state, STORAGE_LOGO_KEY, STORAGE_SEC_LOGO_KEY, saveConfig, loadConfig, resetConfig, formatHumanDate, buildDefaultLogoDataUrl, buildDefaultSecLogoDataUrl, getBasePrefix, getExt, todayISO } = ChurchState;
  const { renderPhotoToCanvas, computeDimensions } = ChurchRenderer;
  const { createStoreZipBlob } = ChurchZip;

  // DOM Elements
  const dom = {
    // Header
    themeBtn: document.getElementById('themeBtn'),
    resetBtn: document.getElementById('resetBtn'),
    shortcutsHelpBtn: document.getElementById('shortcutsHelpBtn'),

    // Primary Logo
    logoInput: document.getElementById('logoInput'),
    logoThumb: document.getElementById('logoThumb'),
    logoSavedTag: document.getElementById('logoSavedTag'),
    defaultLogoBtn: document.getElementById('defaultLogoBtn'),
    removeLogoBtn: document.getElementById('removeLogoBtn'),
    logoPosGrid: document.getElementById('logoPosGrid'),
    logoScale: document.getElementById('logoScale'),
    logoScaleVal: document.getElementById('logoScaleVal'),
    logoOpacity: document.getElementById('logoOpacity'),
    logoOpacityVal: document.getElementById('logoOpacityVal'),
    logoMargin: document.getElementById('logoMargin'),
    logoMarginVal: document.getElementById('logoMarginVal'),
    logoEffect: document.getElementById('logoEffect'),

    // Secondary Logo / Event Theme
    enableSecLogo: document.getElementById('enableSecLogo'),
    secLogoSection: document.getElementById('secLogoSection'),
    secLogoInput: document.getElementById('secLogoInput'),
    secLogoThumb: document.getElementById('secLogoThumb'),
    defaultSecLogoBtn: document.getElementById('defaultSecLogoBtn'),
    removeSecLogoBtn: document.getElementById('removeSecLogoBtn'),
    secLogoPos: document.getElementById('secLogoPos'),
    secLogoScale: document.getElementById('secLogoScale'),
    secLogoScaleVal: document.getElementById('secLogoScaleVal'),
    secLogoOpacity: document.getElementById('secLogoOpacity'),
    secLogoOpacityVal: document.getElementById('secLogoOpacityVal'),

    // Watermark Text & Metadata
    serviceDate: document.getElementById('serviceDate'),
    serviceType: document.getElementById('serviceType'),
    watermarkText: document.getElementById('watermarkText'),
    clearTextBtn: document.getElementById('clearTextBtn'),
    textPos: document.getElementById('textPos'),
    textSize: document.getElementById('textSize'),
    textSizeVal: document.getElementById('textSizeVal'),
    textColor: document.getElementById('textColor'),
    textBgGroup: document.getElementById('textBgGroup'),

    // Export & Sizing Settings
    exportResolution: document.getElementById('exportResolution'),
    exportFormat: document.getElementById('exportFormat'),
    exportQuality: document.getElementById('exportQuality'),
    namingPreview: document.getElementById('namingPreview'),
    resolutionNote: document.getElementById('resolutionNote'),
    progressBox: document.getElementById('progressBox'),
    progressText: document.getElementById('progressText'),
    progressCount: document.getElementById('progressCount'),
    progressBar: document.getElementById('progressBar'),

    // Export Buttons
    exportAllZipBtn: document.getElementById('exportAllZipBtn'),
    exportAllZipLabel: document.getElementById('exportAllZipLabel'),
    exportHighlightsZipBtn: document.getElementById('exportHighlightsZipBtn'),
    exportHighlightsZipLabel: document.getElementById('exportHighlightsZipLabel'),
    downloadSingleBtn: document.getElementById('downloadSingleBtn'),
    downloadSequentialBtn: document.getElementById('downloadSequentialBtn'),

    // Stage & Canvas
    stageDropArea: document.getElementById('stageDropArea'),
    emptyStateBox: document.getElementById('emptyStateBox'),
    canvasContainer: document.getElementById('canvasContainer'),
    previewCanvas: document.getElementById('previewCanvas'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),

    // Top Stage Photo Actions
    activePhotoTitle: document.getElementById('activePhotoTitle'),
    activePhotoDims: document.getElementById('activePhotoDims'),
    perPhotoBar: document.getElementById('perPhotoBar'),
    starHighlightBtn: document.getElementById('starHighlightBtn'),
    starHighlightLabel: document.getElementById('starHighlightLabel'),
    flipCornerBtn: document.getElementById('flipCornerBtn'),
    flipCornerLabel: document.getElementById('flipCornerLabel'),
    invertColorBtn: document.getElementById('invertColorBtn'),
    removeCurrentBtn: document.getElementById('removeCurrentBtn'),

    // Filmstrip Queue
    batchInput: document.getElementById('batchInput'),
    samplePhotosBtn: document.getElementById('samplePhotosBtn'),
    queueCount: document.getElementById('queueCount'),
    highlightsCount: document.getElementById('highlightsCount'),
    clearQueueBtn: document.getElementById('clearQueueBtn'),
    thumbList: document.getElementById('thumbList'),
    tabAll: document.getElementById('tabAll'),
    tabHighlights: document.getElementById('tabHighlights'),

    // Shortcuts Modal & Toast
    shortcutsModal: document.getElementById('shortcutsModal'),
    closeShortcutsModal: document.getElementById('closeShortcutsModal'),
    toast: document.getElementById('toast')
  };

  /* =========================================================================
     Toast Notifications
     ========================================================================= */
  let toastTimer = null;
  function notify(msg) {
    if (!dom.toast) return;
    dom.toast.textContent = msg;
    dom.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => dom.toast.classList.remove('show'), 2600);
  }

  /* =========================================================================
     Logo Management (Primary & Secondary)
     ========================================================================= */
  function setPrimaryLogoFromUrl(dataUrl, save) {
    if (!dataUrl) {
      state.primaryLogoImg = null;
      dom.logoThumb.style.display = 'none';
      dom.logoSavedTag.classList.add('hidden');
      renderActivePreview();
      return;
    }
    const img = new Image();
    img.onload = function () {
      state.primaryLogoImg = img;
      dom.logoThumb.src = dataUrl;
      dom.logoThumb.style.display = 'block';
      if (save) {
        try {
          localStorage.setItem(STORAGE_LOGO_KEY, dataUrl);
          dom.logoSavedTag.classList.remove('hidden');
        } catch (e) {
          notify('Primary logo applied (file too large for localStorage cache)');
        }
      }
      renderActivePreview();
    };
    img.src = dataUrl;
  }

  function setSecondaryLogoFromUrl(dataUrl, save) {
    if (!dataUrl) {
      state.secondaryLogoImg = null;
      dom.secLogoThumb.style.display = 'none';
      renderActivePreview();
      return;
    }
    const img = new Image();
    img.onload = function () {
      state.secondaryLogoImg = img;
      dom.secLogoThumb.src = dataUrl;
      dom.secLogoThumb.style.display = 'block';
      if (save) {
        try {
          localStorage.setItem(STORAGE_SEC_LOGO_KEY, dataUrl);
        } catch (e) {}
      }
      renderActivePreview();
    };
    img.src = dataUrl;
  }

  function loadSavedLogos() {
    try {
      const savedPri = localStorage.getItem(STORAGE_LOGO_KEY);
      if (savedPri) {
        dom.logoSavedTag.classList.remove('hidden');
        setPrimaryLogoFromUrl(savedPri, false);
      } else {
        setPrimaryLogoFromUrl(buildDefaultLogoDataUrl(), false);
      }

      const savedSec = localStorage.getItem(STORAGE_SEC_LOGO_KEY);
      if (savedSec) {
        setSecondaryLogoFromUrl(savedSec, false);
      } else {
        setSecondaryLogoFromUrl(buildDefaultSecLogoDataUrl(), false);
      }
    } catch (e) {
      setPrimaryLogoFromUrl(buildDefaultLogoDataUrl(), false);
      setSecondaryLogoFromUrl(buildDefaultSecLogoDataUrl(), false);
    }
  }

  /* =========================================================================
     Sync UI Controls from State
     ========================================================================= */
  function syncUI() {
    const c = state.cfg;
    // Primary Logo
    dom.logoScale.value = c.logoScale;
    dom.logoScaleVal.textContent = c.logoScale + '%';
    dom.logoOpacity.value = c.logoOpacity;
    dom.logoOpacityVal.textContent = c.logoOpacity + '%';
    dom.logoMargin.value = c.logoMargin;
    dom.logoMarginVal.textContent = c.logoMargin + '%';
    dom.logoEffect.value = c.logoEffect || 'shadow';

    // 9-Grid Active State
    const posBtns = dom.logoPosGrid.querySelectorAll('.pos-btn');
    posBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.pos === c.logoPos);
    });

    // Secondary Logo
    dom.enableSecLogo.checked = !!c.enableSecLogo;
    dom.secLogoSection.classList.toggle('hidden', !c.enableSecLogo);
    dom.secLogoPos.value = c.secLogoPos || 'top-left';
    dom.secLogoScale.value = c.secLogoScale || 11;
    dom.secLogoScaleVal.textContent = (c.secLogoScale || 11) + '%';
    dom.secLogoOpacity.value = c.secLogoOpacity || 85;
    dom.secLogoOpacityVal.textContent = (c.secLogoOpacity || 85) + '%';

    // Service Info & Text
    dom.serviceDate.value = c.serviceDate || todayISO;
    dom.serviceType.value = c.serviceType || 'Sunday_Service';
    dom.watermarkText.value = c.text || '';
    dom.textPos.value = c.textPos || 'dock-below';
    dom.textSize.value = c.textSize || 1.8;
    dom.textSizeVal.textContent = c.textSize + '%';
    dom.textColor.value = c.textColor || '#ffffff';

    // Text Background Segments
    const bgBtns = dom.textBgGroup.querySelectorAll('.seg-btn');
    bgBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.bg === c.textBg);
    });

    // Export Settings
    dom.exportResolution.value = c.exportResolution || '2048';
    dom.exportFormat.value = c.exportFormat || 'image/jpeg';
    dom.exportQuality.value = String(c.exportQuality || 0.92);

    updateNamingPreview();
    updateResolutionNote();
  }

  function updateResolutionNote() {
    const res = state.cfg.exportResolution;
    if (res === '2048') {
      dom.resolutionNote.textContent = 'Social 2048px: Ultra-fast upload, crystal clear on Instagram & WhatsApp (~1/8th file size)';
    } else if (res === '1920') {
      dom.resolutionNote.textContent = 'Full HD 1080p: Ideal for websites, slides & fast media distribution';
    } else if (res === '1280') {
      dom.resolutionNote.textContent = 'Web 1280px: Minimal file size for ultra-slow church Wi-Fi';
    } else if (res === '3840') {
      dom.resolutionNote.textContent = '4K UHD: High-definition presentation displays and 4K archives';
    } else {
      dom.resolutionNote.textContent = 'Master Archive: Full uncropped original camera megapixels (large file size)';
    }
  }

  function updateNamingPreview() {
    const isHighlight = state.activeIndex >= 0 && state.photos[state.activeIndex] && state.photos[state.activeIndex].isStarred;
    dom.namingPreview.textContent = `File: ${getBasePrefix(isHighlight)}_01.${getExt()}`;
  }

  /* =========================================================================
     Batch Ingestion with Memory-Optimized Thumbnail Downscaling
     ========================================================================= */
  function createLightweightThumbnail(img, maxDim = 140) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const tw = Math.round(w * scale);
    const th = Math.round(h * scale);

    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, tw, th);
    return canvas.toDataURL('image/jpeg', 0.72);
  }

  async function ingestFiles(fileList) {
    const validFiles = Array.from(fileList || []).filter(f => f.type && f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    notify(`Loading ${validFiles.length} photo${validFiles.length > 1 ? 's' : ''}...`);

    for (let i = 0; i < validFiles.length; i++) {
      const f = validFiles[i];
      await new Promise(resolve => {
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.onload = function () {
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          const thumbUrl = createLightweightThumbnail(img, 140);

          state.photos.push({
            id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            name: f.name,
            url: url,
            thumbUrl: thumbUrl,
            img: img,
            w: w,
            h: h,
            isStarred: false,
            flipCorner: false,
            invertText: false
          });
          resolve();
        };
        img.onerror = function () {
          URL.revokeObjectURL(url);
          resolve();
        };
        img.src = url;
      });
    }

    if (state.activeIndex === -1 && state.photos.length > 0) {
      state.activeIndex = 0;
    }
    renderThumbnails();
    renderActivePreview();
    notify(`${state.photos.length} photos ready in batch queue`);
  }

  /* =========================================================================
     Queue & Filmstrip Management
     ========================================================================= */
  function getFilteredPhotos() {
    if (state.filterMode === 'highlights') {
      return state.photos.map((p, idx) => ({ p, realIndex: idx })).filter(item => item.p.isStarred);
    }
    return state.photos.map((p, idx) => ({ p, realIndex: idx }));
  }

  function renderThumbnails() {
    const totalCount = state.photos.length;
    const starredCount = state.photos.filter(p => p.isStarred).length;

    dom.queueCount.textContent = String(totalCount);
    dom.highlightsCount.textContent = String(starredCount);

    dom.thumbList.innerHTML = '';

    if (totalCount === 0) {
      dom.clearQueueBtn.classList.add('hidden');
      const emptySpan = document.createElement('span');
      emptySpan.style.cssText = 'font-family:var(--font-mono); font-size:11px; color:var(--text-faint);';
      emptySpan.textContent = 'No photos queued yet. Drag & drop or select photos.';
      dom.thumbList.appendChild(emptySpan);
      return;
    }

    dom.clearQueueBtn.classList.remove('hidden');

    const filtered = getFilteredPhotos();
    if (filtered.length === 0 && state.filterMode === 'highlights') {
      const msg = document.createElement('span');
      msg.style.cssText = 'font-family:var(--font-mono); font-size:11px; color:var(--text-faint);';
      msg.textContent = 'No highlights starred yet. Press [S] to star social highlights!';
      dom.thumbList.appendChild(msg);
      return;
    }

    filtered.forEach(item => {
      const { p, realIndex } = item;
      const card = document.createElement('div');
      card.className = 'thumb-card' + (realIndex === state.activeIndex ? ' active' : '') + (p.isStarred ? ' is-starred' : '');

      const im = document.createElement('img');
      im.src = p.thumbUrl || p.url;
      im.alt = p.name;
      im.loading = 'lazy';

      const num = document.createElement('span');
      num.className = 'thumb-num';
      num.textContent = String(realIndex + 1).padStart(2, '0');

      card.appendChild(im);
      card.appendChild(num);

      if (p.isStarred) {
        const star = document.createElement('span');
        star.className = 'thumb-star';
        star.innerHTML = '<svg width="9" height="9" viewBox="0 0 24 24" fill="#fbbf24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        card.appendChild(star);
      }

      if (p.flipCorner || p.invertText) {
        const flag = document.createElement('span');
        flag.className = 'thumb-flag';
        flag.title = p.flipCorner ? 'Corner flipped (Face Protected)' : 'Text inverted';
        card.appendChild(flag);
      }

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'thumb-del';
      del.innerHTML = '&times;';
      del.title = 'Remove photo (Del)';
      del.onclick = function (e) {
        e.stopPropagation();
        removePhoto(realIndex);
      };
      card.appendChild(del);

      card.onclick = function () {
        state.activeIndex = realIndex;
        renderThumbnails();
        renderActivePreview();
      };

      dom.thumbList.appendChild(card);
    });

    // Auto-scroll active card into view
    const activeEl = dom.thumbList.querySelector('.thumb-card.active');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function removePhoto(realIndex) {
    if (realIndex < 0 || realIndex >= state.photos.length) return;
    const removed = state.photos.splice(realIndex, 1)[0];
    if (removed && removed.url && removed.url.startsWith('blob:')) {
      URL.revokeObjectURL(removed.url);
    }
    if (state.photos.length === 0) {
      state.activeIndex = -1;
    } else if (state.activeIndex >= state.photos.length) {
      state.activeIndex = state.photos.length - 1;
    }
    renderThumbnails();
    renderActivePreview();
  }

  /* =========================================================================
     Active Photo Preview Rendering
     ========================================================================= */
  function renderActivePreview() {
    const count = state.photos.length;
    const starredCount = state.photos.filter(p => p.isStarred).length;

    if (count === 0 || state.activeIndex < 0) {
      dom.emptyStateBox.classList.remove('hidden');
      dom.canvasContainer.classList.add('hidden');
      dom.perPhotoBar.classList.add('hidden');
      dom.activePhotoTitle.textContent = 'No photos loaded';
      dom.activePhotoDims.textContent = '';
      dom.exportAllZipBtn.disabled = true;
      dom.exportHighlightsZipBtn.disabled = true;
      dom.downloadSingleBtn.disabled = true;
      dom.downloadSequentialBtn.disabled = true;
      dom.exportAllZipLabel.textContent = 'Download All as .ZIP (0 Photos)';
      dom.exportHighlightsZipLabel.textContent = 'Download Highlights as .ZIP (0)';
      return;
    }

    const photo = state.photos[state.activeIndex];
    dom.emptyStateBox.classList.add('hidden');
    dom.canvasContainer.classList.remove('hidden');
    dom.perPhotoBar.classList.remove('hidden');

    const starBadge = photo.isStarred ? ' [Highlight]' : '';
    dom.activePhotoTitle.textContent = `${state.activeIndex + 1}/${count} — ${photo.name}${starBadge}`;
    dom.activePhotoDims.textContent = `(${photo.w}×${photo.h})`;

    // Per-photo buttons active states
    dom.starHighlightBtn.classList.toggle('star-active', photo.isStarred);
    dom.starHighlightLabel.textContent = photo.isStarred ? 'Highlighted' : 'Highlight (S)';

    dom.flipCornerBtn.classList.toggle('override-active', photo.flipCorner);
    dom.flipCornerLabel.textContent = photo.flipCorner ? 'Corner Flipped' : 'Flip Corner (F / Space)';

    dom.invertColorBtn.classList.toggle('override-active', photo.invertText);

    // Live canvas render
    renderPhotoToCanvas(photo, dom.previewCanvas, { isExport: false });

    // Update Export Buttons
    dom.exportAllZipBtn.disabled = false;
    dom.exportAllZipLabel.textContent = `Download All as .ZIP (${count} Photo${count > 1 ? 's' : ''})`;

    dom.exportHighlightsZipBtn.disabled = starredCount === 0;
    dom.exportHighlightsZipLabel.textContent = `Download Highlights as .ZIP (${starredCount} Photo${starredCount > 1 ? 's' : ''})`;

    dom.downloadSingleBtn.disabled = false;
    dom.downloadSequentialBtn.disabled = false;

    updateNamingPreview();
  }

  /* =========================================================================
     Sample Photos Generator (Testing without camera)
     ========================================================================= */
  async function generateSamplePhotos() {
    const samples = [
      { label: 'Praise_And_Worship_Sanctuary', c1: '#1e1b4b', c2: '#7c2d12', spot: '#f59e0b' },
      { label: 'Sunday_Sermon_Pastor_Message', c1: '#0f172a', c2: '#1d4ed8', spot: '#38bdf8' },
      { label: 'Choir_And_Orchestra_Ministration', c1: '#064e3b', c2: '#115e59', spot: '#34d399' },
      { label: 'Congregation_Fellowship_Hall', c1: '#27272a', c2: '#52525b', spot: '#e4e4e7' }
    ];

    notify('Generating 4 high-res sample church photos...');

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const c = document.createElement('canvas');
      c.width = 2400;
      c.height = 1600;
      const ctx = c.getContext('2d');

      const g = ctx.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, s.c1);
      g.addColorStop(1, s.c2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, c.width, c.height);

      const r = ctx.createRadialGradient(c.width * 0.5, c.height * 0.3, 50, c.width * 0.5, c.height * 0.5, 900);
      r.addColorStop(0, s.spot + '44');
      r.addColorStop(1, 'transparent');
      ctx.fillStyle = r;
      ctx.fillRect(0, 0, c.width, c.height);

      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '600 32px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CHURCH MEDIA STUDIO SAMPLE FRAME (2400×1600)', c.width / 2, c.height / 2 - 24);
      ctx.fillStyle = 'rgba(255,255,255,0.78)';
      ctx.font = '800 54px system-ui, sans-serif';
      ctx.fillText(s.label.replace(/_/g, ' '), c.width / 2, c.height / 2 + 45);

      const dataUrl = c.toDataURL('image/jpeg', 0.9);
      await new Promise(resolve => {
        const img = new Image();
        img.onload = function () {
          const thumbUrl = createLightweightThumbnail(img, 140);
          state.photos.push({
            id: 'sample_' + i + '_' + Date.now(),
            name: `IMG_0${501 + i}_${s.label}.jpg`,
            url: dataUrl,
            thumbUrl: thumbUrl,
            img: img,
            w: c.width,
            h: c.height,
            isStarred: i === 0, // Star the first one by default as demo
            flipCorner: false,
            invertText: false
          });
          resolve();
        };
        img.src = dataUrl;
      });
    }

    if (state.activeIndex === -1) state.activeIndex = 0;
    renderThumbnails();
    renderActivePreview();
    notify('4 sample photos loaded (First starred as highlight)');
  }

  /* =========================================================================
     Export Pipelines (Single, All ZIP, Highlights ZIP, Sequential)
     ========================================================================= */
  function canvasToBlob(canvas, mime, quality) {
    return new Promise(resolve => {
      if (canvas.toBlob) {
        canvas.toBlob(blob => resolve(blob), mime, quality);
      } else {
        const dataURL = canvas.toDataURL(mime, quality);
        const parts = dataURL.split(',');
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        resolve(new Blob([ab], { type: mime }));
      }
    });
  }

  function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function downloadCurrentPhoto() {
    if (state.activeIndex < 0) return;
    const photo = state.photos[state.activeIndex];
    const num = String(state.activeIndex + 1).padStart(2, '0');
    const filename = `${getBasePrefix(photo.isStarred)}_${num}.${getExt()}`;

    const workCanvas = document.createElement('canvas');
    renderPhotoToCanvas(photo, workCanvas, { isExport: true });
    const blob = await canvasToBlob(workCanvas, state.cfg.exportFormat, Number(state.cfg.exportQuality));
    if (blob) {
      triggerBlobDownload(blob, filename);
      notify(`Saved ${filename}`);
    }
  }

  async function exportZipBatch(onlyHighlights) {
    const targetPhotos = onlyHighlights
      ? state.photos.filter(p => p.isStarred)
      : state.photos;

    const total = targetPhotos.length;
    if (total === 0) {
      notify(onlyHighlights ? 'No photos starred yet! Press [S] to star highlights.' : 'No photos to export.');
      return;
    }

    const prefix = getBasePrefix(onlyHighlights);
    const ext = getExt();
    const mime = state.cfg.exportFormat;
    const quality = Number(state.cfg.exportQuality);

    dom.exportAllZipBtn.disabled = true;
    dom.exportHighlightsZipBtn.disabled = true;
    dom.progressBox.classList.remove('hidden');

    const workCanvas = document.createElement('canvas');
    const zipEntries = [];
    const t0 = performance.now();

    try {
      for (let i = 0; i < total; i++) {
        const photo = targetPhotos[i];
        const num = String(i + 1).padStart(2, '0');
        const filename = `${prefix}_${num}.${ext}`;
        const pct = Math.round(((i + 1) / total) * 100);

        dom.progressText.textContent = `Watermarking ${num}/${total}...`;
        dom.progressCount.textContent = pct + '%';
        dom.progressBar.style.width = pct + '%';

        await new Promise(r => requestAnimationFrame(r));
        renderPhotoToCanvas(photo, workCanvas, { isExport: true });

        const blob = await canvasToBlob(workCanvas, mime, quality);
        const arrayBuffer = await blob.arrayBuffer();
        zipEntries.push({
          name: filename,
          data: new Uint8Array(arrayBuffer)
        });
      }

      dom.progressText.textContent = 'Packaging pure offline .ZIP...';
      const zipBlob = createStoreZipBlob(zipEntries);
      const zipFilename = `${prefix}s_${state.cfg.exportResolution !== 'orig' ? state.cfg.exportResolution + 'px' : 'Master'}.zip`;
      triggerBlobDownload(zipBlob, zipFilename);

      const secs = ((performance.now() - t0) / 1000).toFixed(1);
      notify(`Exported ${total} photos in ${secs}s!`);
    } catch (err) {
      notify('Export error: ' + err.message);
    } finally {
      dom.progressBox.classList.add('hidden');
      dom.progressBar.style.width = '0%';
      renderActivePreview();
    }
  }

  async function exportAllSequentially() {
    if (state.photos.length === 0) return;
    const total = state.photos.length;
    const ext = getExt();
    const mime = state.cfg.exportFormat;
    const quality = Number(state.cfg.exportQuality);

    dom.downloadSequentialBtn.disabled = true;
    dom.progressBox.classList.remove('hidden');
    const workCanvas = document.createElement('canvas');

    try {
      for (let i = 0; i < total; i++) {
        const photo = state.photos[i];
        const prefix = getBasePrefix(photo.isStarred);
        const num = String(i + 1).padStart(2, '0');
        const filename = `${prefix}_${num}.${ext}`;
        const pct = Math.round(((i + 1) / total) * 100);

        dom.progressText.textContent = `Saving ${num}/${total}...`;
        dom.progressCount.textContent = pct + '%';
        dom.progressBar.style.width = pct + '%';

        renderPhotoToCanvas(photo, workCanvas, { isExport: true });
        const blob = await canvasToBlob(workCanvas, mime, quality);
        triggerBlobDownload(blob, filename);
        await new Promise(r => setTimeout(r, 220));
      }
      notify(`Saved ${total} individual photos!`);
    } finally {
      dom.progressBox.classList.add('hidden');
      dom.progressBar.style.width = '0%';
      dom.downloadSequentialBtn.disabled = false;
    }
  }

  /* =========================================================================
     Keyboard Shortcuts Controller (Review 100 Photos in 60s)
     ========================================================================= */
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', function (e) {
      // Ignore if user is currently typing in an input/select
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        if (e.key === 'Escape') document.activeElement.blur();
        return;
      }

      if (e.key === 'Escape') {
        dom.shortcutsModal.classList.remove('open');
        return;
      }

      // Help Modal Toggle ('?' or 'h')
      if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        dom.shortcutsModal.classList.toggle('open');
        return;
      }

      if (state.photos.length === 0) return;

      // Navigate Next ('ArrowRight' or 'd')
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        state.activeIndex = (state.activeIndex + 1) % state.photos.length;
        renderThumbnails();
        renderActivePreview();
        return;
      }

      // Navigate Previous ('ArrowLeft' or 'a')
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        state.activeIndex = (state.activeIndex - 1 + state.photos.length) % state.photos.length;
        renderThumbnails();
        renderActivePreview();
        return;
      }

      // Flip Corner (Face Protection) ('Space' or 'f' or 'F')
      if (e.key === ' ' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (state.activeIndex >= 0) {
          const p = state.photos[state.activeIndex];
          p.flipCorner = !p.flipCorner;
          renderThumbnails();
          renderActivePreview();
          notify(p.flipCorner ? 'Corner flipped (Face Protected)' : 'Standard watermark corner');
        }
        return;
      }

      // Star / Highlight Toggle ('s' or 'S')
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (state.activeIndex >= 0) {
          const p = state.photos[state.activeIndex];
          p.isStarred = !p.isStarred;
          renderThumbnails();
          renderActivePreview();
          notify(p.isStarred ? 'Marked as Highlight' : 'Removed from highlights');
        }
        return;
      }

      // Invert Text Contrast ('i' or 'I')
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        if (state.activeIndex >= 0) {
          const p = state.photos[state.activeIndex];
          p.invertText = !p.invertText;
          renderThumbnails();
          renderActivePreview();
          notify(p.invertText ? 'Text contrast inverted' : 'Default text color');
        }
        return;
      }

      // Delete / Remove Photo ('Delete' or 'Backspace')
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (state.activeIndex >= 0) {
          removePhoto(state.activeIndex);
          notify('Photo removed from batch');
        }
        return;
      }
    });
  }

  /* =========================================================================
     Event Bindings & UI Listeners
     ========================================================================= */
  function bindEvents() {
    // Theme Switcher
    dom.themeBtn.onclick = function () {
      const html = document.documentElement;
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
    };

    // Reset Studio Defaults
    dom.resetBtn.onclick = function () {
      if (!confirm('Reset all church watermark settings to defaults?')) return;
      resetConfig();
      setPrimaryLogoFromUrl(buildDefaultLogoDataUrl(), false);
      setSecondaryLogoFromUrl(buildDefaultSecLogoDataUrl(), false);
      syncUI();
      renderActivePreview();
      notify('Reset to studio defaults');
    };

    // Keyboard Shortcuts Modal
    dom.shortcutsHelpBtn.onclick = function () {
      dom.shortcutsModal.classList.add('open');
    };
    dom.closeShortcutsModal.onclick = function () {
      dom.shortcutsModal.classList.remove('open');
    };
    dom.shortcutsModal.onclick = function (e) {
      if (e.target === dom.shortcutsModal) dom.shortcutsModal.classList.remove('open');
    };

    // Primary Logo Upload & Handlers
    dom.logoInput.onchange = function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        setPrimaryLogoFromUrl(ev.target.result, true);
        notify('Primary church logo saved');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };

    dom.defaultLogoBtn.onclick = function () {
      try { localStorage.removeItem(STORAGE_LOGO_KEY); } catch (e) {}
      dom.logoSavedTag.classList.add('hidden');
      setPrimaryLogoFromUrl(buildDefaultLogoDataUrl(), false);
      notify('Default church emblem restored');
    };

    dom.removeLogoBtn.onclick = function () {
      setPrimaryLogoFromUrl(null, false);
      notify('Primary logo hidden');
    };

    // Primary 9-Grid Position
    dom.logoPosGrid.onclick = function (e) {
      const btn = e.target.closest('.pos-btn');
      if (!btn) return;
      state.cfg.logoPos = btn.dataset.pos;
      saveConfig();
      syncUI();
      renderActivePreview();
    };

    // Primary Logo Sliders & Effects
    dom.logoScale.oninput = function (e) {
      state.cfg.logoScale = parseFloat(e.target.value);
      dom.logoScaleVal.textContent = state.cfg.logoScale + '%';
      saveConfig();
      renderActivePreview();
    };
    dom.logoOpacity.oninput = function (e) {
      state.cfg.logoOpacity = parseInt(e.target.value, 10);
      dom.logoOpacityVal.textContent = state.cfg.logoOpacity + '%';
      saveConfig();
      renderActivePreview();
    };
    dom.logoMargin.oninput = function (e) {
      state.cfg.logoMargin = parseFloat(e.target.value);
      dom.logoMarginVal.textContent = state.cfg.logoMargin + '%';
      saveConfig();
      renderActivePreview();
    };
    dom.logoEffect.onchange = function (e) {
      state.cfg.logoEffect = e.target.value;
      saveConfig();
      renderActivePreview();
    };

    // Secondary Logo Controls
    dom.enableSecLogo.onchange = function (e) {
      state.cfg.enableSecLogo = e.target.checked;
      saveConfig();
      syncUI();
      renderActivePreview();
    };
    dom.secLogoInput.onchange = function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        setSecondaryLogoFromUrl(ev.target.result, true);
        notify('Secondary watermark saved');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };
    dom.defaultSecLogoBtn.onclick = function () {
      try { localStorage.removeItem(STORAGE_SEC_LOGO_KEY); } catch (e) {}
      setSecondaryLogoFromUrl(buildDefaultSecLogoDataUrl(), false);
      notify('Default social tag badge restored');
    };
    dom.removeSecLogoBtn.onclick = function () {
      setSecondaryLogoFromUrl(null, false);
      notify('Secondary logo hidden');
    };
    dom.secLogoPos.onchange = function (e) {
      state.cfg.secLogoPos = e.target.value;
      saveConfig();
      renderActivePreview();
    };
    dom.secLogoScale.oninput = function (e) {
      state.cfg.secLogoScale = parseFloat(e.target.value);
      dom.secLogoScaleVal.textContent = state.cfg.secLogoScale + '%';
      saveConfig();
      renderActivePreview();
    };
    dom.secLogoOpacity.oninput = function (e) {
      state.cfg.secLogoOpacity = parseInt(e.target.value, 10);
      dom.secLogoOpacityVal.textContent = state.cfg.secLogoOpacity + '%';
      saveConfig();
      renderActivePreview();
    };

    // Service Date & Type
    dom.serviceDate.onchange = function (e) {
      state.cfg.serviceDate = e.target.value || todayISO;
      saveConfig();
      updateNamingPreview();
    };
    dom.serviceType.onchange = function (e) {
      state.cfg.serviceType = e.target.value;
      saveConfig();
      updateNamingPreview();
    };

    // Watermark Text & Presets
    dom.watermarkText.oninput = function (e) {
      state.cfg.text = e.target.value;
      saveConfig();
      renderActivePreview();
    };
    dom.clearTextBtn.onclick = function () {
      state.cfg.text = '';
      dom.watermarkText.value = '';
      saveConfig();
      renderActivePreview();
    };

    document.querySelectorAll('.chip').forEach(chip => {
      chip.onclick = function () {
        const p = chip.dataset.preset;
        const labelType = (state.cfg.serviceType || 'Sunday_Service').replace(/_/g, ' ');
        const niceDate = formatHumanDate(state.cfg.serviceDate);
        if (p === 'service-date') {
          state.cfg.text = `${labelType} • ${niceDate}`;
        } else if (p === 'media-tag') {
          state.cfg.text = `Church Media • ${niceDate}`;
        } else if (p === 'social') {
          state.cfg.text = state.cfg.text ? `${state.cfg.text} • @ChurchMedia` : '@ChurchMedia';
        }
        dom.watermarkText.value = state.cfg.text;
        saveConfig();
        renderActivePreview();
      };
    });

    dom.textPos.onchange = function (e) {
      state.cfg.textPos = e.target.value;
      saveConfig();
      renderActivePreview();
    };
    dom.textSize.oninput = function (e) {
      state.cfg.textSize = parseFloat(e.target.value);
      dom.textSizeVal.textContent = state.cfg.textSize + '%';
      saveConfig();
      renderActivePreview();
    };
    dom.textColor.oninput = function (e) {
      state.cfg.textColor = e.target.value;
      saveConfig();
      renderActivePreview();
    };
    dom.textBgGroup.onclick = function (e) {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      state.cfg.textBg = btn.dataset.bg;
      saveConfig();
      syncUI();
      renderActivePreview();
    };

    // Export Resolution & Quality
    dom.exportResolution.onchange = function (e) {
      state.cfg.exportResolution = e.target.value;
      saveConfig();
      updateResolutionNote();
      renderActivePreview();
    };
    dom.exportFormat.onchange = function (e) {
      state.cfg.exportFormat = e.target.value;
      saveConfig();
      updateNamingPreview();
    };
    dom.exportQuality.onchange = function (e) {
      state.cfg.exportQuality = parseFloat(e.target.value);
      saveConfig();
    };

    // Stage Topbar Actions
    dom.starHighlightBtn.onclick = function () {
      if (state.activeIndex < 0) return;
      const p = state.photos[state.activeIndex];
      p.isStarred = !p.isStarred;
      renderThumbnails();
      renderActivePreview();
      notify(p.isStarred ? 'Marked as Highlight' : 'Removed from highlights');
    };
    dom.flipCornerBtn.onclick = function () {
      if (state.activeIndex < 0) return;
      const p = state.photos[state.activeIndex];
      p.flipCorner = !p.flipCorner;
      renderThumbnails();
      renderActivePreview();
    };
    dom.invertColorBtn.onclick = function () {
      if (state.activeIndex < 0) return;
      const p = state.photos[state.activeIndex];
      p.invertText = !p.invertText;
      renderThumbnails();
      renderActivePreview();
    };
    dom.removeCurrentBtn.onclick = function () {
      if (state.activeIndex >= 0) {
        removePhoto(state.activeIndex);
      }
    };

    // Prev / Next Navigation Arrows
    dom.prevBtn.onclick = function () {
      if (state.photos.length === 0) return;
      state.activeIndex = (state.activeIndex - 1 + state.photos.length) % state.photos.length;
      renderThumbnails();
      renderActivePreview();
    };
    dom.nextBtn.onclick = function () {
      if (state.photos.length === 0) return;
      state.activeIndex = (state.activeIndex + 1) % state.photos.length;
      renderThumbnails();
      renderActivePreview();
    };

    // Filmstrip Queue Tabs ('All' vs 'Highlights')
    dom.tabAll.onclick = function () {
      state.filterMode = 'all';
      dom.tabAll.classList.add('active');
      dom.tabHighlights.classList.remove('active');
      renderThumbnails();
    };
    dom.tabHighlights.onclick = function () {
      state.filterMode = 'highlights';
      dom.tabHighlights.classList.add('active');
      dom.tabAll.classList.remove('active');
      renderThumbnails();
    };

    // Batch Upload Inputs
    dom.batchInput.onchange = function (e) {
      ingestFiles(e.target.files);
      e.target.value = '';
    };
    dom.samplePhotosBtn.onclick = function (e) {
      e.stopPropagation();
      generateSamplePhotos();
    };

    // Drag and Drop
    ['dragenter', 'dragover'].forEach(evName => {
      dom.stageDropArea.addEventListener(evName, function (e) {
        e.preventDefault();
        dom.emptyStateBox.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(evName => {
      dom.stageDropArea.addEventListener(evName, function (e) {
        e.preventDefault();
        dom.emptyStateBox.classList.remove('dragover');
      });
    });
    dom.stageDropArea.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files) {
        ingestFiles(e.dataTransfer.files);
      }
    });

    // Clear Queue
    dom.clearQueueBtn.onclick = function () {
      if (state.photos.length === 0) return;
      if (!confirm('Clear all photos from queue?')) return;
      state.photos.forEach(p => {
        if (p.url && p.url.startsWith('blob:')) URL.revokeObjectURL(p.url);
      });
      state.photos = [];
      state.activeIndex = -1;
      renderThumbnails();
      renderActivePreview();
      notify('Queue cleared');
    };

    // Export Buttons
    dom.exportAllZipBtn.onclick = () => exportZipBatch(false);
    dom.exportHighlightsZipBtn.onclick = () => exportZipBatch(true);
    dom.downloadSingleBtn.onclick = downloadCurrentPhoto;
    dom.downloadSequentialBtn.onclick = exportAllSequentially;
  }

  /* =========================================================================
     App Initialization
     ========================================================================= */
  loadConfig();
  loadSavedLogos();
  syncUI();
  setupKeyboardShortcuts();
  bindEvents();
})();

/**
 * Sermon Quote Studio (Module 2)
 * High-speed sermon quote card generator for WhatsApp Status (9:16) & Instagram (1:1 / 4:5).
 * Supports transparent preacher cutouts, circular badges, cinematic half-splits,
 * custom background uploads, image movement/scaling/offsets, and custom typography templates.
 */
(function (global) {
  'use strict';

  const STORAGE_QUOTE_CFG_KEY = 'cm_studio_quotes_cfg_v2';
  const STORAGE_CUSTOM_BG_KEY = 'cm_studio_quotes_custom_bg_v2';
  const STORAGE_PREACHER_IMG_KEY = 'cm_studio_quotes_preacher_img_v2';

  const todayISO = new Date().toISOString().slice(0, 10);

  // Aspect Ratio Dimensions
  const RATIOS = {
    'story': { w: 1080, h: 1920, label: '9:16 (WhatsApp Status / Story)' },
    'square': { w: 1080, h: 1080, label: '1:1 (Instagram / Facebook Feed)' },
    'portrait': { w: 1080, h: 1350, label: '4:5 (Vertical Feed Post)' }
  };

  // Built-in Sanctuary Gradient Backgrounds
  const BUILTIN_BACKGROUNDS = {
    'midnight': {
      label: 'Midnight Sanctuary',
      draw: function (ctx, w, h) {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#0c0e17');
        g.addColorStop(0.5, '#121624');
        g.addColorStop(1, '#080a0f');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        const r = ctx.createRadialGradient(w * 0.5, h * 0.35, 60, w * 0.5, h * 0.5, Math.max(w, h) * 0.6);
        r.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
        r.addColorStop(1, 'transparent');
        ctx.fillStyle = r;
        ctx.fillRect(0, 0, w, h);
      }
    },
    'obsidian-gold': {
      label: 'Obsidian & Gold',
      draw: function (ctx, w, h) {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#0f0e0d');
        g.addColorStop(0.6, '#1a1714');
        g.addColorStop(1, '#090807');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        const r = ctx.createRadialGradient(w * 0.5, h * 0.4, 50, w * 0.5, h * 0.6, Math.max(w, h) * 0.65);
        r.addColorStop(0, 'rgba(245, 158, 11, 0.16)');
        r.addColorStop(1, 'transparent');
        ctx.fillStyle = r;
        ctx.fillRect(0, 0, w, h);
      }
    },
    'emerald': {
      label: 'Deep Emerald',
      draw: function (ctx, w, h) {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#051b14');
        g.addColorStop(0.5, '#0b2920');
        g.addColorStop(1, '#030f0b');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        const r = ctx.createRadialGradient(w * 0.5, h * 0.35, 60, w * 0.5, h * 0.5, Math.max(w, h) * 0.6);
        r.addColorStop(0, 'rgba(52, 211, 153, 0.13)');
        r.addColorStop(1, 'transparent');
        ctx.fillStyle = r;
        ctx.fillRect(0, 0, w, h);
      }
    },
    'royal-purple': {
      label: 'Royal Majesty',
      draw: function (ctx, w, h) {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#150a21');
        g.addColorStop(0.5, '#211035');
        g.addColorStop(1, '#0c0514');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        const r = ctx.createRadialGradient(w * 0.5, h * 0.35, 60, w * 0.5, h * 0.5, Math.max(w, h) * 0.6);
        r.addColorStop(0, 'rgba(192, 132, 252, 0.15)');
        r.addColorStop(1, 'transparent');
        ctx.fillStyle = r;
        ctx.fillRect(0, 0, w, h);
      }
    },
    'slate': {
      label: 'Minimal Slate',
      draw: function (ctx, w, h) {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#121216');
        g.addColorStop(1, '#1b1b22');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
    }
  };

  const defaultQuoteState = {
    ratio: 'story', // 'story' (9:16), 'square' (1:1), 'portrait' (4:5)
    quoteText: 'Faith does not deny facts; it changes the reality by anchoring your trust in the unshakeable Word of God.',
    scriptureRef: 'HEBREWS 11:1',
    seriesTitle: 'SUPERNATURAL VICTORY SERIES',
    
    // Typography Template
    fontFamily: 'sans', // 'sans' (Modern Clean), 'serif' (Editorial Serif), 'impact' (Bold Display)
    textAlign: 'left', // 'left' | 'center'
    quoteMarks: 'large', // 'large' | 'minimal' | 'none'
    customFontSize: 0, // 0 = Auto-fit; >0 = manual override in px
    textColor: '#ffffff',
    accentColor: '#f59e0b',

    // Preacher Configuration & Movement
    preacherStyle: 'badge', // 'cutout' (Transparent Cutout PNG), 'badge' (Circular Avatar), 'split' (Half Screen), 'none'
    preacherName: 'Pastor Sam Adeyemi',
    preacherTitle: 'Senior Pastor',
    preacherImg: null,
    preacherAlign: 'right', // 'right' | 'left' | 'center'
    preacherScale: 75, // percentage (30 to 120%)
    preacherOffsetX: 0, // -40 to +40%
    preacherOffsetY: 0, // -30 to +30%
    preacherFlipH: false, // flip horizontally

    // Background Configuration
    bgType: 'midnight', // 'midnight', 'obsidian-gold', 'emerald', 'royal-purple', 'slate', 'custom'
    customBgImg: null,
    bgAlignY: 'center', // 'center' | 'top' | 'bottom'
    bgDim: 45 // 0 to 90%
  };

  const quoteState = Object.assign({}, defaultQuoteState);

  // Helper: Draw rounded pill
  function drawRoundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  // Draw circular cropped image (for Avatar Badge)
  function drawCircleImage(ctx, img, cx, cy, radius, strokeColor, strokeWidth) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;
    const size = Math.min(nw, nh);
    const sx = (nw - size) / 2;
    const sy = (nh - size) / 2;

    ctx.drawImage(img, sx, sy, size, size, cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();

    if (strokeWidth && strokeWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = strokeColor || '#ffffff';
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Text Wrapping helper
  function wrapText(ctx, text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine.length === 0 ? words[i] : currentLine + ' ' + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    return lines;
  }

  function getFontCSS(fontFamily, size, weight = 700) {
    if (fontFamily === 'serif') {
      return `${weight} ${size}px Georgia, 'Times New Roman', Cambria, serif`;
    }
    if (fontFamily === 'impact') {
      return `800 ${size}px 'Arial Black', Impact, system-ui, sans-serif`;
    }
    // Default Modern Sans
    return `${weight} ${size}px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;
  }

  // Auto-fit typography engine
  function autoFitText(ctx, text, maxWidth, maxHeight, fontFamily, minFontSize = 26, maxFontSize = 74) {
    let bestSize = minFontSize;
    let bestLines = [];
    let bestLineHeight = 36;

    for (let size = maxFontSize; size >= minFontSize; size -= 2) {
      ctx.font = getFontCSS(fontFamily, size, 700);
      const lines = wrapText(ctx, text, maxWidth);
      const lineHeight = Math.round(size * 1.34);
      const totalH = lines.length * lineHeight;

      if (totalH <= maxHeight) {
        bestSize = size;
        bestLines = lines;
        bestLineHeight = lineHeight;
        break;
      }
    }
    return { fontSize: bestSize, lines: bestLines, lineHeight: bestLineHeight };
  }

  // Draw background image with cover fit and vertical alignment
  function drawCoverImage(ctx, img, targetW, targetH, alignY = 'center') {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const hRatio = targetW / iw;
    const vRatio = targetH / ih;
    const ratio = Math.max(hRatio, vRatio);

    const renderW = iw * ratio;
    const renderH = ih * ratio;
    const centerShiftX = (targetW - renderW) / 2;

    let centerShiftY = (targetH - renderH) / 2;
    if (alignY === 'top') centerShiftY = 0;
    else if (alignY === 'bottom') centerShiftY = targetH - renderH;

    ctx.drawImage(img, 0, 0, iw, ih, centerShiftX, centerShiftY, renderW, renderH);
  }

  /**
   * Draws a Transparent Preacher Cutout PNG with flexible scaling and movement
   */
  function drawPreacherCutout(ctx, img, targetW, targetH, cfg) {
    ctx.save();

    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;
    const aspect = nw / nh;

    // Scale calculation (relative to canvas height)
    const scaleFactor = (cfg.preacherScale || 75) / 100;
    const drawH = targetH * 0.72 * scaleFactor;
    const drawW = drawH * aspect;

    // Base alignment X
    let baseX = targetW - drawW;
    if (cfg.preacherAlign === 'left') {
      baseX = 0;
    } else if (cfg.preacherAlign === 'center') {
      baseX = (targetW - drawW) / 2;
    }

    // Apply X and Y Nudges / Offsets
    const offsetX = ((cfg.preacherOffsetX || 0) / 100) * targetW;
    const offsetY = ((cfg.preacherOffsetY || 0) / 100) * targetH;

    const finalX = baseX + offsetX;
    const finalY = targetH - drawH + offsetY;

    // Soft drop shadow behind preacher cutout
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = Math.max(16, drawW * 0.05);
    ctx.shadowOffsetX = cfg.preacherAlign === 'left' ? 10 : -10;
    ctx.shadowOffsetY = 12;

    if (cfg.preacherFlipH) {
      ctx.translate(finalX + drawW, finalY);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, drawW, drawH);
    } else {
      ctx.drawImage(img, finalX, finalY, drawW, drawH);
    }

    ctx.restore();
  }

  /**
   * Main Quote Card Canvas Renderer
   */
  function renderQuoteCard(canvas) {
    const cfg = quoteState;
    const dims = RATIOS[cfg.ratio] || RATIOS['story'];
    const w = dims.w;
    const h = dims.h;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Background
    if (cfg.bgType === 'custom' && cfg.customBgImg) {
      drawCoverImage(ctx, cfg.customBgImg, w, h, cfg.bgAlignY || 'center');
    } else if (BUILTIN_BACKGROUNDS[cfg.bgType]) {
      BUILTIN_BACKGROUNDS[cfg.bgType].draw(ctx, w, h);
    } else {
      BUILTIN_BACKGROUNDS['midnight'].draw(ctx, w, h);
    }

    // 2. Readability Dimmer & Gradient Scrim
    const dimAlpha = (cfg.bgDim || 45) / 100;
    if (dimAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${dimAlpha})`;
      ctx.fillRect(0, 0, w, h);

      // Bottom scrim
      const scrim = ctx.createLinearGradient(0, h * 0.25, 0, h);
      scrim.addColorStop(0, 'rgba(0, 0, 0, 0.04)');
      scrim.addColorStop(0.5, `rgba(0, 0, 0, ${Math.min(0.85, dimAlpha * 0.6)})`);
      scrim.addColorStop(1, `rgba(0, 0, 0, ${Math.min(0.94, dimAlpha * 1.15)})`);
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, w, h);
    }

    // 3. Preacher Cutout (Drawn behind text so quote is always legible)
    const isCutout = cfg.preacherStyle === 'cutout' && cfg.preacherImg;
    const isSplit = cfg.preacherStyle === 'split' && cfg.preacherImg;

    if (isCutout) {
      drawPreacherCutout(ctx, cfg.preacherImg, w, h, cfg);
    } else if (isSplit) {
      ctx.save();
      const splitW = w * 0.45;
      const splitX = cfg.preacherAlign === 'left' ? 0 : w - splitW;
      ctx.drawImage(cfg.preacherImg, 0, 0, cfg.preacherImg.naturalWidth, cfg.preacherImg.naturalHeight, splitX, 0, splitW, h);

      const fade = ctx.createLinearGradient(splitX, 0, cfg.preacherAlign === 'left' ? splitW : splitX, 0);
      if (cfg.preacherAlign === 'left') {
        fade.addColorStop(0, 'transparent');
        fade.addColorStop(1, 'rgba(8, 10, 15, 0.95)');
      } else {
        fade.addColorStop(0, 'rgba(8, 10, 15, 0.95)');
        fade.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = fade;
      ctx.fillRect(splitX, 0, splitW, h);
      ctx.restore();
    }

    const padX = Math.round(w * 0.08); // 8% padding
    let contentMaxW = w - padX * 2;
    let contentStartX = padX;

    // Adjust quote width if a preacher cutout or split is placed on a side
    if (isCutout && (cfg.preacherAlign === 'right' || cfg.preacherAlign === 'left')) {
      contentMaxW = w * 0.58;
      if (cfg.preacherAlign === 'left') {
        contentStartX = w * 0.38;
      }
    } else if (isSplit) {
      contentMaxW = w * 0.52;
      if (cfg.preacherAlign === 'left') {
        contentStartX = w * 0.44;
      }
    }

    // 4. Header: Church Logo & Series Title
    const topY = Math.round(h * 0.065);
    ctx.save();
    if (ChurchState && ChurchState.state && ChurchState.state.primaryLogoImg) {
      const logo = ChurchState.state.primaryLogoImg;
      const logoAspect = (logo.naturalWidth || 300) / (logo.naturalHeight || 90);
      const lw = Math.min(210, w * 0.22);
      const lh = lw / (logoAspect || 1);
      ctx.globalAlpha = 0.95;
      ctx.drawImage(logo, padX, topY, lw, lh);
    }

    if (cfg.seriesTitle && cfg.seriesTitle.trim().length > 0) {
      const tagStr = cfg.seriesTitle.trim().toUpperCase();
      ctx.font = '700 15px var(--font-mono), monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = cfg.accentColor || '#f59e0b';
      ctx.letterSpacing = '1.2px';
      ctx.fillText(tagStr, w - padX, topY + 22);
    }
    ctx.restore();

    // 5. Quote Body
    const quoteStr = (cfg.quoteText || '').trim();
    if (quoteStr.length > 0) {
      const isStory = cfg.ratio === 'story';
      const maxQuoteH = isStory ? h * 0.48 : h * 0.52;

      let fontSize = cfg.customFontSize > 0 ? cfg.customFontSize : 0;
      let lines = [];
      let lineHeight = 40;

      if (fontSize > 0) {
        ctx.font = getFontCSS(cfg.fontFamily, fontSize, 700);
        lines = wrapText(ctx, quoteStr, contentMaxW);
        lineHeight = Math.round(fontSize * 1.34);
      } else {
        const fitted = autoFitText(ctx, quoteStr, contentMaxW, maxQuoteH, cfg.fontFamily, isStory ? 30 : 26, isStory ? 68 : 58);
        fontSize = fitted.fontSize;
        lines = fitted.lines;
        lineHeight = fitted.lineHeight;
      }

      const totalBlockH = lines.length * lineHeight;
      let startY = isStory ? Math.round(h * 0.40 - totalBlockH / 2) : Math.round(h * 0.44 - totalBlockH / 2);
      startY = Math.max(topY + 75, startY);

      ctx.save();

      // Quotation Mark
      if (cfg.quoteMarks === 'large') {
        ctx.font = '800 100px Georgia, serif';
        ctx.fillStyle = cfg.accentColor || '#f59e0b';
        ctx.globalAlpha = 0.28;
        ctx.fillText('“', contentStartX - 8, startY + 16);
      }

      // Render Quote Lines
      ctx.globalAlpha = 1;
      ctx.fillStyle = cfg.textColor || '#ffffff';
      ctx.font = getFontCSS(cfg.fontFamily, fontSize, 700);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 3;
      ctx.textAlign = cfg.textAlign || 'left';

      const lineX = cfg.textAlign === 'center' ? (contentStartX + contentMaxW / 2) : contentStartX;

      lines.forEach((line, idx) => {
        ctx.fillText(line, lineX, startY + idx * lineHeight);
      });

      // Scripture Citation
      if (cfg.scriptureRef && cfg.scriptureRef.trim().length > 0) {
        const scripY = startY + (lines.length * lineHeight) + 32;
        ctx.font = getFontCSS(cfg.fontFamily, Math.max(16, Math.round(fontSize * 0.38)), 800);
        ctx.fillStyle = cfg.accentColor || '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.textAlign = cfg.textAlign || 'left';
        ctx.fillText(`— ${cfg.scriptureRef.trim().toUpperCase()}`, lineX, scripY);
      }
      ctx.restore();
    }

    // 6. Preacher Footer / Avatar Badge
    const footerY = Math.round(h * 0.88);
    ctx.save();

    const hasPreacher = (cfg.preacherName || '').trim().length > 0;
    if (hasPreacher && cfg.preacherStyle !== 'none') {
      const avatarRadius = Math.round(w * 0.052);
      const avatarCx = padX + avatarRadius;
      const showAvatar = cfg.preacherStyle === 'badge' && cfg.preacherImg;
      const textStartX = showAvatar ? avatarCx + avatarRadius + 18 : padX;

      if (showAvatar) {
        drawCircleImage(ctx, cfg.preacherImg, avatarCx, footerY, avatarRadius, cfg.accentColor, 3);
      }

      // Preacher Name & Title
      ctx.fillStyle = '#ffffff';
      ctx.font = getFontCSS(cfg.fontFamily, 24, 800);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 8;
      ctx.textAlign = 'left';
      ctx.fillText(cfg.preacherName.trim().toUpperCase(), textStartX, footerY - 4);

      if (cfg.preacherTitle && cfg.preacherTitle.trim().length > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = '600 15px system-ui, sans-serif';
        ctx.fillText(cfg.preacherTitle.trim(), textStartX, footerY + 20);
      }
    }

    // Social Tag (Footer Right)
    ctx.textAlign = 'right';
    ctx.font = '700 16px var(--font-mono), monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 6;
    ctx.fillText('@ChurchMediaOnline', w - padX, footerY + 8);

    ctx.restore();
  }

  // Sample Quotes
  const SAMPLE_QUOTES = [
    {
      quote: "Faith does not deny facts; it changes the reality by anchoring your trust in the unshakeable Word of God.",
      scripture: "HEBREWS 11:1",
      series: "SUPERNATURAL VICTORY SERIES",
      preacher: "Pastor Sam Adeyemi",
      title: "Senior Pastor"
    },
    {
      quote: "What God cannot do does not exist. Your situation is not the conclusion of your story; it is the platform for your testimony.",
      scripture: "LUKE 1:37",
      series: "NSPPD MORNING ALTAR",
      preacher: "Pastor Jerry Eze",
      title: "Lead Pastor"
    },
    {
      quote: "Prayer is not preparing for greater works; prayer is the greater work. When we pray, God steps into the affairs of men.",
      scripture: "JAMES 5:16",
      series: "KINGDOM FOUNDATIONS",
      preacher: "Apostle Joshua Selman",
      title: "General Overseer"
    },
    {
      quote: "You don't need a crowd to make an impact; you only need the backing of Heaven. One with God is always the majority.",
      scripture: "ROMANS 8:31",
      series: "DOMINION MANDATE",
      preacher: "Pastor Paul Adefarasin",
      title: "Senior Pastor"
    }
  ];

  global.ChurchQuotes = {
    todayISO,
    quoteState,
    RATIOS,
    BUILTIN_BACKGROUNDS,
    SAMPLE_QUOTES,
    renderQuoteCard,
    STORAGE_CUSTOM_BG_KEY,
    STORAGE_PREACHER_IMG_KEY
  };
})(window);

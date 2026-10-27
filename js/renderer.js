/**
 * High-Performance Canvas Watermark Rendering Engine
 * Supports resolution downscaling, dual watermarks, logo drop shadows,
 * face protection (corner flipping), and dynamic church metadata typography.
 */
(function (global) {
  'use strict';

  const OPPOSITE_CORNER = {
    'top-left': 'bottom-right',
    'top-center': 'bottom-center',
    'top-right': 'bottom-left',
    'center-left': 'center-right',
    'center': 'bottom-right',
    'center-right': 'center-left',
    'bottom-left': 'top-right',
    'bottom-center': 'top-center',
    'bottom-right': 'top-left'
  };

  function calcBoxAnchor(pos, canvasW, canvasH, boxW, boxH, pad) {
    let x = pad;
    let y = pad;

    if (pos === 'top-center' || pos === 'center' || pos === 'bottom-center') {
      x = (canvasW - boxW) / 2;
    } else if (pos.endsWith('right')) {
      x = canvasW - boxW - pad;
    }

    if (pos.startsWith('center')) {
      y = (canvasH - boxH) / 2;
    } else if (pos.startsWith('bottom')) {
      y = canvasH - boxH - pad;
    }
    return { x, y };
  }

  function drawRoundedPill(ctx, x, y, w, h, r) {
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

  /**
   * Computes downscaled dimensions if a target max dimension is specified
   */
  function computeDimensions(srcW, srcH, resSetting) {
    if (!resSetting || resSetting === 'orig') {
      return { w: srcW, h: srcH };
    }
    const maxDim = parseInt(resSetting, 10);
    if (!maxDim || isNaN(maxDim)) return { w: srcW, h: srcH };

    const largest = Math.max(srcW, srcH);
    if (largest <= maxDim) {
      return { w: srcW, h: srcH };
    }
    const ratio = maxDim / largest;
    return {
      w: Math.round(srcW * ratio),
      h: Math.round(srcH * ratio)
    };
  }

  /**
   * Main rendering function: applies church branding and text onto target canvas
   * @param {Object} photo - The photo object
   * @param {HTMLCanvasElement} canvas - The canvas to draw onto
   * @param {Object} options - { isExport: boolean, customRes: string }
   */
  function renderPhotoToCanvas(photo, canvas, options) {
    if (!photo || !photo.img) return;

    const opts = options || {};
    const c = ChurchState.state.cfg;

    // Determine dimensions (export downscaling vs live preview)
    let targetW = photo.w;
    let targetH = photo.h;

    if (opts.isExport && c.exportResolution && c.exportResolution !== 'orig') {
      const scaled = computeDimensions(photo.w, photo.h, c.exportResolution);
      targetW = scaled.w;
      targetH = scaled.h;
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, targetW, targetH);

    // 1. Base Photo
    ctx.drawImage(photo.img, 0, 0, targetW, targetH);

    const pad = (c.logoMargin / 100) * Math.min(targetW, targetH);
    const effectiveLogoPos = photo.flipCorner
      ? (OPPOSITE_CORNER[c.logoPos] || 'top-left')
      : c.logoPos;

    let primaryLogoRect = null;

    // 2. Primary Church Logo Watermark
    if (ChurchState.state.primaryLogoImg) {
      const logo = ChurchState.state.primaryLogoImg;
      const aspect = (logo.naturalWidth || 300) / (logo.naturalHeight || 90);
      const lw = (c.logoScale / 100) * targetW;
      const lh = lw / (aspect || 1);
      const xy = calcBoxAnchor(effectiveLogoPos, targetW, targetH, lw, lh, pad);
      primaryLogoRect = { x: xy.x, y: xy.y, w: lw, h: lh };

      ctx.save();
      ctx.globalAlpha = c.logoOpacity / 100;

      // Logo Visibility Boost (Shadow, Glow, Pill Backdrop)
      if (c.logoEffect === 'shadow') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = Math.max(5, lw * 0.04);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = Math.max(2, lw * 0.015);
      } else if (c.logoEffect === 'glow') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = Math.max(12, lw * 0.08);
      } else if (c.logoEffect === 'pill') {
        ctx.fillStyle = 'rgba(12, 12, 16, 0.55)';
        const pPadX = lw * 0.08;
        const pPadY = lh * 0.15;
        drawRoundedPill(ctx, xy.x - pPadX, xy.y - pPadY, lw + pPadX * 2, lh + pPadY * 2, 8);
      }

      ctx.drawImage(logo, primaryLogoRect.x, primaryLogoRect.y, primaryLogoRect.w, primaryLogoRect.h);
      ctx.restore();
    }

    // 3. Secondary Watermark (Sermon Theme, Social Tag, or Ministry Emblem)
    if (c.enableSecLogo && ChurchState.state.secondaryLogoImg) {
      const secLogo = ChurchState.state.secondaryLogoImg;
      const secAspect = (secLogo.naturalWidth || 200) / (secLogo.naturalHeight || 50);
      const sw = (c.secLogoScale / 100) * targetW;
      const sh = sw / (secAspect || 1);

      // Auto-avoid collision if same corner
      let secPos = c.secLogoPos || 'top-left';
      if (photo.flipCorner && secPos === effectiveLogoPos) {
        secPos = OPPOSITE_CORNER[secPos] || 'bottom-left';
      }

      const secXY = calcBoxAnchor(secPos, targetW, targetH, sw, sh, pad);

      ctx.save();
      ctx.globalAlpha = (c.secLogoOpacity || 85) / 100;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = Math.max(4, sw * 0.03);
      ctx.drawImage(secLogo, secXY.x, secXY.y, sw, sh);
      ctx.restore();
    }

    // 4. Additional Church Watermark Text & Metadata
    const textStr = (c.text || '').trim();
    if (textStr.length > 0) {
      const fontPx = Math.max(12, Math.round((c.textSize / 100) * targetW));
      ctx.save();
      ctx.font = `600 ${fontPx}px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;
      ctx.textBaseline = 'middle';

      const textW = ctx.measureText(textStr).width;
      const textH = fontPx * 1.25;
      const gap = Math.max(6, fontPx * 0.42);

      let tx = pad;
      let ty = targetH - pad - textH / 2;

      if (c.textPos.startsWith('dock-') && primaryLogoRect) {
        if (c.textPos === 'dock-below') {
          if (effectiveLogoPos.endsWith('right')) tx = primaryLogoRect.x + primaryLogoRect.w - textW;
          else if (effectiveLogoPos.includes('center')) tx = primaryLogoRect.x + (primaryLogoRect.w - textW) / 2;
          else tx = primaryLogoRect.x;

          ty = primaryLogoRect.y + primaryLogoRect.h + gap + textH / 2;
          if (ty + textH / 2 > targetH - pad * 0.35) {
            ty = primaryLogoRect.y - gap - textH / 2;
          }
        } else if (c.textPos === 'dock-above') {
          if (effectiveLogoPos.endsWith('right')) tx = primaryLogoRect.x + primaryLogoRect.w - textW;
          else if (effectiveLogoPos.includes('center')) tx = primaryLogoRect.x + (primaryLogoRect.w - textW) / 2;
          else tx = primaryLogoRect.x;

          ty = primaryLogoRect.y - gap - textH / 2;
          if (ty - textH / 2 < pad * 0.35) {
            ty = primaryLogoRect.y + primaryLogoRect.h + gap + textH / 2;
          }
        } else if (c.textPos === 'dock-beside') {
          ty = primaryLogoRect.y + primaryLogoRect.h / 2;
          if (effectiveLogoPos.endsWith('right')) {
            tx = primaryLogoRect.x - gap * 1.3 - textW;
          } else {
            tx = primaryLogoRect.x + primaryLogoRect.w + gap * 1.3;
          }
        }
      } else {
        const rawTextPos = c.textPos.startsWith('dock-') ? effectiveLogoPos : c.textPos;
        const finalTextPos = photo.flipCorner
          ? (OPPOSITE_CORNER[rawTextPos] || rawTextPos)
          : rawTextPos;
        const xy = calcBoxAnchor(finalTextPos, targetW, targetH, textW, textH, pad);
        tx = xy.x;
        ty = xy.y + textH / 2;
      }

      // Safe boundaries inside canvas frame
      tx = Math.max(pad * 0.4, Math.min(targetW - textW - pad * 0.4, tx));
      ty = Math.max(textH / 2 + 4, Math.min(targetH - textH / 2 - 4, ty));

      let colorHex = c.textColor || '#ffffff';
      if (photo.invertText) {
        colorHex = (colorHex.toLowerCase() === '#ffffff' || colorHex.toLowerCase() === '#fff')
          ? '#111116'
          : '#ffffff';
      }

      ctx.globalAlpha = c.logoOpacity / 100;

      if (c.textBg === 'pill') {
        const px = fontPx * 0.55;
        const py = fontPx * 0.3;
        ctx.fillStyle = 'rgba(10, 10, 14, 0.72)';
        drawRoundedPill(ctx, tx - px, ty - (fontPx / 2) - py, textW + px * 2, fontPx + py * 2, (fontPx + py * 2) / 2);
      } else if (c.textBg === 'shadow') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.82)';
        ctx.shadowBlur = Math.max(4, fontPx * 0.35);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = Math.max(1, fontPx * 0.08);
      }

      ctx.fillStyle = colorHex;
      ctx.fillText(textStr, tx, ty);
      ctx.restore();
    }
  }

  global.ChurchRenderer = {
    computeDimensions,
    renderPhotoToCanvas,
    OPPOSITE_CORNER
  };
})(window);

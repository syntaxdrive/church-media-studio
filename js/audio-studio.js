/**
 * Sermon Audio Packager Studio (Module 3 Controller)
 * Visual waveform trimmer, voice leveler, Telegram 64kbps MP3 compressor,
 * and ID3 metadata & album cover art packager.
 */
(function () {
  'use strict';

  const { decodeAudioFile, extractWaveformPeaks, extractTrimmedPcm, encodeToMp3, getAudioContext } = ChurchAudioEngine;
  const { packageMp3WithTags } = ChurchAudioTagger;

  const todayISO = new Date().toISOString().slice(0, 10);
  const currentYear = new Date().getFullYear();

  // State
  const audioState = {
    file: null,
    audioBuffer: null,
    peaks: null,
    duration: 0,
    currentTime: 0,
    trimStart: 0,
    trimEnd: 0,
    isPlaying: false,
    sourceNode: null,
    playbackStartCtxTime: 0,
    playbackOffset: 0,
    kbps: 64, // 64 (Telegram), 128 (Podcast), 32 (WhatsApp voice)
    normalize: true,
    meta: {
      title: 'Walking in Supernatural Dominion',
      artist: 'Pastor Sam Adeyemi',
      album: 'Sunday Sermon Series',
      year: currentYear,
      genre: 'Christian / Sermon'
    },
    coverImageBytes: null,
    coverMime: 'image/jpeg'
  };

  // DOM Elements
  const dom = {
    // Nav
    navModuleAudio: document.getElementById('navModuleAudio'),
    drawerNavAudio: document.getElementById('drawerNavAudio'),
    moduleAudioView: document.getElementById('moduleAudioView'),

    // Upload & Sample
    audioFileInput: document.getElementById('audioFileInput'),
    loadSampleAudioBtn: document.getElementById('loadSampleAudioBtn'),
    audioLoadedSection: document.getElementById('audioLoadedSection'),
    audioEmptySection: document.getElementById('audioEmptySection'),
    audioFileName: document.getElementById('audioFileName'),
    audioFileMeta: document.getElementById('audioFileMeta'),

    // Waveform & Playback
    waveformCanvas: document.getElementById('waveformCanvas'),
    audioPlayBtn: document.getElementById('audioPlayBtn'),
    audioTimeDisplay: document.getElementById('audioTimeDisplay'),
    trimStartVal: document.getElementById('trimStartVal'),
    trimEndVal: document.getElementById('trimEndVal'),
    setStartCurrentBtn: document.getElementById('setStartCurrentBtn'),
    setEndCurrentBtn: document.getElementById('setEndCurrentBtn'),
    resetTrimBtn: document.getElementById('resetTrimBtn'),

    // Audio Sizing & Quality
    audioKbpsGroup: document.getElementById('audioKbpsGroup'),
    audioKbpsNote: document.getElementById('audioKbpsNote'),
    audioNormalizeCheck: document.getElementById('audioNormalizeCheck'),

    // Metadata Fields
    sermonTitleInput: document.getElementById('sermonTitleInput'),
    sermonPreacherInput: document.getElementById('sermonPreacherInput'),
    sermonSeriesInput: document.getElementById('sermonSeriesInput'),
    sermonYearInput: document.getElementById('sermonYearInput'),

    // Cover Artwork
    audioCoverInput: document.getElementById('audioCoverInput'),
    audioCoverThumb: document.getElementById('audioCoverThumb'),
    useStudioGraphicBtn: document.getElementById('useStudioGraphicBtn'),
    removeAudioCoverBtn: document.getElementById('removeAudioCoverBtn'),

    // Export & Progress
    exportAudioBtn: document.getElementById('exportAudioBtn'),
    audioProgressBox: document.getElementById('audioProgressBox'),
    audioProgressText: document.getElementById('audioProgressText'),
    audioProgressCount: document.getElementById('audioProgressCount'),
    audioProgressBar: document.getElementById('audioProgressBar')
  };

  function notify(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function formatTime(seconds) {
    const s = Math.floor(seconds || 0);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /* =========================================================================
     Waveform Rendering
     ========================================================================= */
  function renderWaveform() {
    const canvas = dom.waveformCanvas;
    if (!canvas || !audioState.peaks) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const peaks = audioState.peaks;
    const numBars = peaks.length;
    const barW = Math.max(2, (w / numBars) - 1);
    const duration = audioState.duration || 1;

    const startX = (audioState.trimStart / duration) * w;
    const endX = (audioState.trimEnd / duration) * w;
    const playheadX = (audioState.currentTime / duration) * w;

    // Draw bars
    for (let i = 0; i < numBars; i++) {
      const x = (i / numBars) * w;
      const barH = Math.max(3, peaks[i] * (h * 0.88));
      const y = (h - barH) / 2;

      // Active vs trimmed color
      if (x >= startX && x <= endX) {
        ctx.fillStyle = '#f59e0b'; // Gold active sermon section
      } else {
        ctx.fillStyle = 'rgba(120, 120, 140, 0.28)'; // Dimmed trimmed out section
      }

      ctx.fillRect(x, y, barW, barH);
    }

    // Draw Trim Boundary Lines
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(startX, 0, 2, h);
    ctx.fillRect(endX - 2, 0, 2, h);

    // Draw Playhead Line
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(playheadX - 1, 0, 3, h);
  }

  /* =========================================================================
     Audio Playback Controls
     ========================================================================= */
  let playheadRaf = null;

  function updatePlayhead() {
    if (!audioState.isPlaying) return;
    const ctx = getAudioContext();
    const elapsed = ctx.currentTime - audioState.playbackStartCtxTime;
    audioState.currentTime = audioState.playbackOffset + elapsed;

    if (audioState.currentTime >= audioState.trimEnd) {
      stopPlayback();
      audioState.currentTime = audioState.trimStart;
    }

    dom.audioTimeDisplay.textContent = `${formatTime(audioState.currentTime)} / ${formatTime(audioState.duration)}`;
    renderWaveform();

    if (audioState.isPlaying) {
      playheadRaf = requestAnimationFrame(updatePlayhead);
    }
  }

  function startPlayback(offsetSec) {
    if (!audioState.audioBuffer) return;
    stopPlayback();

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const startAt = Math.max(audioState.trimStart, Math.min(offsetSec || audioState.currentTime, audioState.trimEnd));
    const source = ctx.createBufferSource();
    source.buffer = audioState.audioBuffer;
    source.connect(ctx.destination);

    audioState.playbackStartCtxTime = ctx.currentTime;
    audioState.playbackOffset = startAt;
    audioState.currentTime = startAt;
    audioState.isPlaying = true;
    audioState.sourceNode = source;

    source.start(0, startAt, audioState.trimEnd - startAt);
    source.onended = function () {
      if (audioState.isPlaying) {
        stopPlayback();
      }
    };

    dom.audioPlayBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span>Pause</span>';
    playheadRaf = requestAnimationFrame(updatePlayhead);
  }

  function stopPlayback() {
    audioState.isPlaying = false;
    cancelAnimationFrame(playheadRaf);
    if (audioState.sourceNode) {
      try {
        audioState.sourceNode.stop();
        audioState.sourceNode.disconnect();
      } catch (e) {}
      audioState.sourceNode = null;
    }
    dom.audioPlayBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Play Preview</span>';
    renderWaveform();
  }

  function togglePlayback() {
    if (audioState.isPlaying) {
      stopPlayback();
    } else {
      startPlayback(audioState.currentTime);
    }
  }

  /* =========================================================================
     Audio Ingestion & Setup
     ========================================================================= */
  async function loadAudioFile(file) {
    if (!file) return;
    notify('Decoding audio recording (hardware accelerated)...');

    try {
      const audioBuffer = await decodeAudioFile(file);
      audioState.file = file;
      audioState.audioBuffer = audioBuffer;
      audioState.duration = audioBuffer.duration;
      audioState.currentTime = 0;
      audioState.trimStart = 0;
      audioState.trimEnd = audioBuffer.duration;
      audioState.peaks = extractWaveformPeaks(audioBuffer, 320);

      dom.audioEmptySection.classList.add('hidden');
      dom.audioLoadedSection.classList.remove('hidden');

      dom.audioFileName.textContent = file.name;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      dom.audioFileMeta.textContent = `${audioBuffer.numberOfChannels === 1 ? 'Mono' : 'Stereo'} • ${audioBuffer.sampleRate} Hz • ${formatTime(audioBuffer.duration)} • ${sizeMb} MB Raw`;

      dom.trimStartVal.textContent = formatTime(0);
      dom.trimEndVal.textContent = formatTime(audioBuffer.duration);
      dom.audioTimeDisplay.textContent = `00:00 / ${formatTime(audioBuffer.duration)}`;

      // Resize canvas to element width
      dom.waveformCanvas.width = dom.waveformCanvas.parentElement.clientWidth || 640;
      dom.waveformCanvas.height = 96;

      renderWaveform();
      notify(`Loaded audio (${formatTime(audioBuffer.duration)})`);
    } catch (err) {
      notify('Failed to decode audio: ' + err.message);
    }
  }

  // Procedural 15-second Sample Sermon Audio for Testing
  function generateSampleAudio() {
    notify('Generating sample sermon audio clip...');
    const ctx = getAudioContext();
    const duration = 15;
    const sampleRate = 44100;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Synthesize human voice-like formants with gentle modulation
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Speech cadence envelope
      const phraseEnvelope = Math.sin(t * 1.5) > 0 ? (Math.sin(t * 5) * 0.5 + 0.5) : 0.05;
      // Vocal pitch fundamental (~140Hz) + harmonics
      const f0 = 140 + Math.sin(t * 2) * 20;
      const tone = Math.sin(2 * Math.PI * f0 * t) * 0.4 +
                   Math.sin(2 * Math.PI * f0 * 2 * t) * 0.25 +
                   Math.sin(2 * Math.PI * f0 * 3 * t) * 0.15 +
                   (Math.random() - 0.5) * 0.08; // subtle breath noise
      data[i] = tone * phraseEnvelope * 0.75;
    }

    const mockFile = { name: 'Sunday_Sermon_Master_Track.wav', size: 15 * sampleRate * 2 };
    audioState.file = mockFile;
    audioState.audioBuffer = buffer;
    audioState.duration = duration;
    audioState.currentTime = 0;
    audioState.trimStart = 1.2;
    audioState.trimEnd = 13.8;
    audioState.peaks = extractWaveformPeaks(buffer, 320);

    dom.audioEmptySection.classList.add('hidden');
    dom.audioLoadedSection.classList.remove('hidden');

    dom.audioFileName.textContent = mockFile.name;
    dom.audioFileMeta.textContent = `Mono • 44.1 kHz • ${formatTime(duration)} • Sample Track`;

    dom.trimStartVal.textContent = formatTime(1.2);
    dom.trimEndVal.textContent = formatTime(13.8);
    dom.audioTimeDisplay.textContent = `00:00 / ${formatTime(duration)}`;

    dom.waveformCanvas.width = dom.waveformCanvas.parentElement.clientWidth || 640;
    dom.waveformCanvas.height = 96;

    renderWaveform();
    notify('Loaded 15s sample sermon track');
  }

  /* =========================================================================
     Cover Artwork Handling
     ========================================================================= */
  function setCoverImageFromUrl(dataUrl) {
    if (!dataUrl) {
      audioState.coverImageBytes = null;
      dom.audioCoverThumb.style.display = 'none';
      return;
    }
    const mime = dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
    audioState.coverMime = mime;

    // Convert data URL to binary Uint8Array
    const parts = dataUrl.split(',');
    const raw = atob(parts[1]);
    const u8 = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      u8[i] = raw.charCodeAt(i);
    }
    audioState.coverImageBytes = u8;
    dom.audioCoverThumb.src = dataUrl;
    dom.audioCoverThumb.style.display = 'block';
    notify('Cover artwork attached');
  }

  /* =========================================================================
     Audio Encoding & Export Pipeline
     ========================================================================= */
  async function exportSermonMp3() {
    if (!audioState.audioBuffer) {
      notify('Please load a sermon audio recording first.');
      return;
    }

    stopPlayback();
    dom.exportAudioBtn.disabled = true;
    dom.audioProgressBox.classList.remove('hidden');

    const t0 = performance.now();

    try {
      dom.audioProgressText.textContent = 'Trimming and normalizing vocals...';
      dom.audioProgressCount.textContent = '10%';
      dom.audioProgressBar.style.width = '10%';

      await new Promise(r => setTimeout(r, 60));

      const { pcm16, sampleRate, duration } = extractTrimmedPcm(
        audioState.audioBuffer,
        audioState.trimStart,
        audioState.trimEnd,
        audioState.normalize
      );

      dom.audioProgressText.textContent = `Encoding ${audioState.kbps}kbps MP3 for Telegram/WhatsApp...`;
      const rawMp3Bytes = await encodeToMp3(pcm16, sampleRate, audioState.kbps, function (pct) {
        dom.audioProgressCount.textContent = pct + '%';
        dom.audioProgressBar.style.width = pct + '%';
      });

      dom.audioProgressText.textContent = 'Injecting ID3 tags and album cover art...';

      // Read metadata from inputs
      const meta = {
        title: (dom.sermonTitleInput.value || 'Sunday Sermon').trim(),
        artist: (dom.sermonPreacherInput.value || 'Pastor').trim(),
        album: (dom.sermonSeriesInput.value || 'Sermon Series').trim(),
        year: parseInt(dom.sermonYearInput.value, 10) || currentYear,
        genre: 'Sermon'
      };

      const finalBlob = packageMp3WithTags(
        rawMp3Bytes,
        meta,
        audioState.coverImageBytes,
        audioState.coverMime
      );

      // Trigger download
      const preacherTag = meta.artist.replace(/[^a-zA-Z0-9]/g, '_');
      const titleTag = meta.title.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${todayISO}_${preacherTag}_${titleTag}_${audioState.kbps}k.mp3`;

      const downloadUrl = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

      const mbSize = (finalBlob.size / (1024 * 1024)).toFixed(1);
      const secs = ((performance.now() - t0) / 1000).toFixed(1);
      notify(`Exported ${mbSize} MB MP3 in ${secs}s! Ready for Telegram.`);
    } catch (err) {
      notify('Export error: ' + err.message);
    } finally {
      dom.audioProgressBox.classList.add('hidden');
      dom.audioProgressBar.style.width = '0%';
      dom.exportAudioBtn.disabled = false;
    }
  }

  /* =========================================================================
     Event Bindings & Switcher
     ========================================================================= */
  function bindAudioEvents() {
    // 1. Suite Switcher
    function switchToAudioModule() {
      document.querySelectorAll('.suite-nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.drawer-nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.workspace').forEach(w => w.classList.add('hidden'));

      if (dom.navModuleAudio) dom.navModuleAudio.classList.add('active');
      if (dom.drawerNavAudio) dom.drawerNavAudio.classList.add('active');
      if (dom.moduleAudioView) dom.moduleAudioView.classList.remove('hidden');

      const mobileDrawer = document.getElementById('mobileDrawer');
      if (mobileDrawer) mobileDrawer.classList.remove('open');

      if (audioState.audioBuffer && dom.waveformCanvas) {
        dom.waveformCanvas.width = dom.waveformCanvas.parentElement.clientWidth || 640;
        renderWaveform();
      }
    }

    if (dom.navModuleAudio) dom.navModuleAudio.onclick = switchToAudioModule;
    if (dom.drawerNavAudio) dom.drawerNavAudio.onclick = switchToAudioModule;

    // 2. Audio File Ingestion
    dom.audioFileInput.onchange = function (e) {
      const file = e.target.files && e.target.files[0];
      if (file) loadAudioFile(file);
      e.target.value = '';
    };

    dom.loadSampleAudioBtn.onclick = generateSampleAudio;

    // 3. Waveform Scrubber & Seeker
    dom.waveformCanvas.onclick = function (e) {
      if (!audioState.audioBuffer) return;
      const rect = dom.waveformCanvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      const targetSec = pct * audioState.duration;

      audioState.currentTime = targetSec;
      if (audioState.isPlaying) {
        startPlayback(targetSec);
      } else {
        dom.audioTimeDisplay.textContent = `${formatTime(targetSec)} / ${formatTime(audioState.duration)}`;
        renderWaveform();
      }
    };

    dom.audioPlayBtn.onclick = togglePlayback;

    // 4. Trimming Markers
    dom.setStartCurrentBtn.onclick = function () {
      if (!audioState.audioBuffer) return;
      audioState.trimStart = Math.min(audioState.currentTime, audioState.trimEnd - 1);
      dom.trimStartVal.textContent = formatTime(audioState.trimStart);
      renderWaveform();
      notify(`Trim Start set to ${formatTime(audioState.trimStart)}`);
    };

    dom.setEndCurrentBtn.onclick = function () {
      if (!audioState.audioBuffer) return;
      audioState.trimEnd = Math.max(audioState.currentTime, audioState.trimStart + 1);
      dom.trimEndVal.textContent = formatTime(audioState.trimEnd);
      renderWaveform();
      notify(`Trim End set to ${formatTime(audioState.trimEnd)}`);
    };

    dom.resetTrimBtn.onclick = function () {
      if (!audioState.audioBuffer) return;
      audioState.trimStart = 0;
      audioState.trimEnd = audioState.duration;
      dom.trimStartVal.textContent = formatTime(0);
      dom.trimEndVal.textContent = formatTime(audioState.duration);
      renderWaveform();
      notify('Trim reset to full sermon');
    };

    // 5. Bitrate Selection
    dom.audioKbpsGroup.onclick = function (e) {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      audioState.kbps = parseInt(btn.dataset.kbps, 10);
      dom.audioKbpsGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (audioState.kbps === 64) {
        dom.audioKbpsNote.textContent = '64kbps CBR Voice Mono: The sweet spot for Telegram & WhatsApp (~25MB - 35MB per hour)';
      } else if (audioState.kbps === 128) {
        dom.audioKbpsNote.textContent = '128kbps Standard: Great for Apple Podcasts, Spotify & Mixlr archives (~55MB per hour)';
      } else {
        dom.audioKbpsNote.textContent = '32kbps Ultra-Compact: For low-bandwidth WhatsApp voice broadcast (~14MB per hour)';
      }
    };

    dom.audioNormalizeCheck.onchange = function (e) {
      audioState.normalize = e.target.checked;
    };

    // 6. Cover Artwork
    dom.audioCoverInput.onchange = function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        setCoverImageFromUrl(ev.target.result);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };

    dom.removeAudioCoverBtn.onclick = function () {
      setCoverImageFromUrl(null);
      notify('Cover artwork removed');
    };

    // Pull cover directly from Quote Studio or Church Logo
    dom.useStudioGraphicBtn.onclick = function () {
      // First check if Sermon Quote Studio has a rendered canvas
      const quoteCanvas = document.getElementById('quoteCanvas');
      if (quoteCanvas && quoteCanvas.width > 0) {
        const dataUrl = quoteCanvas.toDataURL('image/jpeg', 0.9);
        setCoverImageFromUrl(dataUrl);
        notify('Attached Sermon Quote Graphic as Cover Art');
        return;
      }
      // Or check saved custom background
      try {
        const savedBg = localStorage.getItem('cm_studio_quotes_custom_bg_v2');
        if (savedBg) {
          setCoverImageFromUrl(savedBg);
          notify('Attached Custom Series Graphic as Cover Art');
          return;
        }
      } catch (e) {}

      notify('Generate a Quote Card or upload a series graphic first');
    };

    // 7. Export Trigger
    dom.exportAudioBtn.onclick = exportSermonMp3;

    // Window resize waveform redraw
    window.addEventListener('resize', function () {
      if (audioState.audioBuffer && dom.waveformCanvas && !dom.moduleAudioView.classList.contains('hidden')) {
        dom.waveformCanvas.width = dom.waveformCanvas.parentElement.clientWidth || 640;
        renderWaveform();
      }
    });
  }

  bindAudioEvents();
})();

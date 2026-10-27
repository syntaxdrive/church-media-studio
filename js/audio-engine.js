/**
 * High-Speed Offline Audio Processing & MP3 Encoding Engine
 * Performs audio decoding, waveform extraction, dynamic vocal normalization,
 * trimming, and LAME MP3 encoding in pure client-side JavaScript.
 */
(function (global) {
  'use strict';

  let sharedAudioCtx = null;
  function getAudioContext() {
    if (!sharedAudioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      sharedAudioCtx = new AudioContextClass();
    }
    return sharedAudioCtx;
  }

  /**
   * Decodes an audio file (WAV, MP3, M4A, AAC) into an AudioBuffer
   */
  async function decodeAudioFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const ctx = getAudioContext();
    // decodeAudioData returns a Promise in modern browsers
    return await ctx.decodeAudioData(arrayBuffer);
  }

  /**
   * Extracts visual peaks for drawing the sermon waveform
   * @param {AudioBuffer} audioBuffer
   * @param {number} numBars
   * @returns {Float32Array} Normalized peaks between 0 and 1
   */
  function extractWaveformPeaks(audioBuffer, numBars = 360) {
    const rawData = audioBuffer.getChannelData(0);
    const totalSamples = rawData.length;
    const blockSize = Math.floor(totalSamples / numBars);
    const peaks = new Float32Array(numBars);

    for (let i = 0; i < numBars; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j += 10) { // step by 10 for high speed
        const val = Math.abs(rawData[start + j] || 0);
        if (val > max) max = val;
      }
      peaks[i] = max;
    }

    // Normalize peaks
    let highest = 0;
    for (let i = 0; i < numBars; i++) {
      if (peaks[i] > highest) highest = peaks[i];
    }
    if (highest > 0) {
      for (let i = 0; i < numBars; i++) {
        peaks[i] = Math.min(1, peaks[i] / highest);
      }
    }

    return peaks;
  }

  /**
   * Trims, normalizes, and downmixes AudioBuffer into 16-bit PCM integer samples
   */
  function extractTrimmedPcm(audioBuffer, startTime, endTime, shouldNormalize = true) {
    const sampleRate = audioBuffer.sampleRate;
    const totalDuration = audioBuffer.duration;

    const startSec = Math.max(0, Math.min(startTime, totalDuration));
    const endSec = Math.max(startSec + 0.5, Math.min(endTime, totalDuration));

    const startSample = Math.floor(startSec * sampleRate);
    const endSample = Math.floor(endSec * sampleRate);
    const numSamples = endSample - startSample;

    const ch0 = audioBuffer.getChannelData(0);
    const hasCh1 = audioBuffer.numberOfChannels > 1;
    const ch1 = hasCh1 ? audioBuffer.getChannelData(1) : null;

    // 1. Downmix to Mono (Halves speech file size with zero vocal degradation)
    const floatMono = new Float32Array(numSamples);
    let peak = 0;

    for (let i = 0; i < numSamples; i++) {
      const idx = startSample + i;
      let sample = ch0[idx] || 0;
      if (hasCh1) {
        sample = (sample + (ch1[idx] || 0)) * 0.5;
      }
      floatMono[i] = sample;
      const abs = Math.abs(sample);
      if (abs > peak) peak = abs;
    }

    // 2. Normalization (Peak at -1dB ~ 0.89 to prevent clipping while boosting quiet speech)
    let gain = 1.0;
    if (shouldNormalize && peak > 0.05) {
      gain = 0.89 / peak;
      // Cap gain to 3.5x to avoid amplifying room background noise excessively
      gain = Math.min(3.5, gain);
    }

    // 3. Convert to 16-bit Signed Integer PCM
    const pcm16 = new Int16Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      let s = floatMono[i] * gain;
      if (s > 1.0) s = 1.0;
      else if (s < -1.0) s = -1.0;
      // Scale to 16-bit range (-32768 to 32767)
      pcm16[i] = s < 0 ? s * 32768 : s * 32767;
    }

    return {
      pcm16,
      sampleRate,
      duration: numSamples / sampleRate
    };
  }

  /**
   * Encodes 16-bit PCM Mono audio to MP3 using client-side LAME encoder
   * @param {Int16Array} pcm16 - Mono PCM 16-bit samples
   * @param {number} sampleRate - e.g. 44100
   * @param {number} kbps - e.g. 64 (Telegram compact) or 128 (Podcast)
   * @param {function} onProgress - Callback with percentage
   * @returns {Promise<Uint8Array>} Raw MP3 byte stream
   */
  async function encodeToMp3(pcm16, sampleRate, kbps = 64, onProgress) {
    if (!window.lamejs || !window.lamejs.Mp3Encoder) {
      throw new Error('LAME MP3 encoder library not loaded');
    }

    const channels = 1; // Mono for voice/sermon
    const encoder = new window.lamejs.Mp3Encoder(channels, sampleRate, kbps);
    const mp3Chunks = [];

    const chunkSize = 1152 * 4; // Process in multiple LAME blocks for speed
    const totalSamples = pcm16.length;
    let offset = 0;

    while (offset < totalSamples) {
      const slice = pcm16.subarray(offset, Math.min(totalSamples, offset + chunkSize));
      const mp3buf = encoder.encodeBuffer(slice);
      if (mp3buf && mp3buf.length > 0) {
        mp3Chunks.push(new Uint8Array(mp3buf));
      }
      offset += chunkSize;

      // Yield every ~15 chunks to allow UI progress bar updates
      if (offset % (chunkSize * 15) === 0) {
        if (onProgress) {
          onProgress(Math.round((offset / totalSamples) * 100));
        }
        await new Promise(r => setTimeout(r, 0));
      }
    }

    // Flush remaining frames
    const endBuf = encoder.flush();
    if (endBuf && endBuf.length > 0) {
      mp3Chunks.push(new Uint8Array(endBuf));
    }

    if (onProgress) onProgress(100);

    // Concatenate all MP3 chunks
    let totalLen = 0;
    for (let i = 0; i < mp3Chunks.length; i++) {
      totalLen += mp3Chunks[i].length;
    }

    const fullMp3Bytes = new Uint8Array(totalLen);
    let writeOffset = 0;
    for (let i = 0; i < mp3Chunks.length; i++) {
      fullMp3Bytes.set(mp3Chunks[i], writeOffset);
      writeOffset += mp3Chunks[i].length;
    }

    return fullMp3Bytes;
  }

  global.ChurchAudioEngine = {
    decodeAudioFile,
    extractWaveformPeaks,
    extractTrimmedPcm,
    encodeToMp3,
    getAudioContext
  };
})(window);

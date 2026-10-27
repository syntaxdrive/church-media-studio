/**
 * Pure JavaScript ID3v2.3 Tag Writer
 * Embeds Title, Preacher (Artist), Sermon Series (Album), Year, Genre,
 * and Album Cover Artwork (APIC frame) into MP3 files without external libraries.
 */
(function (global) {
  'use strict';

  function encodeUTF16LE(str) {
    const buf = new Uint8Array(2 + str.length * 2);
    buf[0] = 0xff; // BOM
    buf[1] = 0xfe;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      buf[2 + i * 2] = code & 0xff;
      buf[2 + i * 2 + 1] = (code >> 8) & 0xff;
    }
    return buf;
  }

  function encodeISO(str) {
    const buf = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      buf[i] = str.charCodeAt(i) & 0xff;
    }
    return buf;
  }

  function createTextFrame(frameId, text) {
    if (!text || text.trim().length === 0) return null;
    const utf16Bytes = encodeUTF16LE(text.trim());
    const dataLen = 1 + utf16Bytes.length; // 1 byte encoding flag (0x01) + UTF-16LE data

    const frame = new Uint8Array(10 + dataLen);
    const view = new DataView(frame.buffer);

    // Frame ID (4 bytes)
    for (let i = 0; i < 4; i++) {
      frame[i] = frameId.charCodeAt(i);
    }
    // Size (4 bytes, big endian)
    view.setUint32(4, dataLen, false);
    // Flags (2 bytes = 0x00, 0x00)
    frame[8] = 0;
    frame[9] = 0;

    // Encoding byte: 0x01 = UTF-16 with BOM
    frame[10] = 0x01;
    frame.set(utf16Bytes, 11);

    return frame;
  }

  function createApicFrame(imageBytes, mimeType = 'image/jpeg') {
    if (!imageBytes || imageBytes.length === 0) return null;

    const mimeBytes = encodeISO(mimeType);
    // Encoding (1 byte = 0x00 ISO) + MIME string + null (1 byte) + Picture type (1 byte: 0x03 Front cover) + Description null (1 byte: 0x00) + Image data
    const dataLen = 1 + mimeBytes.length + 1 + 1 + 1 + imageBytes.length;

    const frame = new Uint8Array(10 + dataLen);
    const view = new DataView(frame.buffer);

    // Frame ID = 'APIC'
    frame[0] = 0x41; // A
    frame[1] = 0x50; // P
    frame[2] = 0x49; // I
    frame[3] = 0x43; // C

    view.setUint32(4, dataLen, false);
    frame[8] = 0;
    frame[9] = 0;

    let pos = 10;
    frame[pos++] = 0x00; // Encoding = ISO-8859-1

    frame.set(mimeBytes, pos);
    pos += mimeBytes.length;
    frame[pos++] = 0x00; // Terminate MIME

    frame[pos++] = 0x03; // Picture Type: 0x03 = Cover (front)
    frame[pos++] = 0x00; // Description (empty string, 1 null byte)

    frame.set(imageBytes, pos);

    return frame;
  }

  /**
   * Builds a complete ID3v2.3 tag header and payload
   * @param {Object} meta - { title, artist, album, year, genre }
   * @param {Uint8Array} coverImageBytes - optional binary image data
   * @param {string} coverMime - 'image/jpeg' or 'image/png'
   * @returns {Uint8Array}
   */
  function buildId3v2Tag(meta, coverImageBytes, coverMime) {
    const frames = [];

    if (meta.title) frames.push(createTextFrame('TIT2', meta.title));
    if (meta.artist) frames.push(createTextFrame('TPE1', meta.artist));
    if (meta.album) frames.push(createTextFrame('TALB', meta.album));
    if (meta.year) frames.push(createTextFrame('TYER', String(meta.year)));
    if (meta.genre) frames.push(createTextFrame('TCON', meta.genre));

    if (coverImageBytes && coverImageBytes.length > 0) {
      const apic = createApicFrame(coverImageBytes, coverMime || 'image/jpeg');
      if (apic) frames.push(apic);
    }

    const validFrames = frames.filter(f => f !== null);
    let framesSize = 0;
    for (let i = 0; i < validFrames.length; i++) {
      framesSize += validFrames[i].length;
    }

    // 10-byte ID3v2 Header
    const tag = new Uint8Array(10 + framesSize);
    tag[0] = 0x49; // I
    tag[1] = 0x44; // D
    tag[2] = 0x33; // 3
    tag[3] = 0x03; // Version 2.3
    tag[4] = 0x00; // Revision
    tag[5] = 0x00; // Flags

    // Syncsafe size (each byte uses 7 bits)
    tag[6] = (framesSize >> 21) & 0x7f;
    tag[7] = (framesSize >> 14) & 0x7f;
    tag[8] = (framesSize >> 7) & 0x7f;
    tag[9] = framesSize & 0x7f;

    let offset = 10;
    for (let i = 0; i < validFrames.length; i++) {
      tag.set(validFrames[i], offset);
      offset += validFrames[i].length;
    }

    return tag;
  }

  /**
   * Prepends ID3v2 tag to MP3 data chunks and returns an MP3 Blob
   */
  function packageMp3WithTags(mp3Bytes, meta, coverImageBytes, coverMime) {
    const id3Tag = buildId3v2Tag(meta, coverImageBytes, coverMime);
    return new Blob([id3Tag, mp3Bytes], { type: 'audio/mpeg' });
  }

  global.ChurchAudioTagger = {
    buildId3v2Tag,
    packageMp3WithTags
  };
})(window);

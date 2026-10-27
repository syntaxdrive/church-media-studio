/**
 * Pure JavaScript Uncompressed ZIP Generator (Zero External Libraries)
 * Computes standard CRC-32 and outputs valid .ZIP blobs directly in memory.
 */
(function (global) {
  'use strict';

  // Precomputed CRC32 Table
  const crcTable = (function () {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  /**
   * Creates a standard .zip Blob from an array of file objects:
   * @param {Array<{ name: string, data: Uint8Array }>} files
   * @returns {Blob}
   */
  function createStoreZipBlob(files) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    const now = new Date();
    // MS-DOS Time: bits 0-4=seconds/2, bits 5-10=minute, bits 11-15=hour
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (Math.floor(now.getSeconds() / 2));
    // MS-DOS Date: bits 0-4=day, bits 5-8=month, bits 9-15=year-1980
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

    for (let i = 0; i < files.length; i++) {
      const nameBytes = encoder.encode(files[i].name);
      const dataBytes = files[i].data;
      const crc = crc32(dataBytes);
      const size = dataBytes.length;

      // 1. Local File Header (30 bytes + filename)
      const lfh = new Uint8Array(30 + nameBytes.length);
      const lfhView = new DataView(lfh.buffer);
      lfhView.setUint32(0, 0x04034b50, true); // Signature
      lfhView.setUint16(4, 20, true);         // Version needed (2.0)
      lfhView.setUint16(6, 0x0800, true);     // UTF-8 filename flag
      lfhView.setUint16(8, 0, true);          // Compression method (0 = uncompressed STORE)
      lfhView.setUint16(10, dosTime, true);   // Mod time
      lfhView.setUint16(12, dosDate, true);   // Mod date
      lfhView.setUint32(14, crc, true);       // CRC32
      lfhView.setUint32(18, size, true);      // Compressed size
      lfhView.setUint32(22, size, true);      // Uncompressed size
      lfhView.setUint16(26, nameBytes.length, true); // Filename length
      lfhView.setUint16(28, 0, true);         // Extra field length
      lfh.set(nameBytes, 30);

      localParts.push(lfh, dataBytes);

      // 2. Central Directory Header (46 bytes + filename)
      const cdh = new Uint8Array(46 + nameBytes.length);
      const cdhView = new DataView(cdh.buffer);
      cdhView.setUint32(0, 0x02014b50, true); // Signature
      cdhView.setUint16(4, 20, true);         // Version made by
      cdhView.setUint16(6, 20, true);         // Version needed
      cdhView.setUint16(8, 0x0800, true);     // Flags (UTF-8)
      cdhView.setUint16(10, 0, true);         // Compression method
      cdhView.setUint16(12, dosTime, true);
      cdhView.setUint16(14, dosDate, true);
      cdhView.setUint32(16, crc, true);
      cdhView.setUint32(20, size, true);
      cdhView.setUint32(24, size, true);
      cdhView.setUint16(28, nameBytes.length, true);
      cdhView.setUint16(30, 0, true);         // Extra field length
      cdhView.setUint16(32, 0, true);         // File comment length
      cdhView.setUint16(34, 0, true);         // Disk number start
      cdhView.setUint16(36, 0, true);         // Internal attributes
      cdhView.setUint32(38, 0, true);         // External attributes
      cdhView.setUint32(42, offset, true);    // Relative offset of LFH
      cdh.set(nameBytes, 46);

      centralParts.push(cdh);
      offset += lfh.length + size;
    }

    let centralSize = 0;
    for (let i = 0; i < centralParts.length; i++) {
      centralSize += centralParts[i].length;
    }

    // 3. End of Central Directory Record (22 bytes)
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true); // Signature
    eocdView.setUint16(4, 0, true);          // Number of this disk
    eocdView.setUint16(6, 0, true);          // Disk with central dir
    eocdView.setUint16(8, files.length, true);   // Total entries on disk
    eocdView.setUint16(10, files.length, true);  // Total entries
    eocdView.setUint32(12, centralSize, true);   // Size of central dir
    eocdView.setUint32(16, offset, true);        // Offset of central dir
    eocdView.setUint16(20, 0, true);             // ZIP comment length

    return new Blob([...localParts, ...centralParts, eocd], { type: 'application/zip' });
  }

  // Export
  global.ChurchZip = {
    crc32,
    createStoreZipBlob
  };
})(window);

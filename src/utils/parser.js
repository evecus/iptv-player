/**
 * Parse M3U/M3U8/TXT playlist content into structured channel objects.
 * Supports: #EXTM3U, #EXTINF, group-title, tvg-logo, tvg-id, tvg-name
 * Also supports plain URL lists (one URL per line)
 */
export function parsePlaylist(content) {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const channels = [];

  const isM3U = lines[0]?.startsWith('#EXTM3U') || lines.some((l) => l.startsWith('#EXTINF'));

  if (isM3U) {
    let meta = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#EXTINF')) {
        meta = parseExtInf(line);
      } else if (!line.startsWith('#') && line.length > 0) {
        if (meta) {
          channels.push({ ...meta, url: line, id: generateId() });
          meta = null;
        } else {
          // URL without EXTINF
          channels.push({
            id: generateId(),
            name: extractNameFromUrl(line),
            group: 'Ungrouped',
            logo: '',
            url: line,
          });
        }
      }
    }
  } else {
    // Plain text: one URL per line, optional "name,url" or "name|url" format
    for (const line of lines) {
      if (line.startsWith('#') || line.startsWith('//')) continue;
      const separators = [',', '|', '\t'];
      let parsed = false;
      for (const sep of separators) {
        const idx = line.lastIndexOf(sep);
        if (idx > 0) {
          const maybeUrl = line.slice(idx + 1).trim();
          if (isUrl(maybeUrl)) {
            channels.push({
              id: generateId(),
              name: line.slice(0, idx).trim() || extractNameFromUrl(maybeUrl),
              group: 'Ungrouped',
              logo: '',
              url: maybeUrl,
            });
            parsed = true;
            break;
          }
        }
      }
      if (!parsed && isUrl(line)) {
        channels.push({
          id: generateId(),
          name: extractNameFromUrl(line),
          group: 'Ungrouped',
          logo: '',
          url: line,
        });
      }
    }
  }

  return channels;
}

function parseExtInf(line) {
  const result = { name: 'Unknown', group: 'Ungrouped', logo: '', tvgId: '' };

  // Extract attributes
  const attrMatch = line.match(/#EXTINF:[^,]*(,.*)?$/);
  if (attrMatch) {
    const name = attrMatch[1]?.slice(1).trim();
    if (name) result.name = name;
  }

  const groupMatch = line.match(/group-title="([^"]*)"/i);
  if (groupMatch) result.group = groupMatch[1] || 'Ungrouped';

  const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
  if (logoMatch) result.logo = logoMatch[1];

  const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
  if (tvgIdMatch) result.tvgId = tvgIdMatch[1];

  const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
  if (tvgNameMatch && tvgNameMatch[1]) result.name = tvgNameMatch[1];

  return result;
}

function isUrl(str) {
  return /^https?:\/\/.+/i.test(str) || /^rtmp:\/\/.+/i.test(str) || /^rtp:\/\/.+/i.test(str);
}

function extractNameFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || u.hostname;
    return decodeURIComponent(last.replace(/\.[^.]+$/, ''));
  } catch {
    return url.slice(0, 40);
  }
}

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function groupChannels(channels) {
  const groups = {};
  for (const ch of channels) {
    const g = ch.group || 'Ungrouped';
    if (!groups[g]) groups[g] = [];
    groups[g].push(ch);
  }
  return groups;
}

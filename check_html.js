const fs = require('fs');

['web/anbar.html', 'web/musteriler.html'].forEach(file => {
  console.log('Testing', file);
  const html = fs.readFileSync(file, 'utf8');
  console.log('  Size:', html.length, 'bytes');

  // Check script tags
  const scripts = [...html.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)];
  let ok = true;
  scripts.forEach((s, i) => {
    if (s[1].trim()) {
      try {
        new Function(s[1]);
      } catch(e) {
        console.error('  Script ' + i + ' syntax error:', e.message);
        ok = false;
      }
    }
  });
  if (ok) console.log('  All inline scripts valid JavaScript syntax!');

  // Check critical IDs
  ['authScreen', 'tblBody', 'mobileBottomNav', 'moreSheet', 'secKpis', 'secTable'].forEach(id => {
    if (!html.includes(`id="${id}"`)) {
      console.error('  Missing ID:', id);
    } else {
      console.log('  Found ID:', id);
    }
  });
});

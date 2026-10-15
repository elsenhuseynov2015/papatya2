/* =====================================================================
   PAPATYA KASSA — QRAFİKLƏR, ANALİTİKA VƏ SLAYDER MODULU (charts.js)
   ===================================================================== */
/* =====================================================================
   13) SPARKLINE
   ===================================================================== */
function renderSparkline(el, data, color) {
  if (!el) return;
  if (!data || data.length < 2) { el.innerHTML = ''; return; }
  const w = 60, h = 22;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <polygon class="spark-area" points="${areaPoints}"/>
    <polyline class="spark-line" points="${points}"/>
  </svg>`;
}



/* =====================================================================
   15) CHARTS
   ===================================================================== */
function buildBuckets(rows){
  const map = new Map();
  rows.forEach(s => {
    if (s.isQaytarma) return;
    const o = map.get(s.tarix) || { negd:0, nisye:0, total:0, qazanc:0, count:0 };
    if (s.nov === 'negd') o.negd += s.satis; else o.nisye += s.satis;
    o.total += s.satis; o.qazanc += s.qazanc; o.count++;
    map.set(s.tarix, o);
  });
  const days = [...map.keys()].sort();
  if (days.length === 0) return [];
  if (days.length <= 62) return days.map(d => ({ label: d.slice(8) + '.' + d.slice(5, 7), full: d, ...map.get(d) }));
  const out = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    const o = { negd:0, nisye:0, total:0, qazanc:0, count:0 };
    chunk.forEach(d => {
      const v = map.get(d);
      if (v) { o.negd += v.negd; o.nisye += v.nisye; o.total += v.total; o.qazanc += v.qazanc; o.count += v.count; }
    });
    out.push({ label: chunk[0].slice(8) + '.' + chunk[0].slice(5,7), full: chunk[0] + ' → ' + chunk[chunk.length-1], ...o });
  }
  return out;
}
function renderChart(rows){
  const chart = $('chart');
  const data = buildBuckets(rows);
  chart.innerHTML = '';
  if (!data.length) {
    chart.innerHTML = '<div style="margin:auto;color:#5f6b87;font-size:13px;font-weight:600">Seçilmiş dövr üzrə qrafik məlumatı yoxdur</div>';
    return;
  }
  const max = Math.max(...data.map(d => d.total)) || 1;
  const step = Math.ceil(data.length / 14);
  data.forEach((d, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    const h = Math.max((d.total / max) * 100, 1.5);
    const pN = d.total ? (d.negd / d.total) * 100 : 0;
    const pC = d.total ? (d.nisye / d.total) * 100 : 0;
    bar.innerHTML = `<div class="bar-inner" style="--h:${h}%;animation-delay:${Math.min(i * 14, 500)}ms">
        <div class="seg negd" style="height:${pN}%"></div>
        <div class="seg nisye" style="height:${pC}%"></div>
      </div>
      ${(i % step === 0 || i === data.length - 1) ? `<div class="bar-lbl">${d.label}</div>` : ''}`;
    bar.addEventListener('mouseenter', e => showTip(e, d));
    bar.addEventListener('mousemove', e => moveTip(e));
    bar.addEventListener('mouseleave', hideTip);
    chart.appendChild(bar);
  });
  if ($('mainSliderSubtitle') && currentMainSlide === 0) {
    $('mainSliderSubtitle').textContent = `Səhifə 1 / 2 • ${data.length} ${data.length > 62 ? 'həftə' : 'gün'} • pik: ${money(max)}`;
  }
}
const tip = $('tooltip');
function showTip(e, d){
  tip.innerHTML = `<b>${d.full}</b>
    <div class="row"><span>Satış sayı</span><span>${d.count}</span></div>
    <div class="row cy"><span>Nəğd</span><span>${money(d.negd)}</span></div>
    <div class="row vi"><span>Nisyə</span><span>${money(d.nisye)}</span></div>
    <div class="row"><span><b style="display:inline;color:#9aa5bd">Cəmi</b></span><span>${money(d.total)}</span></div>
    <div class="row gr"><span>Qazanc</span><span>${money(d.qazanc)}</span></div>`;
  tip.classList.add('on');
  moveTip(e);
}
function moveTip(e){
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let x = e.clientX + 16, y = e.clientY - h - 14;
  if (x + w > window.innerWidth - 12) x = e.clientX - w - 16;
  if (y < 12) y = e.clientY + 18;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
function hideTip(){ tip.classList.remove('on'); }

/* =====================================================================
   16) DEEP ANALYTICS CHARTS
   ===================================================================== */
function renderHourlyChart(rows) {
  const chart = $('hourlyChart');
  const banner = $('hourlySummaryBanner');
  if (!chart) return;
  chart.innerHTML = '';
  const hourMap = new Map();
  rows.forEach(s => {
    if (s.isQaytarma) return;
    const h = parseInt((s.saat || '00:00').split(':')[0], 10);
    const hourKey = isNaN(h) ? 12 : h;
    const o = hourMap.get(hourKey) || { total: 0, qazanc: 0, count: 0, receipts: new Set() };
    o.total += s.satis; o.qazanc += s.qazanc; o.count += s.qty;
    if (s.id) o.receipts.add(s.id);
    hourMap.set(hourKey, o);
  });
  if (!hourMap.size) {
    chart.innerHTML = '<div style="margin:auto;color:#5f6b87;font-size:13px;font-weight:600">Seçilmiş dövrdə saatlıq məlumat yoxdur</div>';
    if (banner) banner.innerHTML = '<span>Məlumat tapılmadı</span>';
    return;
  }
  let minH = Math.min(...hourMap.keys());
  let maxH = Math.max(...hourMap.keys());
  if (minH > 8) minH = 8;
  if (maxH < 22) maxH = 22;
  const hoursData = [];
  let maxTurnover = 0, peakHour = null, minHour = null, minTurnover = Infinity;
  for (let h = minH; h <= maxH; h++) {
    const o = hourMap.get(h) || { total: 0, qazanc: 0, count: 0, receipts: new Set() };
    const label = (h < 10 ? '0' : '') + h + ':00';
    const item = { hour: h, label, total: o.total, qazanc: o.qazanc, count: o.count, receiptCount: o.receipts.size };
    hoursData.push(item);
    if (item.total > maxTurnover) { maxTurnover = item.total; peakHour = item; }
    if (item.total > 0 && item.total < minTurnover) { minTurnover = item.total; minHour = item; }
  }
  if (banner) {
    if (peakHour && peakHour.total > 0) {
      const minText = minHour ? `<span>💤 Sakit saat: <b>${minHour.label}</b> (${money(minHour.total)})</span>` : '';
      banner.innerHTML = `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span class="badge-fire"><i class="fa-solid fa-fire"></i> Pik Saat: <b>${peakHour.label}</b></span>
        <span>Dövriyyə: <b>${money(peakHour.total)}</b> (${peakHour.receiptCount} çek)</span>
      </div>${minText}`;
    } else banner.innerHTML = `<span>Günün saatları üzrə satış bölgüsü</span>`;
  }
  const maxVal = Math.max(maxTurnover, 1);
  hoursData.forEach(d => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    const pct = Math.max((d.total / maxVal) * 100, d.total > 0 ? 4 : 0);
    const isPeak = peakHour && d.hour === peakHour.hour && d.total > 0;
    bar.innerHTML = `<div class="bar-inner" style="--h:${pct}%"><div class="seg hourly-seg ${isPeak ? 'peak' : ''}" style="height:100%"></div></div><div class="bar-lbl">${d.hour}</div>`;
    bar.addEventListener('mouseenter', e => {
      tip.innerHTML = `<b>Saat: ${d.label} — ${(d.hour+1<10?'0':'')+(d.hour+1)}:00</b>
        <div class="row cy"><span>Dövriyyə</span><span>${money(d.total)}</span></div>
        <div class="row"><span>Çek sayı</span><span>${d.receiptCount} qəbz</span></div>
        <div class="row"><span>Satılan</span><span>${d.count % 1 === 0 ? d.count : d.count.toFixed(2)} əd/kq</span></div>
        <div class="row gr"><span>Qazanc</span><span>${money(d.qazanc)}</span></div>`;
      tip.classList.add('on'); moveTip(e);
    });
    bar.addEventListener('mousemove', moveTip);
    bar.addEventListener('mouseleave', hideTip);
    chart.appendChild(bar);
  });
}
function renderProfitChart(rows) {
  const chart = $('profitChart');
  const banner = $('profitSummaryBanner');
  if (!chart) return;
  chart.innerHTML = '';
  const dayMap = new Map();
  rows.forEach(s => {
    if (s.isQaytarma) return;
    const o = dayMap.get(s.tarix) || { total: 0, qazanc: 0, count: 0 };
    o.total += s.satis; o.qazanc += s.qazanc; o.count++;
    dayMap.set(s.tarix, o);
  });
  const days = [...dayMap.keys()].sort();
  if (!days.length) {
    chart.innerHTML = '<div style="margin:auto;color:#5f6b87;font-size:13px;font-weight:600">Seçilmiş dövrdə qazanc məlumatı yoxdur</div>';
    if (banner) banner.innerHTML = '<span>Məlumat tapılmadı</span>';
    return;
  }
  let totalQazanc = 0, totalSatis = 0, maxProfit = -Infinity, bestDay = null;
  const data = days.map(d => {
    const o = dayMap.get(d);
    totalQazanc += o.qazanc; totalSatis += o.total;
    const marja = o.total > 0 ? (o.qazanc / o.total) * 100 : 0;
    if (o.qazanc > maxProfit) { maxProfit = o.qazanc; bestDay = { date: d, qazanc: o.qazanc, marja }; }
    return { date: d, label: d.slice(8) + '.' + d.slice(5, 7), total: o.total, qazanc: o.qazanc, marja, count: o.count };
  });
  const avgMargin = totalSatis > 0 ? (totalQazanc / totalSatis) * 100 : 0;
  if (banner) {
    const bestText = bestDay ? `<span class="badge-win"><i class="fa-solid fa-trophy"></i> Ən Qazanclı: <b>${bestDay.date.slice(8)}.${bestDay.date.slice(5,7)}</b> (+${money(bestDay.qazanc)})</span>` : '';
    banner.innerHTML = `${bestText}<span>Orta Marja: <b>${avgMargin.toFixed(1)}%</b> • Cəmi: <b>${money(totalQazanc)}</b></span>`;
  }
  const maxVal = Math.max(...data.map(d => Math.abs(d.qazanc)), 1);
  const step = Math.ceil(data.length / 15);
  data.forEach((d, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    const isNeg = d.qazanc < -0.001;
    const pct = Math.max((Math.abs(d.qazanc) / maxVal) * 100, Math.abs(d.qazanc) > 0 ? 5 : 0);
    bar.innerHTML = `<div class="bar-inner" style="--h:${pct}%"><div class="seg profit-seg ${isNeg ? 'neg' : ''}" style="height:100%"></div></div>${(i % step === 0 || i === data.length - 1) ? `<div class="bar-lbl">${d.label}</div>` : ''}`;
    bar.addEventListener('mouseenter', e => {
      tip.innerHTML = `<b>Tarix: ${d.date.split('-').reverse().join('.')}</b>
        <div class="row gr"><span>Xalis Qazanc</span><span>${d.qazanc > 0 ? '+' : ''}${money(d.qazanc)}</span></div>
        <div class="row cy"><span>Dövriyyə</span><span>${money(d.total)}</span></div>
        <div class="row"><span>Marja</span><span>${d.marja.toFixed(1)}%</span></div>
        <div class="row"><span>Satış</span><span>${d.count} əməliyyat</span></div>`;
      tip.classList.add('on'); moveTip(e);
    });
    bar.addEventListener('mousemove', moveTip);
    bar.addEventListener('mouseleave', hideTip);
    chart.appendChild(bar);
  });
}
function renderBrackets(rows) {
  const container = $('bracketsContainer');
  if (!container) return;
  const b = {
    b1: { name: '0.00 — 1.00 ₼', desc: 'Xırda mallar', icon: 'fa-cookie-bite', color: '#06b6d4', total: 0, qazanc: 0, count: 0 },
    b2: { name: '1.01 — 5.00 ₼', desc: 'Gündəlik tələbat', icon: 'fa-basket-shopping', color: '#3b82f6', total: 0, qazanc: 0, count: 0 },
    b3: { name: '5.01 — 15.00 ₼', desc: 'Əsas səbət', icon: 'fa-cart-shopping', color: '#8b5cf6', total: 0, qazanc: 0, count: 0 },
    b4: { name: '15.01 ₼ +', desc: 'Böyük alışlar', icon: 'fa-gem', color: '#10b981', total: 0, qazanc: 0, count: 0 }
  };
  let grandTotal = 0;
  rows.forEach(s => {
    if (s.isQaytarma) return;
    const unitPrice = s.qty > 0 ? (s.satis / s.qty) : s.satis;
    grandTotal += s.satis;
    let target = b.b1;
    if (unitPrice <= 1) target = b.b1;
    else if (unitPrice <= 5) target = b.b2;
    else if (unitPrice <= 15) target = b.b3;
    else target = b.b4;
    target.total += s.satis; target.qazanc += s.qazanc; target.count += s.qty;
  });
  const base = Math.max(grandTotal, 0.001);
  container.innerHTML = Object.values(b).map(item => {
    const pct = ((item.total / base) * 100);
    return `<div class="bracket-card">
      <div class="bracket-top">
        <div class="bracket-lbl">
          <div class="bracket-ico" style="background:${item.color}22;color:${item.color};border:1px solid ${item.color}44"><i class="fa-solid ${item.icon}"></i></div>
          <div>
            <div style="font-weight:800;color:#fff">${item.name}</div>
            <div style="font-size:10px;color:#94a3b8;font-weight:500">${item.desc}</div>
          </div>
        </div>
        <div class="bracket-amt">${money(item.total)}</div>
      </div>
      <div class="bracket-track"><div class="bracket-fill" style="width:${pct}%;background:${item.color}"></div></div>
      <div class="bracket-meta">
        <span>Pay: <b>${pct.toFixed(1)}%</b></span>
        <span>Miqdar: <b>${Math.round(item.count)} əd/kq</b></span>
        <span>Qazanc: <b style="color:#6ee7b7">+${money(item.qazanc)}</b></span>
      </div>
    </div>`;
  }).join('');
}
function renderAdvancedCharts(rows) {
  if (currentMainMode === 'hourly') renderHourlyChart(rows);
  else if (currentMainMode === 'profit') renderProfitChart(rows);
  else if (currentMainMode === 'brackets') renderBrackets(rows);
}



/* =====================================================================
   24) SLIDERS
   ===================================================================== */
let currentSlide = 0;
function goToSlide(idx) {
  currentSlide = idx === 1 ? 1 : 0;
  const track = $('sliderTrack');
  const titleText = $('sliderTitleText');
  const dots = document.querySelectorAll('#sliderDots .s-dot');
  if (track) track.style.transform = `translateX(-${currentSlide * 50}%)`;
  if (titleText) titleText.textContent = currentSlide === 0 ? 'Ödəniş Bölgüsü' : (topSortMode === 'qty' ? 'Ən Çox Satılan Məhsullar' : 'Ən Qazanclı Məhsullar');
  const subText = $('sliderSubtitle');
  if (subText) subText.textContent = currentSlide === 0 ? 'Səhifə 1 / 2 • Nəğd və Nisyə payı' : `Səhifə 2 / 2 • Top ${topProductsLimit} (${topSortMode === 'qty' ? 'Sayına görə' : 'Qazanca görə'})`;
  dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
  if (currentSlide === 1) {
    const box = $('topList');
    if (box) box.querySelectorAll('.tp-fill').forEach(f => { f.style.width = (f.dataset.w || 0) + '%'; });
  }
}
function initSlider() {
  const prevBtn = $('slidePrev'); const nextBtn = $('slideNext');
  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(0));
  if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(1));
  document.querySelectorAll('#sliderDots .s-dot').forEach(dot => {
    dot.addEventListener('click', () => { goToSlide(parseInt(dot.dataset.slide, 10) || 0); });
  });
  const viewport = $('sliderViewport');
  if (viewport) {
    let touchStartX = 0, touchStartY = 0;
    viewport.addEventListener('touchstart', e => { if (e.touches && e.touches[0]) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; } }, { passive: true });
    viewport.addEventListener('touchend', e => {
      if (e.changedTouches && e.changedTouches[0]) {
        const deltaX = touchStartX - e.changedTouches[0].clientX;
        const deltaY = touchStartY - e.changedTouches[0].clientY;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) goToSlide(deltaX > 0 ? 1 : 0);
      }
    }, { passive: true });
  }
}
let currentMainSlide = 0;
let currentMainMode = localStorage.getItem('kassa_main_chart_mode') || 'hourly';
function updateMainSliderHeader() {
  const titleText = $('mainSliderTitleText');
  const subText = $('mainSliderSubtitle');
  const legend = $('mainChartLegend');
  if (currentMainSlide === 0) {
    if (titleText) titleText.textContent = 'Günlük Satış Dinamikası';
    if (subText) subText.textContent = 'Səhifə 1 / 2 • Nəğd və nisyə satışların müqayisəsi';
    if (legend) legend.style.display = 'flex';
  } else {
    if (titleText) titleText.textContent = 'Dərin Satış Analitikası';
    if (legend) legend.style.display = 'none';
    if (subText) {
      if (currentMainMode === 'hourly') subText.textContent = 'Səhifə 2 / 2 • Saatlar üzrə dövriyyə və pik saatlar';
      else if (currentMainMode === 'profit') subText.textContent = 'Səhifə 2 / 2 • Gündəlik xalis qazanc və marja';
      else subText.textContent = 'Səhifə 2 / 2 • Qiymət seqmentləri üzrə dövriyyə payı';
    }
  }
}
function setMainChartMode(mode) {
  if (!['hourly', 'profit', 'brackets'].includes(mode)) mode = 'hourly';
  currentMainMode = mode;
  localStorage.setItem('kassa_main_chart_mode', mode);
  document.querySelectorAll('.mode-pill').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
  const boxHourly = $('modeHourlyBox'); const boxProfit = $('modeProfitBox'); const boxBrackets = $('modeBracketsBox');
  if (boxHourly) boxHourly.style.display = mode === 'hourly' ? 'block' : 'none';
  if (boxProfit) boxProfit.style.display = mode === 'profit' ? 'block' : 'none';
  if (boxBrackets) boxBrackets.style.display = mode === 'brackets' ? 'block' : 'none';
  updateMainSliderHeader();
  renderAdvancedCharts(getFiltered());
}
function goToMainSlide(idx) {
  currentMainSlide = idx === 1 ? 1 : 0;
  const track = $('mainSliderTrack');
  const dots = document.querySelectorAll('#mainSliderDots .main-s-dot');
  if (track) track.style.transform = `translateX(-${currentMainSlide * 50}%)`;
  dots.forEach((dot, i) => dot.classList.toggle('active', i === currentMainSlide));
  updateMainSliderHeader();
  if (currentMainSlide === 1) renderAdvancedCharts(getFiltered());
}
function initMainSlider() {
  const prevBtn = $('mainSlidePrev'); const nextBtn = $('mainSlideNext');
  if (prevBtn) prevBtn.addEventListener('click', () => goToMainSlide(0));
  if (nextBtn) nextBtn.addEventListener('click', () => goToMainSlide(1));
  document.querySelectorAll('#mainSliderDots .main-s-dot').forEach(dot => {
    dot.addEventListener('click', () => { goToMainSlide(parseInt(dot.dataset.slide, 10) || 0); });
  });
  const viewport = $('mainSliderViewport');
  if (viewport) {
    let touchStartX = 0, touchStartY = 0;
    viewport.addEventListener('touchstart', e => { if (e.touches && e.touches[0]) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; } }, { passive: true });
    viewport.addEventListener('touchend', e => {
      if (e.changedTouches && e.changedTouches[0]) {
        const deltaX = touchStartX - e.changedTouches[0].clientX;
        const deltaY = touchStartY - e.changedTouches[0].clientY;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) goToMainSlide(deltaX > 0 ? 1 : 0);
      }
    }, { passive: true });
  }
  setMainChartMode(localStorage.getItem('kassa_main_chart_mode') || 'hourly');
}
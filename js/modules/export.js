/**
 * Excel və CSV İxrac Modulu (SheetJS İnteqrasiyası)
 * Papatya Kassa & Satış Paneli
 */

export function exportSalesToWorkbook(filteredSales, storeName, periodStr, totals) {
  if (typeof XLSX === 'undefined') {
    throw new Error("SheetJS (XLSX) kitabxanası tapılmadı!");
  }

  const sheetData = [];
  sheetData.push([`Hesabat Dövrü: ${periodStr}`]);
  sheetData.push([`Mağaza: ${storeName}`]);
  sheetData.push([`Toplam Satış: ${totals.toplamSatis.toFixed(2)} ₼`]);
  sheetData.push([`Toplam Maya: ${totals.toplamMaya.toFixed(2)} ₼`]);
  sheetData.push([`Toplam Gəlir: ${totals.toplamQazanc.toFixed(2)} ₼`]);
  sheetData.push([`Toplam Miqdar: ${totals.toplamEded} ədəd / ${totals.toplamKq.toFixed(2)} kq`]);
  sheetData.push([]);

  sheetData.push(["Tarix", "Saat", "Məhsul", "Miqdar", "Satış (₼)", "Maya (₼)", "Gəlir (₼)", "Ödəniş", "Müştəri"]);

  filteredSales.forEach(s => {
    const isQ = s.isQaytarma;
    const unitLabel = s.isKilo ? 'kq' : 'əd';
    sheetData.push([
      s.dStr || '',
      s.tStr || '',
      (isQ ? '⚠️ Qaytarılma: ' : '') + (s.name || ''),
      `${isQ ? '-' : ''}${s.qty} ${unitLabel}`,
      (isQ ? -s.satis : s.satis).toFixed(2),
      (isQ ? -s.maya : s.maya).toFixed(2),
      (isQ ? -s.qazanc : s.qazanc).toFixed(2),
      s.pay || '',
      s.client || ''
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Satis_Hesabati");

  const now = new Date();
  const fileName = `Kassa_Hesabati_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/* ============================================================
   export.js — XLSX Excel export for monthly expenses
   Uses SheetJS (XLSX) library loaded via CDN
   ============================================================ */

const Export = {
  async download(month, year) {
    const expenses = Storage.getExpenses(month, year);
    if (expenses.length === 0) {
      UI.showToast('No expenses to export for this month.', 'error');
      return;
    }

    const monthNames = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];
    const monthLabel = `${monthNames[month]} ${year}`;
    const summary = Storage.getMonthlySummary(month, year);
    const total = summary.total;

    // ── Sheet 1: All Transactions ──
    const txnHeader = ['Date', 'Category', 'Amount (₹)', 'Note'];
    const txnRows = expenses.map(e => {
      const cat = Storage.getCategoryById(e.category);
      const d = new Date(e.date);
      const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      return [dateStr, cat.name, e.amount, e.note || ''];
    });

    // Add a blank row then totals
    txnRows.push([]);
    txnRows.push(['', 'TOTAL', total, '']);

    const txnData = [txnHeader, ...txnRows];
    const txnSheet = XLSX.utils.aoa_to_sheet(txnData);

    // Style the amount column as number format
    const range = XLSX.utils.decode_range(txnSheet['!ref']);
    for (let r = 1; r <= range.e.r; r++) {
      const cell = txnSheet[XLSX.utils.encode_cell({ r, c: 2 })];
      if (cell && typeof cell.v === 'number') {
        cell.t = 'n';
        cell.z = '#,##0.00';
      }
    }

    // Set column widths
    txnSheet['!cols'] = [
      { wch: 14 },  // Date
      { wch: 18 },  // Category
      { wch: 15 },  // Amount
      { wch: 30 },  // Note
    ];

    // ── Sheet 2: Category Breakdown ──
    const catHeader = ['Category', 'Amount (₹)', 'Percentage', 'Share'];
    const catEntries = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]);
    const catRows = catEntries.map(([catId, amt]) => {
      const catObj = Storage.getCategoryById(catId);
      const pct = total > 0 ? amt / total : 0;
      return [catObj.name, amt, pct, ''];
    });
    catRows.push([]);
    catRows.push(['TOTAL', total, 1, '']);

    const catData = [catHeader, ...catRows];
    const catSheet = XLSX.utils.aoa_to_sheet(catData);

    // Format amounts and percentages
    const catRange = XLSX.utils.decode_range(catSheet['!ref']);
    for (let r = 1; r <= catRange.e.r; r++) {
      const amtCell = catSheet[XLSX.utils.encode_cell({ r, c: 1 })];
      if (amtCell && typeof amtCell.v === 'number') {
        amtCell.t = 'n';
        amtCell.z = '#,##0.00';
      }
      const pctCell = catSheet[XLSX.utils.encode_cell({ r, c: 2 })];
      if (pctCell && typeof pctCell.v === 'number') {
        pctCell.t = 'n';
        pctCell.z = '0.0%';
      }
    }

    catSheet['!cols'] = [
      { wch: 20 },  // Category
      { wch: 15 },  // Amount
      { wch: 12 },  // Percentage
    ];

    // ── Build Workbook ──
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, txnSheet, 'Transactions');
    XLSX.utils.book_append_sheet(wb, catSheet, 'Category Breakdown');

    // ── Download as .xlsx ──
    const filename = `expenses_${year}_${String(month + 1).padStart(2, '0')}.xlsx`;

    try {
      // Generate the xlsx binary data
      const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Use modern File System Access API — this opens a native "Save As" dialog
      // which bypasses ANY browser enterprise policies regarding automatic downloads
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Excel Workbook',
            accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        
        UI.showToast(`Exported successfully!`, 'success');
      } else {
        // Fallback for browsers without File System Access API
        const dataURI = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        const a = document.createElement('a');
        a.href = dataURI;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => document.body.removeChild(a), 200);
        UI.showToast(`Exported ${filename} successfully!`, 'success');
      }
    } catch (err) {
      // Ignore AbortError (user clicked Cancel in the Save As dialog)
      if (err.name !== 'AbortError') {
        console.error('Export failed:', err);
        UI.showToast('Export failed. Check console.', 'error');
      }
    }
  },
};

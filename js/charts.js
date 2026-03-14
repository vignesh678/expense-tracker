/* ============================================================
   charts.js — Lightweight canvas-based pie & bar charts
   ============================================================ */

const Charts = {
  /* ── Pie Chart ── */
  drawPie(canvasId, data, legendId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 280;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);

    const entries = Object.entries(data).filter(([, v]) => v > 0);
    const total = entries.reduce((s, [, v]) => s + v, 0);

    if (total === 0 || entries.length === 0) {
      ctx.fillStyle = '#333';
      ctx.font = '14px "Space Grotesk"';
      ctx.textAlign = 'center';
      ctx.fillText('No data for this month', size / 2, size / 2);
      if (legendId) document.getElementById(legendId).innerHTML = '';
      return;
    }

    const cx = size / 2;
    const cy = size / 2;
    const radius = 110;
    const innerRadius = 65;
    let startAngle = -Math.PI / 2;

    entries.forEach(([cat, amount]) => {
      const sliceAngle = (amount / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      const color = Storage.getCategoryColor(cat);

      ctx.beginPath();
      ctx.moveTo(cx + innerRadius * Math.cos(startAngle), cy + innerRadius * Math.sin(startAngle));
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle = endAngle;
    });

    // Center text
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '700 20px "Orbitron"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₹' + this._formatNum(total), cx, cy - 6);
    ctx.fillStyle = '#8888aa';
    ctx.font = '12px "Rajdhani"';
    ctx.fillText('TOTAL', cx, cy + 16);

    // Legend
    if (legendId) {
      const legendEl = document.getElementById(legendId);
      if (legendEl) {
        legendEl.innerHTML = entries.map(([cat, amount]) => {
          const catObj = Storage.getCategoryById(cat);
          const pct = ((amount / total) * 100).toFixed(1);
          return `<div class="legend-item">
            <span class="legend-dot" style="background:${Storage.getCategoryColor(cat)}"></span>
            ${catObj.name} (${pct}%)
          </div>`;
        }).join('');
      }
    }
  },

  /* ── Bar Chart ── */
  drawBar(canvasId, dayData, month, year) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = 500, h = 280;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const values = [];
    for (let d = 1; d <= daysInMonth; d++) {
      values.push(dayData[d] || 0);
    }

    const maxVal = Math.max(...values, 1);
    const padding = { top: 20, right: 20, bottom: 40, left: 55 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const barW = Math.max(2, (chartW / daysInMonth) - 2);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      const label = this._formatNum(maxVal - (maxVal / 4) * i);
      ctx.fillStyle = '#55557a';
      ctx.font = '10px "Space Grotesk"';
      ctx.textAlign = 'right';
      ctx.fillText('₹' + label, padding.left - 8, y + 4);
    }

    // Bars
    values.forEach((val, i) => {
      const barH = (val / maxVal) * chartH;
      const x = padding.left + i * (chartW / daysInMonth) + 1;
      const y = padding.top + chartH - barH;

      const gradient = ctx.createLinearGradient(x, y, x, y + barH);
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0.4)');

      ctx.fillStyle = val > 0 ? gradient : 'rgba(0, 240, 255, 0.05)';
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH || 1, [2, 2, 0, 0]);
      ctx.fill();

      // Day labels (show every 5th for readability)
      if ((i + 1) % 5 === 0 || i === 0) {
        ctx.fillStyle = '#55557a';
        ctx.font = '10px "Space Grotesk"';
        ctx.textAlign = 'center';
        ctx.fillText(i + 1, x + barW / 2, h - padding.bottom + 16);
      }
    });

    // Axis
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.lineTo(w - padding.right, padding.top + chartH);
    ctx.stroke();
  },

  _formatNum(n) {
    if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return Math.round(n).toLocaleString('en-IN');
  },
};

// useQuotationPDF.js
// Generates CONTENT ONLY — no header/footer.
// Print this on your Haute Developers letterhead.
//
// Place at: src/hooks/useQuotationPDF.js
// Install:  npm install jspdf

export async function generateQuotationPDF({
  data,
  bsp,
  plcAmount,
  devCharge,
  totalCost,
  hasClubMembership,
  activePLCOption,
}) {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Colours ───────────────────────────────────────────────────────────────
  const BLACK        = [0,   0,   0];
  const WHITE        = [255, 255, 255];
  const YELLOW_GOLD  = [212, 175,  55];  // bright yellow-gold for Cost Breakdown header
  const GOLD_BORDER  = [180, 145,  40];  // slightly darker for borders
  const DARK_BROWN   = [44,  36,  24];   // "Cost Breakdown" text colour only

  // ── Layout ────────────────────────────────────────────────────────────────
  const ML = 20;
  const MR = 25;
  const PW = 210;
  const CW = PW - ML - MR; // 165mm

  // Top space — leave room for letterhead header
  let Y = 55;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmtNum = (num) =>
    Number(num || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const fmt = (num) => `Rs ${fmtNum(num)}`;

  const fillRect = (x, y, w, h, rgb) => {
    doc.setFillColor(...rgb);
    doc.rect(x, y, w, h, 'F');
  };

  const drawBorder = (x, y, w, h, rgb, lw = 0.3) => {
    doc.setDrawColor(...rgb);
    doc.setLineWidth(lw);
    doc.rect(x, y, w, h, 'S');
  };

  const hLine = (x1, x2, y, rgb, lw = 0.2) => {
    doc.setDrawColor(...rgb);
    doc.setLineWidth(lw);
    doc.line(x1, y, x2, y);
  };

  const vLine = (x, y1, y2, rgb, lw = 0.2) => {
    doc.setDrawColor(...rgb);
    doc.setLineWidth(lw);
    doc.line(x, y1, x, y2);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // QUOTATION TITLE
  // ═══════════════════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...BLACK);
  const title  = 'QUOTATION';
  const titleW = doc.getTextWidth(title);
  doc.text(title, (PW - titleW) / 2, Y);

  Y += 12;

  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECT DETAIL LINES
  // ═══════════════════════════════════════════════════════════════════════════
  const plcLabel = !activePLCOption || activePLCOption === 'N/A' ? null : activePLCOption;

  const detailLines = [
    { label: 'Project Name',  value: data.projectName || '\u2014' },
    { label: 'Property Type', value: 'Residential Plot' },
    { label: 'Plot Details',  value: `${data.plotSize || '\u2014'} Sq.Yd. | ${data.plotNo || '\u2014'}` },
    { label: 'Rate',          value: `Rs ${fmtNum(data.pricePerSqYard)}/ Sq. Yd.` },
  ];

  detailLines.forEach(({ label, value }) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    const labelText = `${label}: `;
    const labelW    = doc.getTextWidth(labelText);
    doc.text(labelText, ML, Y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BLACK);
    doc.text(value, ML + labelW, Y);

    Y += 7;
  });

  Y += 6;

  // ═══════════════════════════════════════════════════════════════════════════
  // COST BREAKDOWN TABLE
  // ═══════════════════════════════════════════════════════════════════════════
  const TABLE_X = ML;
  const TABLE_W = CW;
  const COL1_W  = TABLE_W * 0.58;
  const COL2_W  = TABLE_W - COL1_W;
  const ROW_H   = 9;
  const PAD     = 3;

  const tableTopY = Y;

  // ── Row 1: "Cost Breakdown" yellow-gold header ─────────────────────────────
  fillRect(TABLE_X, Y, TABLE_W, ROW_H, YELLOW_GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK_BROWN);
  doc.text('Cost Breakdown', TABLE_X + PAD, Y + 6.2);
  Y += ROW_H;

  // ── Row 2: Column headers — white background, black bold text ─────────────
  fillRect(TABLE_X, Y, TABLE_W, ROW_H, WHITE);
  hLine(TABLE_X, TABLE_X + TABLE_W, Y, GOLD_BORDER, 0.3);
  hLine(TABLE_X, TABLE_X + TABLE_W, Y + ROW_H, GOLD_BORDER, 0.3);
  vLine(TABLE_X + COL1_W, Y, Y + ROW_H, GOLD_BORDER, 0.3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  doc.text('Particulars', TABLE_X + PAD, Y + 6.2);

  const amtHeader  = 'Amount (Rs)';
  const amtHeaderW = doc.getTextWidth(amtHeader);
  doc.text(amtHeader, TABLE_X + COL1_W + COL2_W - amtHeaderW - PAD, Y + 6.2);
  Y += ROW_H;

  // ── Data rows — ALL white background ──────────────────────────────────────
  const dataRows = [];

  dataRows.push([
    `Basic Cost (${data.plotSize || 0} x Rs ${fmtNum(data.pricePerSqYard)})`,
    fmt(bsp),
  ]);

  dataRows.push([
    'Development Charges (Rs 1,500/Sq.Yd.)',
    fmt(devCharge),
  ]);

  if (hasClubMembership) {
    dataRows.push(['Club Membership', 'Rs 1,00,000']);
  }

  if (plcLabel && plcAmount > 0) {
    dataRows.push([`PLC Corner (${plcLabel} of BSP)`, fmt(plcAmount)]);
  }

  dataRows.forEach((row) => {
    // ALL rows white — no alternating
    fillRect(TABLE_X, Y, TABLE_W, ROW_H, WHITE);

    hLine(TABLE_X, TABLE_X + TABLE_W, Y, GOLD_BORDER, 0.2);
    vLine(TABLE_X + COL1_W, Y, Y + ROW_H, GOLD_BORDER, 0.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...BLACK);
    doc.text(row[0], TABLE_X + PAD, Y + 6.2);

    const amtW = doc.getTextWidth(row[1]);
    doc.text(row[1], TABLE_X + COL1_W + COL2_W - amtW - PAD, Y + 6.2);

    Y += ROW_H;
  });

  // ── Total row — white background, bold black text ──────────────────────────
  fillRect(TABLE_X, Y, TABLE_W, ROW_H, WHITE);
  hLine(TABLE_X, TABLE_X + TABLE_W, Y, GOLD_BORDER, 0.3);
  hLine(TABLE_X, TABLE_X + TABLE_W, Y + ROW_H, GOLD_BORDER, 0.3);
  vLine(TABLE_X + COL1_W, Y, Y + ROW_H, GOLD_BORDER, 0.3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  doc.text('Total Payable Price', TABLE_X + PAD, Y + 6.2);

  const totalStr  = fmt(totalCost) + '/-';
  const totalStrW = doc.getTextWidth(totalStr);
  doc.text(totalStr, TABLE_X + COL1_W + COL2_W - totalStrW - PAD, Y + 6.2);

  Y += ROW_H;

  // Outer table border
  drawBorder(TABLE_X, tableTopY, TABLE_W, Y - tableTopY, GOLD_BORDER, 0.5);

  Y += 10;

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPORTANT NOTES
  // ═══════════════════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Important Notes :', TABLE_X, Y);
  Y += 7;

  const TEXT_X = TABLE_X + 7;
  const MAX_W  = CW - 7;

  // [normalText, boldText] — bold rendered inline after normal
  const notes = [
    ['All payments shall be made in favour of ', 'Haute Developers'],
    ['Prices are final as per discussion', ''],
    ['The quotation is valid for 72 hours only.', ''],
    ['Prices may be revised after the validity period', ''],
    ['Government taxes, stamp duty & registration charges shall be extra, as applicable', ''],
    ['Booking amount shall be payable as per company policy', ''],
    ['Delay in payment as per finalised terms and period may attract applicable penalties as per company policies', ''],
  ];

  notes.forEach(([normal, bold]) => {
    // Bullet dot
    doc.setFillColor(...BLACK);
    doc.circle(TABLE_X + 2, Y - 1.5, 0.9, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...BLACK);

    if (bold) {
      const normalW = doc.getTextWidth(normal);
      doc.text(normal, TEXT_X, Y);
      doc.setFont('helvetica', 'bold');
      doc.text(bold, TEXT_X + normalW, Y);
      Y += 5.5;
    } else {
      const lines = doc.splitTextToSize(normal, MAX_W);
      doc.text(lines, TEXT_X, Y);
      Y += lines.length * 5 + 0.5;
    }
  });

  // Bottom space left for letterhead footer (~40mm)

  // ── Save ──────────────────────────────────────────────────────────────────
  const safePlot    = (data.plotNo || 'Plot').replace(/[^a-zA-Z0-9-]/g, '_');
  const safeProject = (data.projectName || 'Haute').replace(/\s+/g, '_');
  doc.save(`Quotation_${safePlot}_${safeProject}.pdf`);
}
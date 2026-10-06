import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const outputPath = path.resolve('./public/ParkPay_Pitch_Proposal.pdf');
const imagePath = path.resolve('./public/parkpay_dashboard_ui.jpg');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 45, right: 45 },
  info: {
    Title: 'ParkPay Pitch Proposal',
    Author: 'ParkPay Technologies',
    Subject: 'Smart Parking Lot Management & Digital Revenue System',
  },
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Helper for horizontal rule
function drawDivider(yOffset?: number) {
  const y = yOffset || doc.y;
  doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(45, y).lineTo(550, y).stroke();
  doc.y = y + 10;
}

// ---------------- PAGE 1: TITLE & EXECUTIVE SUMMARY ----------------
// Header Brand Banner
doc.rect(45, 35, 505, 54).fill('#047857');
doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('ParkPay™', 60, 47);
doc.fillColor('#D1FAE5').fontSize(10).font('Helvetica').text('Smart Parking Lot Management & Digital Revenue System', 60, 71);

doc.y = 105;

// Document Title & Metadata
doc.fillColor('#0F172A').fontSize(16).font('Helvetica-Bold').text('EXECUTIVE PITCH PROPOSAL', 45, doc.y);
doc.moveDown(0.2);
doc.fillColor('#64748B').fontSize(9).font('Helvetica').text('Prepared for Commercial Infrastructure & Municipal Parking Authorities | September 2026');
doc.moveDown(0.6);
drawDivider();

// 1. Executive Summary
doc.fillColor('#047857').fontSize(12).font('Helvetica-Bold').text('1. Executive Summary');
doc.moveDown(0.3);
doc.fillColor('#334155').fontSize(9.5).font('Helvetica').lineGap(2.5).text(
  'Urban commercial hubs, municipal lots, and private infrastructure facilities face mounting operational challenges: revenue leakage from manual cash handling, long vehicle queue times at entry and exit gates, lack of live bay visibility, and cumbersome physical paper receipts.'
);
doc.moveDown(0.4);
doc.text(
  'ParkPay™ is an enterprise cloud-native parking operations and revenue optimization platform. Built on modern web architecture with real-time Google Cloud Firestore synchronization and integrated Google Workspace services, ParkPay automates vehicle check-ins, dynamically calculates multi-tier tariffs, eliminates revenue shrinkage, and delivers instant digital receipts directly through verified Gmail workflows.'
);
doc.moveDown(0.8);

// 2. Product Screenshot & UI Showcase
doc.fillColor('#047857').fontSize(12).font('Helvetica-Bold').text('2. Product Showcase & Interface Overview');
doc.moveDown(0.4);

if (fs.existsSync(imagePath)) {
  // Embed image with frame
  const imageY = doc.y;
  doc.rect(44, imageY - 1, 507, 242).strokeColor('#CBD5E1').lineWidth(1).stroke();
  doc.image(imagePath, 45, imageY, { width: 505, height: 240 });
  doc.y = imageY + 246;
  doc.fillColor('#64748B').fontSize(8).font('Helvetica-Oblique').text(
    'Figure 1: ParkPay live operations dashboard showing real-time occupancy, revenue telemetry, interactive bay grid, and gate ledger.',
    45,
    doc.y,
    { align: 'center', width: 505 }
  );
  doc.moveDown(0.8);
}

// Key UI Capabilities
doc.fillColor('#0F172A').fontSize(9.5).font('Helvetica-Bold').text('Core Platform Capabilities in View:');
doc.moveDown(0.2);
doc.fillColor('#334155').fontSize(9).font('Helvetica').lineGap(2);
doc.text('• Instant Gate Telemetry: Live occupancy percentage, vehicle counts, active turnover metrics, and cumulative daily revenue.');
doc.text('• Interactive 2D Bay Grid: Real-time slot visualization with instant color-coded status tracking (available, occupied, reserved).');
doc.text('• Integrated Gmail Receipts: Official digital gate receipts with QR verification dispatched directly to motorist inboxes.');
doc.text('• Immutable Gate Audit Ledger: Complete timestamped records of entry, exit, duration, tariff rate, and payment method.');

// ---------------- PAGE 2: COMPARISON, FEATURES & FINANCIALS ----------------
doc.addPage();

// Header on Page 2
doc.fillColor('#047857').fontSize(10).font('Helvetica-Bold').text('ParkPay™ Executive Proposal', 45, 35);
doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('Confidential', 495, 35, { align: 'right' });
drawDivider(48);

// 3. Problem vs Solution Comparison Table
doc.fillColor('#047857').fontSize(12).font('Helvetica-Bold').text('3. The Problem: The Cost of Legacy Parking Systems');
doc.moveDown(0.5);

// Table Header
const tableY = doc.y;
doc.rect(45, tableY, 250, 20).fill('#F1F5F9');
doc.rect(295, tableY, 255, 20).fill('#ECFDF5');
doc.strokeColor('#CBD5E1').lineWidth(0.5).rect(45, tableY, 505, 20).stroke();

doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('LEGACY PARKING LOT OPERATIONS', 52, tableY + 5.5);
doc.fillColor('#047857').fontSize(8.5).font('Helvetica-Bold').text('PARKPAY™ SMART SOLUTION', 302, tableY + 5.5);

const rows = [
  {
    legacy: 'Manual paper slips & thermal rolls get lost or torn, causing frequent customer exit disputes.',
    solution: 'Digital receipts with instant Gmail delivery, tamper-proof verification, and permanent cloud archival.',
  },
  {
    legacy: 'Cash leakage & unrecorded gate exits cost facility owners an estimated 15%–25% in lost gross revenue.',
    solution: 'System-enforced tariff calculation engine linked directly with immutable gate audit logs.',
  },
  {
    legacy: 'Zero real-time occupancy insights, causing unnecessary traffic congestion and vehicle queues.',
    solution: 'Live bay capacity visualization allowing proactive gate coordination and capacity optimization.',
  },
  {
    legacy: 'Hardware vendor lock-in requiring expensive proprietary terminals, readers, and maintenance contracts.',
    solution: 'Zero-footprint web application running seamlessly on standard tablets, POS devices, or desktop PCs.',
  },
];

let curY = tableY + 20;
rows.forEach((r) => {
  doc.rect(45, curY, 250, 36).fillAndStroke('#FFFFFF', '#CBD5E1');
  doc.rect(295, curY, 255, 36).fillAndStroke('#F8FAFC', '#CBD5E1');
  doc.fillColor('#334155').fontSize(8).font('Helvetica').text(r.legacy, 52, curY + 4, { width: 236, lineGap: 1 });
  doc.fillColor('#047857').fontSize(8).font('Helvetica-Bold').text(r.solution, 302, curY + 4, { width: 242, lineGap: 1 });
  curY += 36;
});

doc.y = curY + 12;

// 4. Key Value Propositions
doc.fillColor('#047857').fontSize(12).font('Helvetica-Bold').text('4. Core Value Pillars');
doc.moveDown(0.4);

doc.fillColor('#0F172A').fontSize(9.5).font('Helvetica-Bold').text('⚡ High-Speed Gate Processing (Under 5 Seconds)');
doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(
  'Streamlined check-in with automatic IST timestamping and rapid plate lookup at exit, slashing queue times during peak traffic hours.'
);
doc.moveDown(0.3);

doc.fillColor('#0F172A').fontSize(9.5).font('Helvetica-Bold').text('💰 Dynamic Multi-Tier Tariff Engine');
doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(
  'Configurable base rates, vehicle multipliers (Two-Wheelers, Sedans, SUVs, Commercial), and minimum charges with support for Cash, UPI/QR, and Cards.'
);
doc.moveDown(0.3);

doc.fillColor('#0F172A').fontSize(9.5).font('Helvetica-Bold').text('📧 Paperless Receipts via Google Workspace (Gmail API)');
doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(
  'Direct email dispatch of branded GST-compliant receipts to customers, eliminating thermal paper costs and printer breakdowns.'
);
doc.moveDown(0.3);

doc.fillColor('#0F172A').fontSize(9.5).font('Helvetica-Bold').text('☁️ Enterprise Cloud Resilience & Security');
doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(
  'Real-time persistence backed by Google Cloud Firestore with local cache support for uninterrupted operation during network drops.'
);
doc.moveDown(0.7);

// 5. Projected ROI Table
doc.fillColor('#047857').fontSize(12).font('Helvetica-Bold').text('5. Financial Projection & ROI (100-Bay Commercial Facility)');
doc.moveDown(0.4);

const roiY = doc.y;
doc.rect(45, roiY, 505, 18).fill('#047857');
doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
doc.text('OPERATIONAL METRIC', 52, roiY + 5);
doc.text('BEFORE PARKPAY', 220, roiY + 5);
doc.text('WITH PARKPAY', 340, roiY + 5);
doc.text('NET IMPACT', 460, roiY + 5);

const roiData = [
  ['Monthly Revenue Capture', '₹4,20,000', '₹4,85,000', '+15.5% recovered revenue'],
  ['Thermal Paper & Consumables', '₹8,500 / month', '₹0 (Digital)', '100% paperless savings'],
  ['Average Gate Transaction Time', '45 - 60 seconds', '8 - 12 seconds', '75% queue reduction'],
  ['Audit & Shift Reconciliation', '90 minutes daily', 'Real-time / Instant', 'Zero manual labor'],
];

let rY = roiY + 18;
roiData.forEach((row, idx) => {
  const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
  doc.rect(45, rY, 505, 18).fillAndStroke(bg, '#E2E8F0');
  doc.fillColor('#1E293B').fontSize(8).font('Helvetica').text(row[0], 52, rY + 5);
  doc.fillColor('#64748B').text(row[1], 220, rY + 5);
  doc.fillColor('#0F172A').font('Helvetica-Bold').text(row[2], 340, rY + 5);
  doc.fillColor('#047857').font('Helvetica-Bold').text(row[3], 460, rY + 5);
  rY += 18;
});

doc.y = rY + 14;

// 6. Rollout Plan & Next Steps
doc.fillColor('#047857').fontSize(11).font('Helvetica-Bold').text('6. Next Steps & Implementation Roadmap');
doc.moveDown(0.3);
doc.fillColor('#334155').fontSize(8.5).font('Helvetica').lineGap(2).text(
  'ParkPay offers a turnkey 4-week onboarding plan covering site configuration, tariff calibration, staff training, and parallel digital cutover. We invite facility leadership to schedule a live interactive pilot demo.'
);

doc.moveDown(0.8);
// Footer note
doc.rect(45, 780, 505, 24).fill('#F8FAFC');
doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(45, 780, 505, 24).stroke();
doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text(
  'ParkPay™ Smart Parking System · Official Pitch Document · Contact: contact@parkpay.in · Live App: https://ais-pre-ojbykl2xge27n5xsm35tbl-957060696293.asia-southeast1.run.app',
  45,
  788,
  { align: 'center', width: 505 }
);

doc.end();

writeStream.on('finish', () => {
  console.log('PDF successfully generated at:', outputPath);
});

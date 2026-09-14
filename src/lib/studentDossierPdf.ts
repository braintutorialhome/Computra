import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { safeFormat } from './utils';
import { getISTToday, getISTDateString } from './dateUtils';
import { Student, Fee, DueFee, TestResult } from '../types';
import { exportFile } from './downloadHelper';

export interface StudentDossierData {
  student: Student;
  totalPaid: number;
  paidCount: number;
  totalDue: number;
  dueCount: number;
  attendanceRate: number | null;
  totalAttendance?: number;
  testCount: number;
  paidFeesList: Fee[];
  dueFeesList: DueFee[];
  testResultsList?: TestResult[];
}

/**
 * Generates an Official Academic & Administrative Student Dossier PDF.
 * 
 * Formal Institutional Design Standards:
 * - Color Palette: Official Institutional Deep Oxford Navy (#12263F / [18, 38, 63]),
 *   subtle antique gold divider ([180, 142, 70]), neutral Slate backgrounds ([248, 250, 252]),
 *   crisp borders ([203, 213, 225]), and dignified forest green / wine accents.
 * - Structure: Formal institutional masthead, official reference code, complete profile grid,
 *   financial audit summary, full itemized fee collections ledger, assessed dues ledger,
 *   and institutional verification certificate with authorized signatory seal block.
 */
export function exportStudentDossierToPDF(dossier: StudentDossierData) {
  const { 
    student, 
    totalPaid, 
    paidCount, 
    totalDue, 
    dueCount, 
    paidFeesList, 
    dueFeesList 
  } = dossier;

  // Initialize A4 PDF document in portrait mode (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = doc.internal.pageSize.getWidth();   // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = 12;                                    // 12 mm standard official margin
  const contentWidth = pageWidth - (margin * 2);        // 186 mm
  let currentY = 10;

  // ==========================================
  // 1. TOP OFFICIAL INSTITUTIONAL ACCENT BAR
  // Deep Oxford Navy Bar with Antique Gold Underline
  // ==========================================
  doc.setFillColor(18, 38, 63); // Oxford Navy (#12263F)
  doc.rect(0, 0, pageWidth, 4.5, 'F');

  doc.setFillColor(180, 142, 70); // Antique Gold (#B48E46)
  doc.rect(0, 4.5, pageWidth, 0.8, 'F');

  // ==========================================
  // 2. OFFICIAL INSTITUTIONAL LETTERHEAD
  // ==========================================
  currentY = 10;

  // Institution Name (Bold, Formal, Dignified)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(18, 38, 63); // Deep Oxford Navy
  doc.text('UTC COMPUTRA', margin, currentY + 5);

  // Institution Accreditation & Sub-heading
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85); // Slate 700
  doc.text(
    'INSTITUTE OF ADVANCED COMPUTER APPLICATIONS AND SCIENCE',
    margin,
    currentY + 9.5
  );

  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('Campus: Bhangar, South 24 Parganas, West Bengal - 743502', margin, currentY + 13.5);

  // Right-Aligned Official Classification & Metadata
  const rightX = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(18, 38, 63);
  doc.text('OFFICIAL STUDENT DOSSIER', rightX, currentY + 4.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  const cleanSession = String(student.session || '2025-26').replace(/\s+/g, '');
  const refCode = `UTC/DOS/${cleanSession}/${String(student.rollNumber || student.id || 'GEN')}`;
  doc.text(`Ref. No: ${refCode}`, rightX, currentY + 9, { align: 'right' });
  doc.text(`Issue Date: ${safeFormat(getISTToday(), 'dd MMM yyyy, HH:mm')} IST`, rightX, currentY + 13.5, { align: 'right' });

  // Official Double Dividing Rule (Slate + Gold accent)
  currentY += 16;
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, rightX, currentY);

  currentY += 0.8;
  doc.setDrawColor(180, 142, 70); // Antique Gold
  doc.setLineWidth(0.2);
  doc.line(margin, currentY, rightX, currentY);

  currentY += 4;

  // ==========================================
  // 3. STUDENT OFFICIAL IDENTITY & REGISTRATION BANNER
  // ==========================================
  const bannerHeight = 16;
  doc.setFillColor(248, 250, 252); // Soft Slate White (#F8FAFC)
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, bannerHeight, 1.5, 1.5, 'FD');

  // Left Deep Navy Pillar
  doc.setFillColor(18, 38, 63);
  doc.roundedRect(margin, currentY, 3, bannerHeight, 1, 1, 'F');

  // Student Full Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // Slate 900
  const studentNameStr = (student.name || 'UNNAMED STUDENT').toUpperCase();
  doc.text(studentNameStr, margin + 6, currentY + 5.8);

  // Student Metadata (Roll, ID, Class, Course)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const metaParts = [
    student.rollNumber ? `Roll No: ${student.rollNumber}` : null,
    `Student ID: ${student.id || 'N/A'}`,
    student.class ? `Class: ${student.class}` : null,
    student.subject ? `Subject: ${student.subject}` : null,
  ].filter(Boolean).join('   |   ');
  doc.text(metaParts, margin + 6, currentY + 11.5);

  // Official Status Badge on the Right
  const statusStr = (student.status || 'Active').toUpperCase();
  const badgeWidth = 28;
  const badgeHeight = 5.6;
  const badgeX = rightX - badgeWidth - 4;
  const badgeY = currentY + 3.2;

  if (student.status === 'approved') {
    doc.setFillColor(220, 252, 231); // Soft Green
    doc.setDrawColor(187, 247, 208);
    doc.setTextColor(20, 83, 45); // Dark Green
  } else if (student.status === 'pending') {
    doc.setFillColor(254, 243, 199); // Soft Amber
    doc.setDrawColor(253, 230, 138);
    doc.setTextColor(146, 64, 14);
  } else {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.setTextColor(51, 65, 85);
  }
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.2, 1.2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(statusStr, badgeX + (badgeWidth / 2), badgeY + 3.8, { align: 'center' });

  // Academic Session Tag
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const sessionStr = `Academic Session: ${student.session || '2025-2026'}`;
  doc.text(sessionStr, rightX - 4, currentY + 13, { align: 'right' });

  currentY += bannerHeight + 3.5;

  // ==========================================
  // 4. FINANCIAL AUDIT & CLEARANCE SUMMARY (3 METRIC BOXES)
  // ==========================================
  const cardGap = 4;
  const cardWidth = (contentWidth - (cardGap * 2)) / 3; // ~59.3mm each
  const cardHeight = 13;

  // Metric 1: Total Fees Paid
  doc.setFillColor(240, 253, 244); // Light Green
  doc.setDrawColor(187, 247, 208); // Green 200
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(20, 83, 45); // Dark Green
  doc.text('TOTAL FEES COLLECTED', margin + 3.5, currentY + 4);
  doc.setFontSize(9.5);
  doc.text(`INR ${totalPaid.toLocaleString('en-IN')}`, margin + 3.5, currentY + 8.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(21, 128, 61);
  doc.text(`${paidCount} verified receipt(s)`, margin + 3.5, currentY + 11.5);

  // Metric 2: Assessed Outstanding Due
  const card2X = margin + cardWidth + cardGap;
  const isDueActive = totalDue > 0;
  doc.setFillColor(isDueActive ? 255 : 248, isDueActive ? 241 : 250, isDueActive ? 242 : 252);
  doc.setDrawColor(isDueActive ? 254 : 226, isDueActive ? 205 : 232, isDueActive ? 211 : 240);
  doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(isDueActive ? 159 : 51, isDueActive ? 18 : 65, isDueActive ? 57 : 85);
  doc.text('OUTSTANDING DUES', card2X + 3.5, currentY + 4);
  doc.setFontSize(9.5);
  doc.text(`INR ${totalDue.toLocaleString('en-IN')}`, card2X + 3.5, currentY + 8.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(isDueActive ? 190 : 100, isDueActive ? 18 : 116, isDueActive ? 60 : 139);
  doc.text(isDueActive ? `${dueCount} pending assessment(s)` : 'Zero dues pending', card2X + 3.5, currentY + 11.5);

  // Metric 3: Clearance Status
  const card3X = card2X + cardWidth + cardGap;
  const isCleared = totalDue === 0;
  doc.setFillColor(isCleared ? 240 : 255, isCleared ? 253 : 251, isCleared ? 244 : 235);
  doc.setDrawColor(isCleared ? 187 : 253, isCleared ? 247 : 230, isCleared ? 208 : 138);
  doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(isCleared ? 20 : 146, isCleared ? 83 : 64, isCleared ? 45 : 14);
  doc.text('ACCOUNT STATUS', card3X + 3.5, currentY + 4);
  doc.setFontSize(8.5);
  doc.text(isCleared ? 'CLEARED (GOOD)' : 'PAYMENT DUE', card3X + 3.5, currentY + 8.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(isCleared ? 21 : 180, isCleared ? 128 : 83, isCleared ? 61 : 9);
  doc.text(isCleared ? 'Institutional clearance valid' : 'Settlement required', card3X + 3.5, currentY + 11.5);

  currentY += cardHeight + 4.5;

  // ==========================================
  // 5. SECTION 1: COMPREHENSIVE STUDENT PROFILE PARTICULARS
  // Structured official 4-column record grid
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 38, 63); // Deep Oxford Navy
  doc.text('1. Student Profile & Academic Registration Particulars', margin, currentY);
  currentY += 2;

  const profileRows = [
    [
      { content: "Father's / Guardian's Name", styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number], textColor: [51, 65, 85] as [number, number, number] } },
      { content: student.fatherName || 'Not Provided' },
      { content: 'Subject / Course', styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number], textColor: [51, 65, 85] as [number, number, number] } },
      { content: student.subject || 'Not Provided', styles: { fontStyle: 'bold' as const, textColor: [18, 38, 63] as [number, number, number] } }
    ],
    [
      { content: 'Class / Standard', styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number], textColor: [51, 65, 85] as [number, number, number] } },
      { content: student.class || 'N/A' },
      { content: 'Academic Semester', styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number], textColor: [51, 65, 85] as [number, number, number] } },
      { content: student.semester || 'N/A' }
    ],
    [
      { content: 'Date of Birth & Gender', styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number], textColor: [51, 65, 85] as [number, number, number] } },
      { content: `${safeFormat(student.dob, 'dd MMM yyyy') || 'N/A'} • ${student.gender ? student.gender.toUpperCase() : 'N/A'}` },
      { content: 'Admission Date', styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number], textColor: [51, 65, 85] as [number, number, number] } },
      { content: safeFormat(student.admissionDate, 'dd MMM yyyy') || 'N/A' }
    ],
    [
      { content: 'Contact Numbers', styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number], textColor: [51, 65, 85] as [number, number, number] } },
      { content: `Mob: ${student.mobile || 'N/A'}  |  WhatsApp: ${student.whatsapp || 'N/A'}` },
      { content: 'Academic Session', styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number], textColor: [51, 65, 85] as [number, number, number] } },
      { content: student.session || '2025-2026' }
    ],
    [
      { content: 'Permanent Residential Address', styles: { fontStyle: 'bold' as const, fillColor: [248, 250, 252] as [number, number, number], textColor: [51, 65, 85] as [number, number, number] } },
      { content: student.address || 'Address particulars not recorded in institutional database.', colSpan: 3 }
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: profileRows,
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 51 },
      2: { cellWidth: 40 },
      3: { cellWidth: 'auto' },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Check page break threshold
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 18;
  }

  // ==========================================
  // 6. SECTION 2: FEE COLLECTIONS & PAYMENT LEDGER
  // Official Institutional Table with Deep Oxford Navy header
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 38, 63);
  doc.text(`2. Fee Collections Ledger & Receipts (${paidCount} Records)`, margin, currentY);
  currentY += 2;

  if (paidFeesList.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No fee payment transactions recorded for this student in the official registry.', margin, currentY + 4);
    currentY += 10;
  } else {
    const feeRows = paidFeesList.map((f, idx) => [
      String(idx + 1),
      safeFormat(f.date, 'dd MMM yyyy') || String(f.date || 'N/A'),
      String(f.month || 'Standard Term'),
      `INR ${Number(f.amount || 0).toLocaleString('en-IN')}`
    ]);

    // Official Grand Total Row
    feeRows.push([
      '',
      'Total Verified Collections',
      `${paidFeesList.length} transaction receipt(s)`,
      `INR ${totalPaid.toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['#', 'Receipt Date', 'Billing Month / Particulars', 'Amount (INR)']],
      body: feeRows,
      theme: 'striped',
      headStyles: {
        fillColor: [18, 38, 63], // Deep Oxford Navy (#12263F)
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      styles: {
        fontSize: 7.2,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 42 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 46, halign: 'right', fontStyle: 'bold' },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        if (data.row.index === feeRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 253, 244]; // Soft green total highlight
          if (data.column.index === 3) {
            data.cell.styles.textColor = [20, 83, 45];
          }
        }
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // Check page break threshold
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 18;
  }

  // ==========================================
  // 7. SECTION 3: ASSESSED DUE FEES & CLEARANCE LEDGER
  // Official Slate / Charcoal header with clear audit trail
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 38, 63);
  doc.text(`3. Assessed Due Fees & Clearance Register (${dueCount} Records)`, margin, currentY);
  currentY += 2;

  if (dueFeesList.length === 0) {
    // Official Cleared Status Box
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, currentY, contentWidth, 9, 1.2, 1.2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(20, 83, 45); // Dark Green
    doc.text('INSTITUTIONAL FINANCIAL CLEARANCE CERTIFICATE:', margin + 3.5, currentY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Certified that all assessed institutional fees and academic charges are fully settled (INR 0.00 Outstanding Due).', margin + 3.5, currentY + 7.2);
    currentY += 13;
  } else {
    const dueRows = dueFeesList.map((df, idx) => [
      String(idx + 1),
      safeFormat(df.date, 'dd MMM yyyy') || String(df.date || 'N/A'),
      df.remarks || 'Standard Term Assessment',
      `INR ${Number(df.amount || 0).toLocaleString('en-IN')}`
    ]);

    dueRows.push([
      '',
      'Total Assessed Outstanding Due',
      `${dueFeesList.length} pending assessment(s)`,
      `INR ${totalDue.toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['#', 'Assessment Date', 'Remarks / Assessment Purpose', 'Due Amount (INR)']],
      body: dueRows,
      theme: 'striped',
      headStyles: {
        fillColor: totalDue > 0 ? [88, 28, 44] : [51, 65, 85], // Deep Wine Burgundy if dues active, Dark Slate if none
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      styles: {
        fontSize: 7.2,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 38 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        if (data.row.index === dueRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [255, 241, 242]; // Soft rose highlight for total dues
          if (data.column.index === 3) {
            data.cell.styles.textColor = [159, 18, 57];
          }
        }
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // ==========================================
  // 8. OFFICIAL CERTIFICATION & AUTHENTICATION BLOCK
  // ==========================================
  if (currentY > pageHeight - 38) {
    doc.addPage();
    currentY = 22;
  }

  // Institutional Verification Statement
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  const certBoxHeight = 12;
  doc.roundedRect(margin, currentY, contentWidth, certBoxHeight, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(18, 38, 63);
  doc.text('INSTITUTIONAL RECORD VERIFICATION DECLARATION:', margin + 3.5, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'This is a computer-generated official record from UTC Computra. All academic and financial records contained herein are verified. For any fee-related inquiries, discrepancies, or administrative clarifications, please contact the office directly with valid payment receipts during working hours.',
    margin + 3.5,
    currentY + 7.5,
    { maxWidth: contentWidth - 7 }
  );

  currentY += certBoxHeight + 8;

  // Signatory Sign-off Section
  const sigAreaY = currentY;

  // Authorized Signatory
  const rightSigX = rightX - 50;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(rightSigX, sigAreaY + 12, rightX - 5, sigAreaY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(18, 38, 63); // Deep Oxford Navy
  doc.text('Authorized Signatory', rightSigX + 22.5, sigAreaY + 15.5, { align: 'center' });

  // ==========================================
  // 9. PROFESSIONAL RUNNING HEADERS & FOOTERS
  // Applied across all pages
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running Header on continuation pages (Page 2+)
    if (i > 1) {
      doc.setFillColor(18, 38, 63);
      doc.rect(0, 0, pageWidth, 3, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`UTC Computra • Official Student Dossier • ${student.name || 'Student'} (ID: ${student.id || 'N/A'})`, margin, 7);
      doc.text(`Ref: ${refCode}`, rightX, 7, { align: 'right' });
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, 9, rightX, 9);
    }

    // Running Footer on every page
    const footerY = pageHeight - 8;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 2.5, rightX, footerY - 2.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text('Powered by Unique Training Centre • Bhangar, South 24 Parganas, West Bengal – 743502.', margin, footerY + 1.2);

    // Right Confidential tag
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(148, 163, 184);
    doc.text('CONFIDENTIAL • OFFICIAL RECORD', rightX, footerY + 1.2, { align: 'right' });
  }

  // Trigger Save File with Universal APK / WebView & Browser Compatibility
  const safeName = String(student.name || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeRollOrId = String(student.rollNumber || student.id || getISTDateString().replace(/-/g, ''));
  const fileName = `UTC_Dossier_${safeName}_${safeRollOrId}.pdf`;

  const pdfBlob = doc.output('blob');
  return exportFile({
    blob: pdfBlob,
    fileName,
    mimeType: 'application/pdf',
  });
}

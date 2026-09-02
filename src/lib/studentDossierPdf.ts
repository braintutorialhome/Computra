import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { safeFormat } from './utils';
import { Student, Fee, DueFee, TestResult } from '../types';

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

export function exportStudentDossierToPDF(dossier: StudentDossierData) {
  const { student, totalPaid, paidCount, totalDue, dueCount, attendanceRate, paidFeesList, dueFeesList } = dossier;
  
  // Initialize A4 PDF document in portrait mode
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 14;

  // 1. Top Decorative Brand Bar
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, pageWidth, 5, 'F');

  // 2. Organization Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 27, 75); // Deep Indigo
  doc.text('UTC COMPUTRA', margin, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text('Center of Excellence for Computer Applications, Computer Science & AI', margin, currentY + 11);
  doc.text('UTC Campus, Bhangar, South 24 Parganas, West Bengal', margin, currentY + 15);

  // Header Right Side: Document Tag & Timestamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text('STUDENT DOSSIER', pageWidth - margin, currentY + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${safeFormat(new Date(), 'dd MMM yyyy, HH:mm')}`, pageWidth - margin, currentY + 11, { align: 'right' });
  doc.text(`Doc ID: DOS-${student.id || 'N/A'}`, pageWidth - margin, currentY + 15, { align: 'right' });

  // Divider Line
  currentY += 19;
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 6;

  // 3. Student Identity Header Banner
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 22, 3, 3, 'FD');

  // Student Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(student.name || 'Unnamed Student', margin + 6, currentY + 9);

  // Student Meta (ID, Roll Number, Class)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const rollText = student.rollNumber ? ` • Roll No: ${student.rollNumber}` : '';
  const classText = student.class ? ` • Class: ${student.class}` : '';
  doc.text(`Student ID: ${student.id || 'N/A'}${rollText}${classText}`, margin + 6, currentY + 16);

  // Status Badge on Right
  const statusStr = (student.status || 'Active').toUpperCase();
  const badgeWidth = 28;
  const badgeHeight = 7;
  const badgeX = pageWidth - margin - badgeWidth - 6;
  const badgeY = currentY + 7;

  if (student.status === 'approved') {
    doc.setFillColor(220, 252, 231); // Emerald 100
    doc.setTextColor(22, 101, 52); // Emerald 800
  } else if (student.status === 'pending') {
    doc.setFillColor(254, 243, 199); // Amber 100
    doc.setTextColor(146, 64, 14); // Amber 800
  } else {
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.setTextColor(51, 65, 85); // Slate 700
  }
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(statusStr, badgeX + (badgeWidth / 2), badgeY + 4.8, { align: 'center' });

  currentY += 28;

  // 4. Financial Quick Summary Cards
  const cardGap = 6;
  const cardWidth = (pageWidth - (margin * 2) - cardGap) / 2;
  const cardHeight = 16;

  // Card 1: Total Fees Paid
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(187, 247, 208); // Emerald 200
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL FEES PAID', margin + 5, currentY + 5.5);
  doc.setFontSize(12);
  doc.text(`INR ${totalPaid.toLocaleString('en-IN')}`, margin + 5, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`${paidCount} transaction(s)`, margin + cardWidth - 5, currentY + 12, { align: 'right' });

  // Card 2: Assessed Due Fees
  const card2X = margin + cardWidth + cardGap;
  doc.setFillColor(255, 241, 242); // Rose 50
  doc.setDrawColor(254, 205, 211); // Rose 200
  doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(159, 18, 57);
  doc.text('ASSESSED OUTSTANDING DUES', card2X + 5, currentY + 5.5);
  doc.setFontSize(12);
  doc.text(`INR ${totalDue.toLocaleString('en-IN')}`, card2X + 5, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`${dueCount} pending`, card2X + cardWidth - 5, currentY + 12, { align: 'right' });

  currentY += cardHeight + 7;

  // 5. Section: Student Profile Details Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 27, 75);
  doc.text('1. Student Profile & Academic Details', margin, currentY);
  currentY += 2;

  const profileRows = [
    [
      { content: "Father's / Guardian Name", styles: { fontStyle: 'bold' as const, textColor: [71, 85, 105] as [number, number, number] } },
      { content: student.fatherName || 'N/A' },
      { content: 'Subject / Course', styles: { fontStyle: 'bold' as const, textColor: [71, 85, 105] as [number, number, number] } },
      { content: student.subject || 'N/A', styles: { fontStyle: 'bold' as const, textColor: [79, 70, 229] as [number, number, number] } }
    ],
    [
      { content: 'Gender', styles: { fontStyle: 'bold' as const, textColor: [71, 85, 105] as [number, number, number] } },
      { content: student.gender ? student.gender.toUpperCase() : 'N/A' },
      { content: 'Batch / Class', styles: { fontStyle: 'bold' as const, textColor: [71, 85, 105] as [number, number, number] } },
      { content: student.class || 'N/A' }
    ],
    [
      { content: 'Date of Birth', styles: { fontStyle: 'bold' as const, textColor: [71, 85, 105] as [number, number, number] } },
      { content: safeFormat(student.dob, 'dd MMM yyyy') },
      { content: 'Semester', styles: { fontStyle: 'bold' as const, textColor: [71, 85, 105] as [number, number, number] } },
      { content: student.semester || 'N/A' }
    ],
    [
      { content: 'Primary Mobile', styles: { fontStyle: 'bold' as const, textColor: [71, 85, 105] as [number, number, number] } },
      { content: student.mobile || 'N/A' },
      { content: 'Academic Session', styles: { fontStyle: 'bold' as const, textColor: [71, 85, 105] as [number, number, number] } },
      { content: student.session || 'N/A' }
    ],
    [
      { content: 'WhatsApp Contact', styles: { fontStyle: 'bold' as const, textColor: [71, 85, 105] as [number, number, number] } },
      { content: student.whatsapp || 'N/A' },
      { content: 'Admission Date', styles: { fontStyle: 'bold' as const, textColor: [71, 85, 105] as [number, number, number] } },
      { content: safeFormat(student.admissionDate, 'dd MMM yyyy') }
    ],
    [
      { content: 'Residential Address', styles: { fontStyle: 'bold' as const, textColor: [71, 85, 105] as [number, number, number] } },
      { content: student.address || 'No address provided', colSpan: 3 }
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: profileRows,
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 42, fillColor: [248, 250, 252] },
      1: { cellWidth: 50 },
      2: { cellWidth: 40, fillColor: [248, 250, 252] },
      3: { cellWidth: 'auto' },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need space for Fee Payment History
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 18;
  }

  // 6. Section: Fee Payment Ledger
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 27, 75);
  doc.text('2. Fee Payment Ledger & Collections', margin, currentY);
  currentY += 2;

  if (paidFeesList.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No fee payment collections recorded for this student.', margin, currentY + 5);
    currentY += 10;
  } else {
    const feeRows = paidFeesList.map((f, i) => [
      String(i + 1),
      safeFormat(f.date, 'dd MMM yyyy') || String(f.date || 'N/A'),
      f.month || 'Standard Term',
      `INR ${Number(f.amount || 0).toLocaleString('en-IN')}`,
      (f.status || 'Paid').toUpperCase()
    ]);

    // Total Row
    feeRows.push([
      '',
      'Total Collections',
      `${paidFeesList.length} receipt(s)`,
      `INR ${totalPaid.toLocaleString('en-IN')}`,
      'VERIFIED'
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['#', 'Receipt Date', 'Billing Month / Particulars', 'Amount Paid', 'Status']],
      body: feeRows,
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 2.2,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 26, halign: 'center' },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        // Style total row
        if (data.row.index === feeRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
          if (data.column.index === 3) {
            data.cell.styles.textColor = [22, 101, 52];
          }
        }
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Check if we need space for Due Fees History
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 18;
  }

  // 7. Section: Assessed Due Fees History
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 27, 75);
  doc.text('3. Assessed Due Fees History', margin, currentY);
  currentY += 2;

  if (dueFeesList.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52); // Emerald 800
    doc.text('✓ All assessed due fees are completely cleared for this student (INR 0 Outstanding).', margin, currentY + 5);
    currentY += 12;
  } else {
    const dueRows = dueFeesList.map((df, i) => [
      String(i + 1),
      safeFormat(df.date, 'dd MMM yyyy') || String(df.date || 'N/A'),
      df.remarks || 'Standard Assessment Assessment',
      `INR ${Number(df.amount || 0).toLocaleString('en-IN')}`
    ]);

    dueRows.push([
      '',
      'Total Assessed Due',
      `${dueFeesList.length} assessment(s)`,
      `INR ${totalDue.toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['#', 'Assessment Date', 'Remarks / Purpose', 'Due Amount']],
      body: dueRows,
      theme: 'striped',
      headStyles: {
        fillColor: [225, 29, 72], // Rose 600
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 2.2,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        if (data.row.index === dueRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [255, 241, 242];
          if (data.column.index === 3) {
            data.cell.styles.textColor = [159, 18, 57];
          }
        }
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // 8. Sign-off and Footer
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 25;
  } else {
    currentY = Math.max(currentY, pageHeight - 35);
  }

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('This is an official administrative record generated from UTC Computra Management System.', margin, currentY);
  doc.text('For institutional inquiries, contact administration at UTC Bhangar.', margin, currentY + 4);

  // Authorized signature stamp line
  const sigX = pageWidth - margin - 50;
  doc.line(sigX, currentY + 10, pageWidth - margin, currentY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Authorized Signatory', sigX + 25, currentY + 14, { align: 'center' });

  // Page Numbers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `UTC Computra • Student Dossier: ${student.name} • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Trigger Save File
  const safeName = (student.name || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `UTC_Dossier_${safeName}_${student.rollNumber || student.id || safeFormat(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
}

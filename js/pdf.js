/**
 * PDF Export Module - DEO Muzaffarabad Legal Case Management System
 * Uses jsPDF + autoTable from CDN (window.jspdf.jsPDF)
 */

window.PDFExport = (function () {
  'use strict';

  const { jsPDF } = window.jspdf;

  function safe(value, fallback) {
    if (value === null || value === undefined || value === '') return fallback || 'N/A';
    return value;
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }

  function todayFormatted() {
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function todayFileFormat() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function generateCasePDF(caseData, proceedings, compliance) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const tableStyles = {
      headStyles: {
        fillColor: [27, 58, 107],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [240, 244, 250]
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    };

    // --- Page Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('DISTRICT EDUCATION OFFICE', pageWidth / 2, y, { align: 'center' });
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('MUZAFFARABAD, AJK', pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Legal Case Summary Report', pageWidth / 2, y, { align: 'center' });

    // Case ID badge on right
    const caseId = safe(caseData && caseData.caseId, 'N/A');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const badgeText = 'ID: ' + caseId;
    const badgeWidth = doc.getTextWidth(badgeText) + 6;
    doc.setFillColor(27, 58, 107);
    doc.roundedRect(pageWidth - margin - badgeWidth, y - 5, badgeWidth, 7, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(badgeText, pageWidth - margin - badgeWidth + 3, y - 1);
    doc.setTextColor(0, 0, 0);

    y += 4;

    // Horizontal line separator
    doc.setDrawColor(27, 58, 107);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // --- Helper: Section title ---
    function sectionTitle(title) {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(27, 58, 107);
      doc.text(title, margin, y);
      doc.setTextColor(0, 0, 0);
      y += 6;
    }

    function checkPageBreak(needed) {
      const pageHeight = doc.internal.pageSize.getHeight();
      if (y + needed > pageHeight - 20) {
        doc.addPage();
        y = margin;
      }
    }

    // --- Section 1: Case Identification ---
    sectionTitle('1. Case Identification');
    doc.autoTable({
      startY: y,
      head: [['Field', 'Value']],
      body: [
        ['Case ID', safe(caseData && caseData.caseId)],
        ['Case Title', safe(caseData && caseData.caseTitle)],
        ['Case Number', safe(caseData && caseData.caseNumber)],
        ['Case Type', safe(caseData && caseData.caseType)],
        ['Status', safe(caseData && caseData.status)]
      ],
      ...tableStyles
    });
    y = doc.lastAutoTable.finalY + 8;

    // --- Section 2: Court Information ---
    sectionTitle('2. Court Information');
    doc.autoTable({
      startY: y,
      head: [['Field', 'Value']],
      body: [
        ['Court Name', safe(caseData && caseData.courtName)],
        ['Judge Name', safe(caseData && caseData.judgeName)],
        ['Department Role', safe(caseData && caseData.departmentRole)]
      ],
      ...tableStyles
    });
    y = doc.lastAutoTable.finalY + 8;

    // --- Section 3: Parties ---
    sectionTitle('3. Parties');
    doc.autoTable({
      startY: y,
      head: [['Field', 'Value']],
      body: [
        ['Petitioner', safe(caseData && caseData.petitioner)],
        ['Respondent', safe(caseData && caseData.respondent)]
      ],
      ...tableStyles
    });
    y = doc.lastAutoTable.finalY + 8;

    // --- Section 4: Key Dates ---
    sectionTitle('4. Key Dates');
    const replyFiled = caseData && caseData.replyFiled;
    const replyFiledDisplay = replyFiled === true || replyFiled === 'yes' || replyFiled === 'Yes' ? 'Yes' :
                              replyFiled === false || replyFiled === 'no' || replyFiled === 'No' ? 'No' :
                              safe(replyFiled);
    doc.autoTable({
      startY: y,
      head: [['Field', 'Value']],
      body: [
        ['Date of Institution', formatDate(caseData && caseData.dateOfInstitution)],
        ['Date Notice Received', formatDate(caseData && caseData.dateNoticeReceived)],
        ['Reply Deadline', formatDate(caseData && caseData.replyDeadline)],
        ['Reply Filed', replyFiledDisplay],
        ['Next Hearing Date', formatDate(caseData && caseData.nextHearingDate)]
      ],
      ...tableStyles
    });
    y = doc.lastAutoTable.finalY + 8;

    // --- Section 5: Case Details ---
    sectionTitle('5. Case Details');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const details = [
      { label: 'Brief Facts', value: caseData && caseData.briefFacts },
      { label: 'Relief Claimed', value: caseData && caseData.reliefClaimed },
      { label: "Department's Position", value: caseData && caseData.departmentPosition }
    ];

    details.forEach(function (item) {
      if (!item.value) return;
      checkPageBreak(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(item.label + ':', margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(String(item.value), contentWidth);
      lines.forEach(function (line) {
        checkPageBreak(5);
        doc.text(line, margin, y);
        y += 4;
      });
      y += 3;
    });

    y += 3;

    // --- Section 6: Department Representation ---
    sectionTitle('6. Department Representation');
    doc.autoTable({
      startY: y,
      head: [['Field', 'Value']],
      body: [
        ['Counsel Name', safe(caseData && caseData.counselName)],
        ['Focal Person', safe(caseData && caseData.focalPerson)],
        ['Contact', safe(caseData && caseData.contact)]
      ],
      ...tableStyles
    });
    y = doc.lastAutoTable.finalY + 8;

    // --- Section 7: Proceedings History ---
    sectionTitle('7. Proceedings History');
    const procData = Array.isArray(proceedings) && proceedings.length > 0 ? proceedings : null;
    if (procData) {
      const sorted = procData.slice().sort(function (a, b) {
        return new Date(b.date || 0) - new Date(a.date || 0);
      });
      doc.autoTable({
        startY: y,
        head: [['Date', 'Summary', 'Court Order', 'Next Date', 'Action Required']],
        body: sorted.map(function (p) {
          return [
            formatDate(p.date),
            safe(p.summary),
            safe(p.courtOrder),
            formatDate(p.nextDate),
            safe(p.actionRequired)
          ];
        }),
        ...tableStyles,
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 22 },
          4: { cellWidth: 30 }
        }
      });
      y = doc.lastAutoTable.finalY + 8;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('No proceedings recorded.', margin, y);
      y += 8;
    }

    // --- Section 8: Compliance Record ---
    sectionTitle('8. Compliance Record');
    const compData = Array.isArray(compliance) && compliance.length > 0 ? compliance : null;
    if (compData) {
      doc.autoTable({
        startY: y,
        head: [['Description', 'Deadline', 'Status', 'Completed On']],
        body: compData.map(function (c) {
          return [
            safe(c.description),
            formatDate(c.deadline),
            safe(c.status),
            formatDate(c.completedOn)
          ];
        }),
        ...tableStyles
      });
      y = doc.lastAutoTable.finalY + 8;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('No compliance records.', margin, y);
      y += 8;
    }

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        'Generated by DEO Muzaffarabad Legal Case Management System | Date: ' + todayFormatted(),
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.setTextColor(0, 0, 0);
    }

    // --- Save ---
    const filename = 'DEO-MZD-' + safe(caseData && caseData.caseId, 'UNKNOWN') + '-' + todayFileFormat() + '.pdf';
    doc.save(filename);

    return filename;
  }

  return {
    generateCasePDF: generateCasePDF
  };
})();

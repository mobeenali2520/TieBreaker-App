/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DecisionProject } from '../types/decision';
import { calculateOptionResults } from './decisionEngine';

/**
 * Escapes values for CSV formatting according to RFC 4180
 */
function escapeCsv(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Sanitize filename for download
 */
function sanitizeFilename(title: string, ext: string): string {
  const clean = title.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  return `${clean || 'decision_matrix'}.${ext}`;
}

/**
 * Exports decision matrix and complete analysis data to a CSV spreadsheet file
 */
export function exportProjectToCsv(project: DecisionProject): void {
  const results = calculateOptionResults(project);
  const csvLines: string[] = [];

  // 1. Metadata Block
  csvLines.push(escapeCsv('THE TIEBREAKER - DECISION MATRIX EXPORT'));
  csvLines.push(`${escapeCsv('Project Title')},${escapeCsv(project.title)}`);
  csvLines.push(`${escapeCsv('Category')},${escapeCsv(project.category || 'General')}`);
  csvLines.push(`${escapeCsv('Description')},${escapeCsv(project.description || 'N/A')}`);
  csvLines.push(`${escapeCsv('Export Date')},${escapeCsv(new Date().toLocaleDateString())}`);
  csvLines.push(`${escapeCsv('AI Disclaimer')},${escapeCsv('Gemini can make mistakes, please verify it.')}`);
  csvLines.push('');

  // 1.1. AI Executive Verdict & Analysis Statement
  if (project.verdict) {
    csvLines.push(escapeCsv('AI EXECUTIVE VERDICT & ANALYSIS STATEMENT'));
    csvLines.push(`${escapeCsv('Recommended Option')},${escapeCsv(project.verdict.recommendedOptionName || 'N/A')}`);
    csvLines.push(`${escapeCsv('Confidence Score')},${escapeCsv(`${project.verdict.confidenceScore || 85}%`)}`);
    csvLines.push(`${escapeCsv('AI Executive Summary')},${escapeCsv(project.verdict.executiveSummary || 'N/A')}`);
    if (project.verdict.keyReasons?.length) {
      csvLines.push(`${escapeCsv('Key Strategic Drivers')},${escapeCsv(project.verdict.keyReasons.join('; '))}`);
    }
    if (project.verdict.primaryRisks?.length) {
      csvLines.push(`${escapeCsv('Key Risks to Monitor')},${escapeCsv(project.verdict.primaryRisks.join('; '))}`);
    }
    if (project.verdict.suggestedNextSteps?.length) {
      csvLines.push(`${escapeCsv('Suggested Next Steps')},${escapeCsv(project.verdict.suggestedNextSteps.join('; '))}`);
    }
    csvLines.push(`${escapeCsv('AI Statement Note')},${escapeCsv('Gemini can make mistakes, please verify important information.')}`);
    csvLines.push('');
  }

  // 2. Executive Summary & Rankings
  csvLines.push(escapeCsv('EXECUTIVE SUMMARY & RANKINGS'));
  csvLines.push([
    escapeCsv('Rank'),
    escapeCsv('Option Name'),
    escapeCsv('Sum Raw Rating (1-10)'),
    escapeCsv('Weighted Total Points'),
    escapeCsv('Normalized Match %'),
    escapeCsv('Status'),
  ].join(','));

  results.forEach((res, idx) => {
    const rawSum = res.criterionContributions.reduce((sum, c) => sum + c.score, 0);
    csvLines.push([
      escapeCsv(idx + 1),
      escapeCsv(res.option.name),
      escapeCsv(rawSum),
      escapeCsv(res.rawScore),
      escapeCsv(`${res.normalizedPercentage}%`),
      escapeCsv(res.isWinner ? 'RECOMMENDED WINNER' : 'Alternative'),
    ].join(','));
  });
  csvLines.push('');

  // 3. Decision Matrix Grid
  csvLines.push(escapeCsv('DECISION EVALUATION MATRIX'));
  
  // Matrix Header Row
  const matrixHeaders = [
    escapeCsv('Criterion Name'),
    escapeCsv('Weight (1-10)'),
    escapeCsv('Direction'),
  ];
  project.options.forEach((opt) => {
    matrixHeaders.push(escapeCsv(`${opt.name} (Raw Rating 1-10)`));
    matrixHeaders.push(escapeCsv(`${opt.name} (Weighted Pts)`));
  });
  csvLines.push(matrixHeaders.join(','));

  // Matrix Criteria Rows
  project.criteria.forEach((crit) => {
    const row = [
      escapeCsv(crit.name),
      escapeCsv(crit.weight),
      escapeCsv(crit.isPositive ? 'Positive (+)' : 'Negative / Cost (-)'),
    ];

    project.options.forEach((opt) => {
      const scoreKey = `${opt.id}_${crit.id}`;
      const rawScore = project.scores[scoreKey] ?? 5;
      const effectiveScore = crit.isPositive ? rawScore : 11 - rawScore;
      const weightedScore = effectiveScore * crit.weight;

      row.push(escapeCsv(rawScore));
      row.push(escapeCsv(weightedScore));
    });

    csvLines.push(row.join(','));
  });

  // Total Scores Row
  const totalRow = [
    escapeCsv('TOTAL WEIGHTED SCORE'),
    escapeCsv('-'),
    escapeCsv('-'),
  ];
  project.options.forEach((opt) => {
    const res = results.find((r) => r.option.id === opt.id);
    const rawSum = res ? res.criterionContributions.reduce((sum, c) => sum + c.score, 0) : 0;
    totalRow.push(escapeCsv(rawSum));
    totalRow.push(escapeCsv(res?.rawScore ?? 0));
  });
  csvLines.push(totalRow.join(','));

  // Normalized Percentage Row
  const matchRow = [
    escapeCsv('NORMALIZED MATCH %'),
    escapeCsv('-'),
    escapeCsv('-'),
  ];
  project.options.forEach((opt) => {
    const res = results.find((r) => r.option.id === opt.id);
    matchRow.push(escapeCsv('-'));
    matchRow.push(escapeCsv(`${res?.normalizedPercentage ?? 0}%`));
  });
  csvLines.push(matchRow.join(','));
  csvLines.push('');

  // 4. SWOT Summary
  if (project.swot && Object.keys(project.swot).length > 0) {
    csvLines.push(escapeCsv('SWOT ANALYSIS SUMMARY'));
    csvLines.push([
      escapeCsv('Option Name'),
      escapeCsv('Category'),
      escapeCsv('Details'),
    ].join(','));

    project.options.forEach((opt) => {
      const optSwot = project.swot?.[opt.id];
      if (optSwot) {
        if (optSwot.strengths?.length) {
          csvLines.push(`${escapeCsv(opt.name)},${escapeCsv('Strengths')},${escapeCsv(optSwot.strengths.join('; '))}`);
        }
        if (optSwot.weaknesses?.length) {
          csvLines.push(`${escapeCsv(opt.name)},${escapeCsv('Weaknesses')},${escapeCsv(optSwot.weaknesses.join('; '))}`);
        }
        if (optSwot.opportunities?.length) {
          csvLines.push(`${escapeCsv(opt.name)},${escapeCsv('Opportunities')},${escapeCsv(optSwot.opportunities.join('; '))}`);
        }
        if (optSwot.threats?.length) {
          csvLines.push(`${escapeCsv(opt.name)},${escapeCsv('Threats')},${escapeCsv(optSwot.threats.join('; '))}`);
        }
      }
    });
    csvLines.push('');
  }

  // 5. Blind Spots & Devil's Advocate
  if (project.blindSpots && project.blindSpots.length > 0) {
    csvLines.push(escapeCsv('BLIND SPOTS & IDENTIFIED RISKS'));
    csvLines.push([
      escapeCsv('Title'),
      escapeCsv('Severity'),
      escapeCsv('Description'),
      escapeCsv('Mitigation Strategy'),
    ].join(','));

    project.blindSpots.forEach((bs) => {
      csvLines.push([
        escapeCsv(bs.title),
        escapeCsv(bs.severity.toUpperCase()),
        escapeCsv(bs.description),
        escapeCsv(bs.mitigation),
      ].join(','));
    });
    csvLines.push('');
  }

  if (project.devilsAdvocate) {
    csvLines.push(escapeCsv("DEVIL'S ADVOCATE COUNTER-ANALYSIS"));
    csvLines.push(`${escapeCsv('Target Option')},${escapeCsv(project.devilsAdvocate.targetOptionName)}`);
    csvLines.push(`${escapeCsv('Counter Argument')},${escapeCsv(project.devilsAdvocate.counterArgument)}`);
    csvLines.push(`${escapeCsv('Key Risks')},${escapeCsv((project.devilsAdvocate.keyRisks || []).join('; '))}`);
    csvLines.push(`${escapeCsv('Challenging Questions')},${escapeCsv((project.devilsAdvocate.challengingQuestions || []).join('; '))}`);
    csvLines.push('');
  }

  // 6. 10-10-10 Time Horizon
  if (project.tenTenTen) {
    csvLines.push(escapeCsv('10-10-10 TIME HORIZON IMPACT'));
    csvLines.push(`${escapeCsv('In 10 Minutes')},${escapeCsv(project.tenTenTen.tenMinutes)}`);
    csvLines.push(`${escapeCsv('In 10 Months')},${escapeCsv(project.tenTenTen.tenMonths)}`);
    csvLines.push(`${escapeCsv('In 10 Years')},${escapeCsv(project.tenTenTen.tenYears)}`);
  }

  // Generate Blob and download
  const csvContent = csvLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', sanitizeFilename(project.title, 'csv'));
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports full decision project report to a formatted PDF document
 */
export function exportProjectToPdf(project: DecisionProject): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const results = calculateOptionResults(project);
  const winner = results.find((r) => r.isWinner) || results[0];
  const verdict = project.verdict;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 15;

  // Header Colors
  const primaryColor: [number, number, number] = [30, 27, 75]; // Slate/Indigo #1e1b4b
  const accentColor: [number, number, number] = [79, 70, 229]; // Indigo #4f46e5
  const emeraldColor: [number, number, number] = [16, 185, 129]; // Emerald #10b981

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('THE TIEBREAKER', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254);
  doc.text('Executive Decision Analysis Report', 14, 18);

  const dateStr = new Date(project.updatedAt).toLocaleDateString();
  doc.text(`Date: ${dateStr}`, pageWidth - 14, 18, { align: 'right' });

  yPos = 35;

  // 2. Project Title & Description
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  
  const titleLines = doc.splitTextToSize(project.title, pageWidth - 28);
  doc.text(titleLines, 14, yPos);
  yPos += titleLines.length * 7 + 2;

  if (project.description) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    const descLines = doc.splitTextToSize(project.description, pageWidth - 28);
    doc.text(descLines, 14, yPos);
    yPos += descLines.length * 5 + 4;
  }

  // 3. Recommended Winner Box
  doc.setFillColor(243, 244, 256); // indigo light background
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, yPos, pageWidth - 28, 30, 3, 3, 'FD');

  doc.setTextColor(...accentColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('RECOMMENDED DECISION PATH', 20, yPos + 7);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  const recName = verdict?.recommendedOptionName || winner?.option.name || 'Top Choice';
  doc.text(recName, 20, yPos + 15);

  const matchScore = verdict?.confidenceScore || winner?.normalizedPercentage || 85;
  doc.setFillColor(...emeraldColor);
  doc.roundedRect(pageWidth - 55, yPos + 6, 35, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${matchScore}% Match`, pageWidth - 37.5, yPos + 13.5, { align: 'center' });

  if (verdict?.executiveSummary) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const summaryText = doc.splitTextToSize(verdict.executiveSummary, pageWidth - 48);
    doc.text(summaryText[0] || '', 20, yPos + 23);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Weighted score of ${winner?.rawScore || 0} pts across ${project.criteria.length} criteria.`, 20, yPos + 23);
  }

  yPos += 38;

  // 4. Decision Matrix Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Evaluation Matrix Grid', 14, yPos);
  yPos += 4;

  const tableHead = [
    ['Criterion Name', 'Wt', 'Type', ...project.options.map((o) => `${o.name} (Raw / Wtd)`)],
  ];

  const tableBody = project.criteria.map((crit) => {
    const row = [
      crit.name,
      crit.weight.toString(),
      crit.isPositive ? 'Pos (+)' : 'Cost (-)',
    ];

    project.options.forEach((opt) => {
      const rawScore = project.scores[`${opt.id}_${crit.id}`] ?? 5;
      const effectiveScore = crit.isPositive ? rawScore : 11 - rawScore;
      const weightedScore = effectiveScore * crit.weight;
      row.push(`${rawScore}/10 (${weightedScore}pt)`);
    });

    return row;
  });

  // Add Totals Row
  const totalRow = [
    'TOTAL WEIGHTED SCORE',
    '-',
    '-',
    ...project.options.map((opt) => {
      const res = results.find((r) => r.option.id === opt.id);
      return `${res?.rawScore ?? 0} pts (${res?.normalizedPercentage ?? 0}%)`;
    }),
  ];
  tableBody.push(totalRow);

  autoTable(doc, {
    startY: yPos,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [238, 242, 255]; // highlight total row
      }
    },
  });

  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 10;

  // Check if we need a page break
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = 20;
  }

  // 5. Executive Key Reasons & Risks
  if (verdict?.keyReasons?.length || verdict?.primaryRisks?.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Key Drivers & Strategic Risks', 14, yPos);
    yPos += 5;

    const driversHead = [['Key Strategic Reasons', 'Primary Risks to Manage']];
    const maxRows = Math.max(verdict.keyReasons?.length || 0, verdict.primaryRisks?.length || 0);
    const driversBody: string[][] = [];

    for (let i = 0; i < maxRows; i++) {
      const reason = verdict.keyReasons?.[i] ? `• ${verdict.keyReasons[i]}` : '';
      const risk = verdict.primaryRisks?.[i] ? `• ${verdict.primaryRisks[i]}` : '';
      driversBody.push([reason, risk]);
    }

    autoTable(doc, {
      startY: yPos,
      head: driversHead,
      body: driversBody,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Check page break
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = 20;
  }

  // 6. Blind Spots & Devil's Advocate
  if (project.blindSpots?.length || project.devilsAdvocate) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Blind Spots & Devil\'s Advocate Challenge', 14, yPos);
    yPos += 5;

    const bsHead = [['Category', 'Title / Insight', 'Actionable Mitigation / Challenge']];
    const bsBody: string[][] = [];

    if (project.devilsAdvocate) {
      bsBody.push([
        "Devil's Advocate",
        `Counter-case vs ${project.devilsAdvocate.targetOptionName}`,
        project.devilsAdvocate.counterArgument,
      ]);
    }

    if (project.blindSpots) {
      project.blindSpots.forEach((bs) => {
        bsBody.push([
          `Blind Spot (${bs.severity.toUpperCase()})`,
          bs.title,
          `${bs.description} -> ${bs.mitigation}`,
        ]);
      });
    }

    autoTable(doc, {
      startY: yPos,
      head: bsHead,
      body: bsBody,
      theme: 'grid',
      headStyles: {
        fillColor: [180, 83, 9], // Amber dark
        textColor: [255, 255, 255],
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Check page break
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = 20;
  }

  // 7. 10-10-10 Time Horizon
  if (project.tenTenTen) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('10-10-10 Time Horizon Perspective', 14, yPos);
    yPos += 5;

    const tHead = [['Time Horizon', 'Strategic Outlook & Trajectory']];
    const tBody = [
      ['In 10 Minutes', project.tenTenTen.tenMinutes],
      ['In 10 Months', project.tenTenTen.tenMonths],
      ['In 10 Years', project.tenTenTen.tenYears],
    ];

    autoTable(doc, {
      startY: yPos,
      head: tHead,
      body: tBody,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
      },
      margin: { left: 14, right: 14 },
    });
  }

  // 8. Footer Page Numbers
  // @ts-ignore
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Page ${i} of ${pageCount} • The Tiebreaker • Gemini can make mistakes, please verify important information`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  doc.save(sanitizeFilename(project.title, 'pdf'));
}

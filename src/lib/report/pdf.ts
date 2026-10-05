import { jsPDF } from 'jspdf';
import type { ReportPayload } from '@/lib/services/reports';

// ------------------------------------------------------------
// PDF renderer for the Family Career Agreement Report.
// Runs in the browser (download) and in Node (tests).
// ------------------------------------------------------------

const NAVY: [number, number, number] = [16, 43, 70];
const ROYAL: [number, number, number] = [37, 99, 235];
const TEAL: [number, number, number] = [20, 184, 166];
const GREY: [number, number, number] = [100, 116, 139];

const PAGE_W = 210;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;

/**
 * jsPDF's built-in fonts are WinAnsi-encoded and cannot represent ₹ (U+20B9),
 * the Devanagari digits, or most other non-Latin glyphs — they silently render
 * as a backtick or a blank. Rather than shipping a Unicode font for a few
 * characters, transliterate to the ASCII forms Indian readers are equally
 * familiar with: ₹1,20,000 → Rs 1,20,000.
 */
function sanitize(text: string): string {
  return text
    .replace(/\u20B9/g, 'Rs ')
    .replace(/[\u0966-\u096F]/g, (d) => String(d.charCodeAt(0) - 0x0966))
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2026]/g, '...')
    .replace(/\u00A0/g, ' ')
    // Anything still outside Latin-1 would garble; drop it rather than emit noise.
    .replace(/[^\x20-\xFF\n]/g, '');
}

export function renderReportPdf(payload: ReportPayload): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 0;

  const ensure = (needed: number) => {
    if (y + needed > 282) {
      doc.addPage();
      y = 18;
    }
  };

  const heading = (text: string, size = 15) => {
    ensure(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(...NAVY);
    doc.text(sanitize(text), MARGIN, y);
    y += size * 0.5 + 3;
  };

  const section = (text: string) => {
    ensure(14);
    y += 2;
    doc.setFillColor(...NAVY);
    doc.rect(MARGIN, y - 4.5, CONTENT_W, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(sanitize(text.toUpperCase()), MARGIN + 3, y + 0.6);
    y += 9;
    doc.setTextColor(...NAVY);
  };

  const para = (text: string, opts: { bold?: boolean; color?: [number, number, number]; size?: number } = {}) => {
    const size = opts.size ?? 9.5;
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? [30, 41, 59]));
    const lines = doc.splitTextToSize(sanitize(text), CONTENT_W) as string[];
    for (const line of lines) {
      ensure(5.2);
      doc.text(line, MARGIN, y);
      y += 4.6;
    }
  };

  const bullet = (text: string) => {
    const size = 9.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(sanitize(text), CONTENT_W - 6) as string[];
    lines.forEach((line, i) => {
      ensure(5.2);
      if (i === 0) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...ROYAL);
        doc.text('-', MARGIN, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
      }
      doc.text(line, MARGIN + 5, y);
      y += 4.6;
    });
  };

  const kv = (label: string, value: string) => {
    ensure(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.2);
    doc.setTextColor(...GREY);
    doc.text(sanitize(label), MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(sanitize(value) || '-', CONTENT_W - 55) as string[];
    doc.text(lines[0] ?? '-', MARGIN + 55, y);
    y += 4.8;
    for (let i = 1; i < lines.length; i++) {
      ensure(5);
      doc.text(lines[i]!, MARGIN + 55, y);
      y += 4.6;
    }
  };

  const table = (headers: string[], rows: string[][], widths: number[]) => {
    const drawHeader = () => {
      doc.setFillColor(...TEAL);
      doc.rect(MARGIN, y - 4, CONTENT_W, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.4);
      doc.setTextColor(255, 255, 255);
      let x = MARGIN + 2;
      headers.forEach((h, i) => {
        doc.text(sanitize(h), x, y);
        x += widths[i]!;
      });
      y += 6.5;
    };
    ensure(16);
    drawHeader();
    doc.setFontSize(8.4);
    rows.forEach((row) => {
      const cellLines = row.map((cell, i) => doc.splitTextToSize(sanitize(cell), widths[i]! - 3) as string[]);
      const h = Math.max(...cellLines.map((l) => l.length)) * 3.6 + 2.5;
      ensure(h + 6);
      let x = MARGIN + 2;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      cellLines.forEach((lines, i) => {
        lines.forEach((line, j) => {
          doc.text(line, x, y + j * 3.6);
        });
        x += widths[i]!;
      });
      y += h;
      ensure(8);
    });
    y += 2;
  };

  // ---- Cover header ----
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, 34, 'F');
  doc.setFillColor(...TEAL);
  doc.rect(0, 34, PAGE_W, 2.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('PATHALIGN AI', MARGIN, 16);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Family Career Agreement Report', MARGIN, 24);
  doc.setFontSize(8.5);
  doc.text(`Generated: ${new Date(payload.generatedAt).toUTCString()}`, MARGIN, 29.5);
  y = 46;

  heading('Family Career Agreement Report', 16);
  para(
    'This report brings together the family profile, student interests, parent concerns, recommended vocational careers, verified earning information, training providers and next steps — in one place, so the whole family can review it together.',
  );

  // ---- Family profile ----
  section('1. Family Profile');
  kv('Family code', payload.family.code);
  kv('Location', [payload.family.district, payload.family.state].filter(Boolean).join(', ') || '—');
  kv('Area type', payload.family.areaType ?? '—');
  kv(
    'Members',
    payload.family.members.map((m) => `${m.name} (${m.relation.toLowerCase()})`).join(', '),
  );

  // ---- Student ----
  section('2. Student Interests & Assessment');
  kv('Student', payload.student.name ?? '—');
  kv('Age / qualification', `${payload.student.age ?? '—'} / ${payload.student.qualification ?? '—'}`);
  kv('Interests', payload.student.interests.join(', ') || '—');
  kv('Skills', payload.student.skills.join(', ') || '—');
  kv('Aspiration', payload.student.aspirations ?? '—');
  if (payload.student.assessment) {
    kv('Interest assessment score', `${payload.student.assessment.overall}/100 (indicative, not psychological)`);
    const dims = Object.entries(payload.student.assessment.dimensions);
    if (dims.length) {
      table(['Dimension', 'Score'], dims.map(([k, v]) => [k, `${v}/100`]), [120, 50]);
    }
  }

  // ---- Parent concerns ----
  section('3. Parent Concerns');
  if (payload.parent.expectations) kv('Expectations', payload.parent.expectations);
  if (payload.parent.financialConcerns) kv('Financial concern', payload.parent.financialConcerns);
  if (payload.parent.concerns.length === 0) {
    para('No concerns recorded yet.');
  } else {
    table(
      ['Concern', 'Detail', 'Status', 'Date'],
      payload.parent.concerns.map((c) => [c.label, c.detail, c.status, c.date]),
      [34, 96, 26, 24],
    );
  }

  // ---- Consensus ----
  section('4. Family Consensus');
  if (payload.consensus) {
    kv('Status', payload.consensus.status.replace(/_/g, ' '));
    para(payload.consensus.summary);
    kv('Common preferences', payload.consensus.common.join(', ') || 'None yet');
    kv('Student-only preferences', payload.consensus.studentOnly.join(', ') || 'None');
    kv('Parent-only preferences', payload.consensus.parentOnly.join(', ') || 'None');
    kv("Student's voluntary decision", payload.consensus.studentDecision ?? 'Not recorded');
    kv("Parent's voluntary decision", payload.consensus.parentDecision ?? 'Not recorded');
  } else {
    para('No consensus exercise completed yet. Run the Family Consensus Engine to compare preferences.');
  }

  // ---- Recommendations ----
  section('5. Recommended Vocational Careers');
  if (payload.recommendations.length === 0) {
    para('Complete the career assessment to receive recommendations.');
  } else {
    payload.recommendations.forEach((r, i) => {
      ensure(18);
      para(`${i + 1}. ${r.title}${r.matchScore ? ` — match ${r.matchScore}%` : ''}`, { bold: true });
      para(r.rationale);
      r.evidence.forEach((e) => bullet(`${e.label}: ${e.value}`));
      y += 1.5;
    });
  }

  // ---- Earnings ----
  section('6. Verified / Recorded Earning Information');
  if (payload.earnings.length === 0) {
    para('No earning records available for the recommended careers.');
  } else {
    table(
      ['Trade', 'Level', 'Monthly range', 'Record status'],
      payload.earnings.slice(0, 20).map((e) => [e.trade, e.level, e.range + (e.estimate ? ' (est.)' : ''), e.status]),
      [50, 24, 66, 30],
    );
    para('Earning figures above are drawn from referenced records and are estimates — not guarantees.', {
      color: ROYAL,
      size: 8.8,
    });
  }

  // ---- Pathways ----
  section('7. Qualification & Career Pathways');
  if (payload.pathways.length === 0) para('No progression pathway records available yet.');
  payload.pathways.forEach((p) => {
    para(p.trade, { bold: true });
    p.stages.forEach((s) => bullet(`Stage ${s.order}: ${s.title}${s.qualification ? ` — ${s.qualification}` : ''}`));
    y += 1;
  });

  // ---- Providers ----
  section('8. Training Providers');
  if (payload.providers.length === 0) para('No training provider records match the recommendations yet.');
  payload.providers.forEach((p) => {
    ensure(14);
    para(`${p.name} — ${p.district}, ${p.state}`, { bold: true });
    para(`Type: ${p.type.replace(/_/g, ' ')} | Record status: ${p.verificationStatus}`);
    p.courses.forEach((c) => bullet(c));
  });

  // ---- Action plan ----
  section('9. Family Career Action Plan');
  payload.actionPlan.forEach((a) => bullet(a));

  // ---- Counselling summary ----
  section('10. Counselling Summary');
  if (payload.counsellingSessions.length === 0) para('No counselling sessions recorded yet.');
  payload.counsellingSessions.forEach((s) => {
    para(`${s.date} — ${s.title} (${s.kind}, ${s.status})`, { bold: true });
    if (s.summary) para(s.summary);
  });

  // ---- Sources ----
  section('11. Sources & References');
  if (payload.sources.length === 0) para('No external sources attached yet.');
  payload.sources.forEach((s) => {
    bullet(`${s.name}${s.url ? ` — ${s.url}` : ''} [${s.status}${s.synthetic ? ', synthetic demo record' : ''}]`);
  });

  // ---- Disclaimers ----
  section('12. Important Notes');
  payload.disclaimers.forEach((d) => bullet(d));

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...GREY);
    doc.text('PATHALIGN AI — Aligning Dreams with Opportunities.', MARGIN, 291);
    doc.text(`Page ${i} of ${pages}`, PAGE_W - MARGIN, 291, { align: 'right' });
  }

  return doc;
}

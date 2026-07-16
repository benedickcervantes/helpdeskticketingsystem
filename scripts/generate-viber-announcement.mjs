/**
 * Generates Viber group announcement templates — Helpdesk Policy rollout.
 * Simple English update: policy has been sent via official email.
 */
import fs from 'fs';
import path from 'path';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

const COMPANY = "FEDERAL PIONEER DEV'T. CORP.";
const SYSTEM = 'FPDC IT Helpdesk Ticketing System';

const NAVY = '1B365D';
const GOLD = 'C5A028';
const LIGHT_BG = 'F4F6F8';
const GRAY = '4A5568';

const font = (text, opts = {}) =>
  new TextRun({
    text,
    font: 'Calibri',
    size: opts.size ?? 22,
    bold: opts.bold ?? false,
    italics: opts.italics ?? false,
    color: opts.color ?? '000000',
  });

const para = (children, opts = {}) =>
  new Paragraph({
    spacing: { after: opts.after ?? 160, before: opts.before ?? 0 },
    alignment: opts.alignment,
    children: Array.isArray(children) ? children : [children],
  });

const heading = (text) =>
  para([font(text, { size: 30, bold: true, color: NAVY })], { before: 360, after: 200 });

const subheading = (text) =>
  para([font(text, { size: 24, bold: true, color: NAVY })], { before: 200, after: 120 });

const body = (text) => para([font(text, { size: 22 })]);

const blank = () => para([], { after: 80 });

const bullet = (text) => para([font(`• ${text}`, { size: 22 })]);

const divider = () =>
  new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD } },
    spacing: { after: 200, before: 200 },
    children: [],
  });

const copyBox = (lines) => [
  subheading('Copy & Paste Message'),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
            margins: { top: 140, bottom: 140, left: 160, right: 160 },
            children: lines.map((line) =>
              line === ''
                ? blank()
                : para([font(line, { size: 21 })], { after: line === '' ? 80 : 60 }),
            ),
          }),
        ],
      }),
    ],
  }),
  blank(),
];

const cover = [
  para([font(COMPANY, { size: 28, bold: true, color: NAVY })], { alignment: AlignmentType.CENTER }),
  para([font('Viber Group Announcement', { size: 40, bold: true, color: NAVY })], {
    alignment: AlignmentType.CENTER,
    after: 200,
  }),
  para(
    [font('Helpdesk Policy — Official Email Notification', { size: 22, color: GRAY })],
    { alignment: AlignmentType.CENTER, after: 400 },
  ),
  body(
    'Simple English message to inform the team that the Helpdesk Policy has been officially sent via email to Management and HR.',
  ),
  blank(),
  heading('Templates Included'),
  bullet('Template 1 — Main Announcement'),
  bullet('Template 2 — Short Reminder'),
  new Paragraph({ children: [new TextRun({ break: 1, pageBreakBefore: true })] }),
];

const viberMainLines = [
  '📢 FPDC IT HELP DESK — ANNOUNCEMENT',
  '',
  'Good day, Team!',
  '',
  'Please be informed that the FPDC IT Helpdesk Ticketing System Policy and Standards Manual (Version 1.1) has been officially sent via email to Management and HR for review and approval.',
  '',
  'If you are included in the email thread, kindly check your inbox for the full policy document and details.',
  '',
  'Further updates will be shared once management approval is completed.',
  '',
  'Thank you.',
  '',
  '— IT Department',
  'Federal Pioneer Dev\'t. Corp.',
];

const viberReminderLines = [
  '📌 REMINDER — FPDC Helpdesk Policy',
  '',
  'This is a reminder that the FPDC IT Helpdesk Ticketing System Policy and Standards Manual has been officially sent via email to Management and HR.',
  '',
  'Please check your inbox if you are part of the email thread. Further updates will follow after approval.',
  '',
  '— IT Department | FPDC',
];

const template1 = [
  heading('Template 1 — Main Announcement'),
  body('Use this when posting the initial Viber update after sending the email.'),
  divider(),
  ...copyBox(viberMainLines),
  new Paragraph({ children: [new TextRun({ break: 1, pageBreakBefore: true })] }),
];

const template2 = [
  heading('Template 2 — Short Reminder'),
  body('Use this as a brief follow-up after a few days, if needed.'),
  divider(),
  ...copyBox(viberReminderLines),
];

const doc = new Document({
  sections: [
    {
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      headers: {
        default: new Header({
          children: [
            para([font(`${COMPANY} — Viber Templates`, { size: 16, color: GRAY, italics: true })], {
              alignment: AlignmentType.RIGHT,
            }),
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD } },
              spacing: { after: 120 },
              children: [],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 6, color: GOLD } },
              spacing: { before: 120 },
              children: [],
            }),
            para(
              [
                font(`${COMPANY}  |  `, { size: 16, color: GRAY }),
                font('Page ', { size: 16, color: GRAY }),
                new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: GRAY }),
                font(' of ', { size: 16, color: GRAY }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Calibri', size: 16, color: GRAY }),
              ],
              { alignment: AlignmentType.CENTER },
            ),
          ],
        }),
      },
      children: [...cover, ...template1, ...template2],
    },
  ],
});

const outFile = path.join(
  'c:/Users/IT DEPT. 02/Documents',
  'Federal-Pioneer-Helpdesk-Policy-Viber-Announcement-Templates.docx',
);

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outFile, buffer);
console.log(`Viber templates created: ${outFile}`);

const txtFile = path.join(
  'c:/Users/IT DEPT. 02/Documents',
  'Federal-Pioneer-Helpdesk-Viber-Message.txt',
);
fs.writeFileSync(txtFile, viberMainLines.join('\n'), 'utf8');
console.log(`Plain text copy: ${txtFile}`);

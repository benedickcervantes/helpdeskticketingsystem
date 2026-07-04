/**
 * Generates corporate email templates for HR and CEO — Helpdesk Policy rollout.
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
const ADDRESS =
  '4 Pioneer Pioneer St, Cor Sheridan, Brgy, Mandaluyong City, 1550 Metro Manila';
const SYSTEM = 'FCDC IT Helpdesk Ticketing System';
const POLICY_FILE =
  'Federal-Pioneer-Helpdesk-Ticketing-System-Policy-and-Standards-Manual-v1.1.docx';

const NAVY = '1B365D';
const GOLD = 'C5A028';
const LIGHT_BG = 'F4F6F8';
const GRAY = '4A5568';
const WHITE = 'FFFFFF';

const font = (text, opts = {}) =>
  new TextRun({
    text,
    font: 'Calibri',
    size: opts.size ?? 22,
    bold: opts.bold ?? false,
    italics: opts.italics ?? false,
    color: opts.color ?? '000000',
    underline: opts.underline ? {} : undefined,
  });

const para = (children, opts = {}) =>
  new Paragraph({
    spacing: { after: opts.after ?? 160, before: opts.before ?? 0 },
    alignment: opts.alignment,
    children: Array.isArray(children) ? children : [children],
  });

const heading = (text) =>
  para([font(text, { size: 30, bold: true, color: NAVY })], { before: 400, after: 240 });

const body = (text) => para([font(text, { size: 22 })]);

const blank = () => para([font('', { size: 22 })], { after: 80 });

const fieldRow = (label, value) =>
  para([
    font(`${label}: `, { size: 22, bold: true, color: NAVY }),
    font(value, { size: 22 }),
  ], { after: 100 });

const bullet = (text) => para([font(`• ${text}`, { size: 22 })]);

const divider = () =>
  new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD } },
    spacing: { after: 200, before: 200 },
    children: [],
  });

const signatureBlock = (name = '[Your Full Name]', title = 'IT Consultant | IT Department') => [
  blank(),
  body('Sincerely,'),
  blank(),
  body(name),
  body(title),
  body(COMPANY),
  body(ADDRESS),
  body('Mobile: +63 [Your Number]'),
  body('Email: [your.name]@fpdc.com'),
  blank(),
  para(
    [
      font('CONFIDENTIALITY NOTICE:', { size: 18, bold: true, color: GRAY }),
      font(
        '\nThis email may contain confidential information intended only for the recipient. If you received this message in error, please notify the sender and delete it immediately.',
        { size: 18, color: GRAY, italics: true },
      ),
    ],
    { after: 300 },
  ),
];

const emailHeader = ({ from, to, cc, subject }) => [
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [
              fieldRow('FROM', from),
              fieldRow('TO', to),
              ...(cc ? [fieldRow('CC', cc)] : []),
              fieldRow('SUBJECT', subject),
            ].flatMap((p) => (p.children ? [p] : [p])),
          }),
        ],
      }),
    ],
  }),
  blank(),
];

// Flatten emailHeader - the table cell needs paragraph children properly
const emailMetaTable = ({ from, to, cc, subject }) => [
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [
              para([font('FROM: ', { bold: true, color: NAVY }), font(from, { size: 22 })]),
              para([font('TO: ', { bold: true, color: NAVY }), font(to, { size: 22 })]),
              ...(cc
                ? [para([font('CC: ', { bold: true, color: NAVY }), font(cc, { size: 22 })])]
                : []),
              para([font('SUBJECT: ', { bold: true, color: NAVY }), font(subject, { size: 22 })]),
            ],
          }),
        ],
      }),
    ],
  }),
  blank(),
];

const cover = [
  para([font(COMPANY, { size: 28, bold: true, color: NAVY })], { alignment: AlignmentType.CENTER }),
  para([font(ADDRESS, { size: 20, color: GRAY })], { alignment: AlignmentType.CENTER, after: 400 }),
  para([font('Corporate Email Templates', { size: 44, bold: true, color: NAVY })], {
    alignment: AlignmentType.CENTER,
    after: 120,
  }),
  para(
    [font('Helpdesk Ticketing System — Policy Submission to HR and CEO', { size: 24, color: GRAY })],
    { alignment: AlignmentType.CENTER, after: 400 },
  ),
  body('This document contains ready-to-send email templates for requesting management approval and coordinating HR implementation of the Helpdesk Ticketing System Policy and Standards Manual.'),
  blank(),
  heading('Templates Included'),
  bullet('Template 1 — Email to CEO (Policy Review and Approval)'),
  bullet('Template 2 — Email to HR (Implementation and Employee Acknowledgment)'),
  bullet('Template 3 — Combined Email to CEO and HR (CC Both)'),
  new Paragraph({ children: [new TextRun({ break: 1, pageBreakBefore: true })] }),
];

// ─── Template 1: CEO ───────────────────────────────────────────────────────────
const template1 = [
  heading('Template 1 — Email to CEO'),
  body('Use this template to request executive review and formal approval of the Helpdesk Policy.'),
  divider(),
  ...emailMetaTable({
    from: '[your.name]@fpdc.com',
    to: '[ceo.name]@fpdc.com',
    subject: `For Review and Approval — ${SYSTEM} Policy and Standards Manual`,
  }),
  body('Dear [CEO Name],'),
  blank(),
  body('Good day.'),
  blank(),
  body(
    `I hope this message finds you well. I am writing to formally submit the ${SYSTEM} Policy and Standards Manual (Version 1.1) for your review and approval.`,
  ),
  blank(),
  body(
    'A corresponding announcement will also be posted in the company Viber group so that all employees are informed — including those who may not be on this email thread. The Viber post will reference this official email for full details and attachments.',
  ),
  blank(),
  body(
    'As part of our IT governance and service standardization initiative, the IT Department has prepared a comprehensive policy manual that defines how employees, IT administrators, and management will use the helpdesk system for all official IT support requests.',
  ),
  blank(),
  body('Key highlights of the policy include:'),
  bullet('Mandatory use of the helpdesk system for all official IT support requests'),
  bullet('Defined roles and responsibilities for Users, Managers, and IT Administrators'),
  bullet('Ticket categories, priority guidelines, and realistic response time standards'),
  bullet('Security, confidentiality, and data privacy requirements'),
  bullet('Employee acknowledgment and HR onboarding requirements'),
  blank(),
  body('Attached for your reference:'),
  bullet(`${POLICY_FILE}`),
  blank(),
  body('We respectfully request your approval to:'),
  bullet('Officially adopt the Helpdesk Ticketing System Policy and Standards Manual'),
  bullet('Authorize IT and HR to proceed with employee orientation and rollout'),
  bullet('Include the policy in the employee handbook and onboarding process'),
  blank(),
  body(
    'Should you have any questions or require a briefing before signing off, I am available at your convenience. Thank you for your time and support.',
  ),
  ...signatureBlock('[Your Full Name]', 'IT Consultant | IT Department'),
  new Paragraph({ children: [new TextRun({ break: 1, pageBreakBefore: true })] }),
];

// ─── Template 2: HR ──────────────────────────────────────────────────────────
const template2 = [
  heading('Template 2 — Email to HR'),
  body('Use this template to coordinate policy implementation, acknowledgment forms, and onboarding updates with HR.'),
  divider(),
  ...emailMetaTable({
    from: '[your.name]@fpdc.com',
    to: 'hr@fpdc.com',
    cc: '[ceo.name]@fpdc.com',
    subject: `Coordination Request — Helpdesk System Policy Implementation and Employee Acknowledgment`,
  }),
  body('Dear [HR Manager Name],'),
  blank(),
  body('Good day.'),
  blank(),
  body(
    `I am reaching out to coordinate the implementation of the ${SYSTEM} Policy and Standards Manual across all departments.`,
  ),
  blank(),
  body(
    'Please note: A summary announcement has also been posted in the company Viber group, with a reference to this official email thread. This ensures employees who are not on this email still know the policy is formally submitted and pending approval.',
  ),
  blank(),
  body(
    'Following management approval, we need HR support to integrate this policy into our employee onboarding process and to collect signed acknowledgment forms from all employees.',
  ),
  blank(),
  body('We kindly request HR assistance with the following:'),
  bullet('Include the Helpdesk Policy in the employee handbook and new hire orientation materials'),
  bullet('Distribute the Employee Acknowledgment Form (Appendix A of the policy manual) to all staff'),
  bullet('Collect and file signed acknowledgment forms per department'),
  bullet('Notify IT when new employees are onboarded so we can provision helpdesk accounts'),
  bullet('Notify IT in advance for employee separations so accounts can be deactivated on time'),
  bullet('Coordinate rollout communication to all departments'),
  blank(),
  body('Implementation timeline (proposed):'),
  bullet('Week 1 — Management approval and HR material preparation'),
  bullet('Week 2 — Employee orientation and acknowledgment form distribution'),
  bullet('Week 3 — Official cutover: all IT requests via helpdesk system only'),
  blank(),
  body('Support hours under the approved policy:'),
  bullet('Monday – Friday: 5:50 PM – 9:00 PM'),
  bullet('Saturday: 8:00 AM – 5:00 PM'),
  bullet('Sunday: 8:00 AM – 1:00 PM'),
  blank(),
  body('Attached documents:'),
  bullet(`${POLICY_FILE}`),
  bullet('Employee Acknowledgment Form (Appendix A — from policy manual)'),
  bullet('Pre-Implementation Checklist (Appendix B — from policy manual)'),
  blank(),
  body(
    'Please let us know a convenient time for a brief coordination meeting. We are happy to walk through the policy and answer any HR-related questions.',
  ),
  blank(),
  body('Thank you for your partnership on this initiative.'),
  ...signatureBlock('[Your Full Name]', 'IT Consultant | IT Department'),
  new Paragraph({ children: [new TextRun({ break: 1, pageBreakBefore: true })] }),
];

// ─── Template 3: Combined ────────────────────────────────────────────────────
const template3 = [
  heading('Template 3 — Combined Email to CEO and HR'),
  body('Use this single email when sending to both CEO and HR at the same time.'),
  divider(),
  ...emailMetaTable({
    from: '[your.name]@fpdc.com',
    to: '[ceo.name]@fpdc.com',
    cc: 'hr@fpdc.com',
    subject: `For Review, Approval, and Implementation — ${SYSTEM} Policy and Standards Manual`,
  }),
  body('Dear [CEO Name] and [HR Manager Name],'),
  blank(),
  body('Good day.'),
  blank(),
  body(
    `I am pleased to submit the ${SYSTEM} Policy and Standards Manual (Version 1.1) for your review. This document establishes the official standards for how all employees and IT personnel will request, manage, and resolve IT support issues through our centralized helpdesk platform.`,
  ),
  blank(),
  body(
    'For wider visibility, a summary of this submission will also be posted in the company Viber group. The Viber announcement will direct employees to this email thread for the official policy document and attachments. This way, staff who are not copied on this email are still informed that the policy is formally under review.',
  ),
  blank(),
  body('Purpose of this email:'),
  bullet('Request executive approval from Management (CEO)'),
  bullet('Request HR coordination for onboarding integration and employee acknowledgment'),
  bullet('Align both departments on the proposed rollout timeline'),
  blank(),
  body('Summary of the policy:'),
  bullet('All official IT support requests must go through the helpdesk system'),
  bullet('Clear guidelines for end users, IT administrators, and managers'),
  bullet('Response time standards aligned with our consultant-based IT capacity'),
  bullet('Security, data privacy, and acceptable use requirements'),
  bullet('Employee acknowledgment required before full system onboarding'),
  blank(),
  body('Proposed response time standards:'),
  bullet('Critical — within 1 business day'),
  bullet('High — within 2 business days'),
  bullet('Medium — within 3 business days'),
  bullet('Low — within 5 business days'),
  blank(),
  body('IT support hours:'),
  bullet('Monday – Friday: 5:50 PM – 9:00 PM | Saturday: 8:00 AM – 5:00 PM | Sunday: 8:00 AM – 1:00 PM'),
  blank(),
  body('Requested actions:'),
  para([font('From CEO / Management:', { size: 22, bold: true, color: NAVY })]),
  bullet('Review and approve the attached policy manual'),
  bullet('Authorize official rollout to all departments'),
  para([font('From HR:', { size: 22, bold: true, color: NAVY })], { before: 160 }),
  bullet('Update onboarding materials and employee handbook'),
  bullet('Distribute and collect Employee Acknowledgment Forms'),
  bullet('Coordinate account provisioning and offboarding notifications with IT'),
  blank(),
  body('Attachment:'),
  bullet(`${POLICY_FILE}`),
  blank(),
  body(
    'We are available for a joint briefing at your earliest convenience. Thank you for your guidance and support in strengthening our IT service standards.',
  ),
  ...signatureBlock('[Your Full Name]', 'IT Consultant | IT Department'),
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
            para([font(`${COMPANY} — Email Templates`, { size: 16, color: GRAY, italics: true })], {
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
      children: [...cover, ...template1, ...template2, ...template3],
    },
  ],
});

const outFile = path.join(
  'c:/Users/IT DEPT. 02/Documents',
  'Federal-Pioneer-Helpdesk-Policy-Email-Templates-HR-CEO-v2.docx',
);

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outFile, buffer);
console.log(`Email templates created: ${outFile}`);

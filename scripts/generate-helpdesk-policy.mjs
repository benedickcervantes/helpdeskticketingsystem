/**
 * Generates FPDC Helpdesk Ticketing System Policy & Standards Manual (.docx)
 * Design aligned with Federal Pioneer Corporate Email Policy template.
 */
import fs from 'fs';
import path from 'path';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
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
const SYSTEM = 'FPDC IT Helpdesk Ticketing System';
const EFFECTIVE_DATE = 'June 23, 2025';
const REVIEW_DATE = 'June 23, 2026';

const NAVY = '1B365D';
const GOLD = 'C5A028';
const LIGHT_BG = 'F4F6F8';
const WHITE = 'FFFFFF';
const GRAY = '4A5568';

const font = (text, opts = {}) =>
  new TextRun({
    text,
    font: 'Calibri',
    size: opts.size ?? 22,
    bold: opts.bold ?? false,
    italics: opts.italics ?? false,
    color: opts.color ?? '000000',
    ...opts,
  });

const para = (children, opts = {}) =>
  new Paragraph({
    spacing: { after: opts.after ?? 160, before: opts.before ?? 0 },
    alignment: opts.alignment,
    children: Array.isArray(children) ? children : [children],
  });

const heading1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [
      font(text, { size: 32, bold: true, color: NAVY }),
    ],
  });

const heading2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [
      font(text, { size: 26, bold: true, color: NAVY }),
    ],
  });

const bullet = (text) =>
  para([font(`• ${text}`, { size: 22 })]);

const body = (text) => para([font(text, { size: 22 })]);

const cell = (text, opts = {}) =>
  new TableCell({
    shading: opts.shading
      ? { fill: opts.shading, type: ShadingType.CLEAR }
      : undefined,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          font(text, {
            size: opts.size ?? 20,
            bold: opts.bold ?? false,
            color: opts.color,
          }),
        ],
      }),
    ],
  });

const tableRow = (cells) => new TableRow({ children: cells });

const metaTable = () =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableRow([cell('Document Version', { shading: LIGHT_BG, bold: true, width: 35 }), cell('1.1', { width: 65 })]),
      tableRow([cell('Effective Date', { shading: LIGHT_BG, bold: true }), cell(EFFECTIVE_DATE)]),
      tableRow([cell('Review Date', { shading: LIGHT_BG, bold: true }), cell(REVIEW_DATE)]),
      tableRow([cell('Prepared By', { shading: LIGHT_BG, bold: true }), cell('IT Department')]),
      tableRow([cell('Approved By', { shading: LIGHT_BG, bold: true }), cell('[Management / HR / IT Head]')]),
      tableRow([cell('Classification', { shading: LIGHT_BG, bold: true }), cell('Internal Use')]),
    ],
  });

const definitionsTable = () =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableRow([
        cell('Term', { shading: NAVY, bold: true, color: WHITE, width: 30 }),
        cell('Definition', { shading: NAVY, bold: true, color: WHITE, width: 70 }),
      ]),
      tableRow([cell('Helpdesk Ticket', { bold: true }), cell('A formal record of an IT support request submitted through the FPDC Helpdesk Ticketing System.')]),
      tableRow([cell('End User', { bold: true }), cell('An employee or authorized personnel with a standard USER role who submits and tracks support tickets.')]),
      tableRow([cell('IT Administrator', { bold: true }), cell('Authorized IT personnel with ADMIN role responsible for system configuration, user management, and ticket resolution oversight.')]),
      tableRow([cell('IT Manager', { bold: true }), cell('Authorized personnel with MANAGER role who monitors performance metrics, reports, and service quality.')]),
      tableRow([cell('Ticket Priority', { bold: true }), cell('Classification of urgency: Low, Medium, High, or Critical.')]),
      tableRow([cell('Ticket Category', { bold: true }), cell('Type of issue: Hardware, Software, Network, Email, Security, or Other.')]),
      tableRow([cell('Confidential Information', { bold: true }), cell('Client records, credentials, financial data, internal reports, and any data protected under company policy or law.')]),
    ],
  });

const slaTable = () =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableRow([
        cell('Priority Level', { shading: NAVY, bold: true, color: WHITE, width: 35 }),
        cell('Description', { shading: NAVY, bold: true, color: WHITE, width: 35 }),
        cell('Target Response Time', { shading: NAVY, bold: true, color: WHITE, width: 30 }),
      ]),
      tableRow([cell('Critical', { bold: true }), cell('System-wide outage, security breach, or business-stopping failure'), cell('Within 1 business day')]),
      tableRow([cell('High', { bold: true }), cell('Major function impaired; multiple users affected'), cell('Within 2 business days')]),
      tableRow([cell('Medium', { bold: true }), cell('Single-user issue with workaround available'), cell('Within 3 business days')]),
      tableRow([cell('Low', { bold: true }), cell('Minor issue, enhancement request, or general inquiry'), cell('Within 5 business days')]),
    ],
  });

const roleTable = () =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableRow([
        cell('Role', { shading: NAVY, bold: true, color: WHITE, width: 20 }),
        cell('Access Level', { shading: NAVY, bold: true, color: WHITE, width: 40 }),
        cell('Key Responsibilities', { shading: NAVY, bold: true, color: WHITE, width: 40 }),
      ]),
      tableRow([
        cell('User', { bold: true }),
        cell('User Dashboard, own tickets, feedback submission'),
        cell('Submit tickets, provide accurate details, respond to IT follow-ups, submit feedback after resolution'),
      ]),
      tableRow([
        cell('Manager', { bold: true }),
        cell('Management Dashboard, analytics and reports'),
        cell('Monitor service performance, review feedback trends, support escalation decisions'),
      ]),
      tableRow([
        cell('Admin', { bold: true }),
        cell('Admin Dashboard, all tickets, user management, feedback analytics'),
        cell('Assign tickets, update status, manage accounts, enforce policy, generate reports'),
      ]),
    ],
  });

const coverPage = [
  para([font(COMPANY, { size: 28, bold: true, color: NAVY })], { alignment: AlignmentType.CENTER, after: 80 }),
  para([font(ADDRESS, { size: 20, color: GRAY })], { alignment: AlignmentType.CENTER, after: 600 }),
  para([font('Helpdesk Ticketing System', { size: 52, bold: true, color: NAVY })], { alignment: AlignmentType.CENTER, after: 80 }),
  para([font('Policy and Standards Manual', { size: 44, bold: true, color: NAVY })], { alignment: AlignmentType.CENTER, after: 200 }),
  para(
    [font('Guidelines for end users, IT administrators, and management on professional use, security, and service standards', { size: 22, italics: true, color: GRAY })],
    { alignment: AlignmentType.CENTER, after: 500 },
  ),
  metaTable(),
  para([font('For Employee, IT, and Management Implementation', { size: 22, bold: true, color: NAVY })], {
    alignment: AlignmentType.CENTER,
    before: 400,
  }),
  new Paragraph({ children: [new TextRun({ break: 1, pageBreakBefore: true })] }),
];

const toc = [
  heading1('Table of Contents'),
  ...[
    '1. Purpose',
    '2. Scope',
    '3. Definitions',
    '4. Policy Statement',
    '5. Roles and Responsibilities',
    '6. System Access and Account Management',
    '7. User Standards — Submitting Tickets',
    '8. Ticket Categories and Priority Guidelines',
    '9. Attachments and Evidence Standards',
    '10. Ticket Lifecycle and Status Management',
    '11. Communication and Notification Standards',
    '12. Admin Standards — Ticket Management',
    '13. Admin Standards — User Management',
    '14. Feedback and Service Quality',
    '15. Security Requirements',
    '16. Confidentiality and Data Privacy',
    '17. Acceptable and Prohibited Use',
    '18. Business Hours and Emergency Support',
    '19. Data Retention and Record Keeping',
    '20. Employee Turnover and Offboarding',
    '21. Monitoring, Compliance, and Disciplinary Action',
    '22. Training and Acknowledgment',
    '23. Ticket Submission Examples',
    'Appendix A — Employee Acknowledgment Form',
    'Appendix B — Pre-Implementation Checklist',
    'Appendix C — Version History',
  ].map((item) => para([font(item, { size: 22 })])),
  new Paragraph({ children: [new TextRun({ break: 1, pageBreakBefore: true })] }),
];

const sections = [
  heading1('1. Purpose'),
  body(
    `This manual establishes the official standards and policies for the use of the ${SYSTEM} within ${COMPANY}. It ensures that employees, IT administrators, and management follow one consistent standard for requesting, managing, and resolving IT support issues.`,
  ),
  body('The objectives of this policy are to:'),
  bullet('Provide a single, auditable channel for all IT support requests'),
  bullet('Establish clear responsibilities for end users, IT administrators, and managers'),
  bullet('Protect company, client, and employee information submitted through the system'),
  bullet('Improve coordination between departments and the IT Department'),
  bullet('Ensure consistent response times based on ticket priority'),
  bullet('Reduce business risk related to unauthorized access, data loss, and unrecorded support activities'),

  heading1('2. Scope'),
  body('This policy applies to:'),
  bullet('All full-time, part-time, probationary, and contractual employees'),
  bullet('Interns and trainees issued a helpdesk system account'),
  bullet('Authorized consultants or agents granted temporary system access'),
  bullet('All devices and platforms used to access the helpdesk system'),
  body('This policy covers:'),
  bullet('User accounts and role assignments (User, Manager, Admin)'),
  bullet('Ticket creation, assignment, resolution, and closure'),
  bullet('Attachments, notifications, and feedback'),
  bullet('System security, data privacy, and compliance requirements'),

  heading1('3. Definitions'),
  definitionsTable(),

  heading1('4. Policy Statement'),
  heading2('Official Policy'),
  body(
    `${COMPANY} requires all official IT support requests to be submitted through the ${SYSTEM}, except where a written exception is approved by Management and IT.`,
  ),
  body(
    'The helpdesk system is a company asset. The company reserves the right to monitor, audit, retain, and retrieve ticket records in accordance with this policy, applicable laws, and legitimate business needs.',
  ),
  body(
    'Support requests made through informal channels (personal messaging, verbal-only requests without ticket records) may not be prioritized and do not constitute an official support record.',
  ),

  heading1('5. Roles and Responsibilities'),
  roleTable(),
  heading2('Management'),
  bullet('Approve and enforce this policy'),
  bullet('Ensure departments comply with helpdesk standards'),
  bullet('Authorize exceptions, if any'),
  heading2('Human Resources (HR)'),
  bullet('Include this policy in onboarding and the employee handbook'),
  bullet('Collect signed Employee Acknowledgment Forms'),
  bullet('Coordinate with IT during onboarding, transfer, and offboarding'),
  heading2('Information Technology (IT)'),
  bullet('Provision, configure, secure, and deactivate user accounts'),
  bullet('Assign, resolve, and close tickets in a timely manner'),
  bullet('Maintain system availability, security controls, and backups'),
  bullet('Provide training and technical support for system users'),
  heading2('Department Heads / Supervisors'),
  bullet('Ensure team members use the helpdesk system for IT support'),
  bullet('Support escalation of unresolved or high-priority tickets'),
  bullet('Ensure proper turnover of pending IT issues during employee exit'),
  heading2('Employees (End Users)'),
  bullet('Submit tickets for all legitimate IT support needs'),
  bullet('Provide accurate and complete ticket information'),
  bullet('Protect login credentials and company information'),
  bullet('Respond promptly to IT follow-up requests'),
  bullet('Submit feedback after ticket resolution'),

  heading1('6. System Access and Account Management'),
  heading2('6.1 Account Provisioning'),
  body('Helpdesk accounts are created by IT Administrators only upon HR request or Management approval.'),
  body('Each account is assigned one of three roles: User, Manager, or Admin.'),
  heading2('6.2 Account Requirements'),
  body('New users must complete orientation, sign the acknowledgment form, and set a strong password before first use.'),
  body('Users must keep their profile information (name, department, phone) accurate and up to date.'),
  heading2('6.3 Account Suspension and Deactivation'),
  body('Accounts must be suspended or deactivated upon resignation, termination, security incident, or role change.'),
  body('HR must notify IT in advance for planned exits and immediately for urgent cases.'),
  body('Inactive accounts may be deactivated after 90 days of no login activity, subject to Management approval.'),

  heading1('7. User Standards — Submitting Tickets'),
  heading2('7.1 When to Submit a Ticket'),
  body('Employees must submit a ticket for hardware issues, software problems, network connectivity, email issues, security concerns, and other IT-related requests.'),
  heading2('7.2 Ticket Content Standards'),
  body('Every ticket must include:'),
  bullet('A clear, specific title summarizing the issue'),
  bullet('A detailed description including error messages, steps to reproduce, and business impact'),
  bullet('The correct category and priority level'),
  bullet('Department and contact information if not auto-populated'),
  heading2('7.3 Professional Communication'),
  body('All ticket descriptions and follow-up messages must maintain a professional tone with proper grammar and respectful language.'),
  heading2('7.4 One Issue Per Ticket'),
  body('Submit separate tickets for unrelated issues to ensure proper tracking, assignment, and resolution.'),
  heading2('7.5 Accuracy and Accountability'),
  body('Users are accountable for the content they submit. False, misleading, or duplicate tickets may result in disciplinary action.'),

  heading1('8. Ticket Categories and Priority Guidelines'),
  heading2('8.1 Categories'),
  body('Users must select the most appropriate category:'),
  bullet('Hardware — computers, printers, peripherals, and physical equipment'),
  bullet('Software — applications, licenses, installation, and updates'),
  bullet('Network — internet, VPN, Wi-Fi, and connectivity issues'),
  bullet('Email — corporate email access, configuration, and delivery issues'),
  bullet('Security — suspected breaches, phishing, malware, and access concerns'),
  bullet('Other — requests that do not fit the above categories'),
  heading2('8.2 Priority Selection'),
  body('Users must assign priority based on actual business impact:'),
  bullet('Critical — organization-wide outage or security emergency'),
  bullet('High — significant impairment with no workaround'),
  bullet('Medium — issue affects work but a workaround exists'),
  bullet('Low — minor inconvenience or enhancement request'),
  body('IT Administrators may adjust priority if the assigned level does not reflect actual impact.'),
  heading2('8.3 Response Time Standards'),
  body(
    'IT support is provided by a consultant-based team with limited staffing. Response times below reflect realistic targets for initial acknowledgment and triage — not guaranteed same-day resolution for all issues.',
  ),
  slaTable(),
  body(
    'Critical and High priority tickets receive priority handling during business hours but are not guaranteed same-day response. Tickets submitted outside business hours are queued for the next available support window.',
  ),
  body('If a complete resolution is not yet available, IT must update the ticket status and provide an acknowledgment of progress.'),

  heading1('9. Attachments and Evidence Standards'),
  heading2('9.1 Allowed Attachments'),
  body('Users may attach up to 3 image files per ticket (JPEG, PNG, WEBP, or GIF) to support troubleshooting.'),
  heading2('9.2 Attachment Guidelines'),
  bullet('Attach screenshots of error messages when applicable'),
  bullet('Do not attach files containing passwords, full credit card numbers, or unrelated personal data'),
  bullet('Ensure images are clear and relevant to the reported issue'),
  bullet('Only the ticket creator may upload attachments'),
  heading2('9.3 Prohibited Content'),
  body('Attachments must not contain confidential client data unless required for resolution and authorized by policy.'),

  heading1('10. Ticket Lifecycle and Status Management'),
  heading2('10.1 Ticket Statuses'),
  bullet('Open — ticket submitted and awaiting IT action'),
  bullet('In Progress — IT is actively working on the issue'),
  bullet('Resolved — issue has been fixed; awaiting user confirmation or feedback'),
  bullet('Closed — ticket completed and archived'),
  heading2('10.2 User Responsibilities During Lifecycle'),
  bullet('Monitor ticket status and notifications'),
  bullet('Respond to IT requests for additional information within 1 business day'),
  bullet('Confirm resolution or report if the issue persists'),
  bullet('Submit feedback after resolution'),
  heading2('10.3 Reopening Issues'),
  body('If a resolved issue recurs within 5 business days, add a follow-up comment or submit a new ticket referencing the original ticket number.'),

  heading1('11. Communication and Notification Standards'),
  body('The system sends email and in-app notifications for ticket creation, assignment, status changes, and resolution.'),
  bullet('Users must monitor notifications during business hours'),
  bullet('Critical and High priority tickets require prompt user response when IT requests information'),
  bullet('Do not disable or ignore system notifications for active tickets'),
  body('Official ticket records within the system take precedence over informal communication channels.'),

  heading1('12. Admin Standards — Ticket Management'),
  heading2('12.1 Ticket Assignment'),
  body('IT Administrators must assign tickets to qualified personnel based on category, priority, and workload.'),
  heading2('12.2 Status Updates'),
  body('Admins must update ticket status at each stage of resolution. Tickets must not remain in Open status without action beyond the SLA for their priority.'),
  heading2('12.3 Resolution Standards'),
  bullet('Document the resolution steps in the ticket record'),
  bullet('Verify the issue is resolved before marking as Resolved'),
  bullet('Escalate Critical and High priority tickets that cannot be resolved within SLA'),
  heading2('12.4 Access Restrictions'),
  body('Admins may view all tickets. Users may only view tickets they created. Managers may access analytics and reports as authorized.'),
  heading2('12.5 Prohibited Admin Actions'),
  bullet('Sharing admin credentials or impersonating another user'),
  bullet('Closing tickets without genuine resolution'),
  bullet('Deleting or altering ticket records to conceal errors'),
  bullet('Accessing tickets for personal or unauthorized purposes'),

  heading1('13. Admin Standards — User Management'),
  body('Only IT Administrators with ADMIN role may create, update, or deactivate user accounts.'),
  bullet('Assign the minimum role necessary (User, Manager, or Admin)'),
  bullet('Verify identity before creating or modifying accounts'),
  bullet('Deactivate accounts immediately upon separation or security incident'),
  bullet('Maintain an audit trail of account changes'),
  body('Managers may view user lists and reports but may not create or delete accounts unless explicitly authorized.'),

  heading1('14. Feedback and Service Quality'),
  body('After ticket resolution, users are encouraged to submit feedback including a rating and suggestions.'),
  bullet('Feedback is used to improve IT service quality'),
  bullet('Feedback must be honest, professional, and constructive'),
  bullet('IT Management reviews feedback analytics regularly'),
  bullet('Retaliatory or abusive feedback is prohibited'),

  heading1('15. Security Requirements'),
  bullet('Use strong, unique passwords and never share credentials with anyone, including IT staff'),
  bullet('Log out from shared or public computers after each session'),
  bullet('Lock devices when unattended'),
  bullet('Report suspected unauthorized access or phishing immediately via a Security category ticket'),
  bullet('Do not attempt to bypass system security controls'),
  bullet('Multi-factor authentication must be enabled when required by IT'),
  body('Session activity may be logged for security and audit purposes.'),

  heading1('16. Confidentiality and Data Privacy'),
  body('Employees must protect information submitted through and accessible via the helpdesk system.'),
  bullet('Do not include unnecessary personal or client data in ticket descriptions'),
  bullet('Access ticket data only as authorized by role'),
  bullet('Comply with the Data Privacy Act of 2012 (Philippines), where applicable'),
  bullet('Report data breaches immediately through a Security priority ticket'),
  body('Ticket records may contain sensitive information and must be handled with the same care as other company records.'),

  heading1('17. Acceptable and Prohibited Use'),
  heading2('Acceptable Use'),
  bullet('Reporting legitimate IT issues and service requests'),
  bullet('Requesting software installation, access, or hardware support'),
  bullet('Coordinating with IT for system maintenance and updates'),
  bullet('Submitting feedback on resolved tickets'),
  heading2('Prohibited Use'),
  bullet('Submitting false, duplicate, or malicious tickets'),
  bullet('Harassment, discrimination, or abusive language in tickets'),
  bullet('Using the system for non-business purposes'),
  bullet('Attempting unauthorized access to admin functions or other users\' tickets'),
  bullet('Automated or bulk ticket submission without IT approval'),
  bullet('Sharing screenshots or ticket data containing confidential information externally'),

  heading1('18. Business Hours and Emergency Support'),
  body('Standard IT consultant support is available during the following hours:'),
  bullet('Monday – Friday: 5:50 PM – 9:00 PM'),
  bullet('Saturday: 8:00 AM – 5:00 PM'),
  bullet('Sunday: 8:00 AM – 1:00 PM'),
  body(
    'Tickets submitted outside these hours will be queued and processed during the next available business window. Critical and High priority tickets are prioritized within the response time standards in Section 8.3 but are not handled outside the hours listed above unless a separate emergency arrangement is approved by Management.',
  ),
  body(
    'For urgent security incidents (e.g., suspected breach or data leak), users must still submit a Critical priority ticket immediately and notify their supervisor. IT will address the ticket at the start of the next support window or as soon as a consultant is available.',
  ),

  heading1('19. Data Retention and Record Keeping'),
  body('Ticket records may be stored, archived, and retrieved for business, legal, audit, and security purposes.'),
  bullet('Support tickets: retained for 7 years for audit purposes'),
  bullet('User accounts: active while employed; archived after departure'),
  bullet('System logs: retained for 1 year for troubleshooting'),
  body('Users must not request deletion of tickets related to pending issues, security incidents, or legal matters without Management approval.'),

  heading1('20. Employee Turnover and Offboarding'),
  bullet('Turn over pending IT issues and active tickets to the supervisor or replacement'),
  bullet('Confirm no personal recovery information remains linked to company accounts'),
  bullet('Return company devices and confirm access revocation with IT'),
  body('IT will deactivate helpdesk access on the employee\'s last working day unless Management approves a limited extension.'),

  heading1('21. Monitoring, Compliance, and Disciplinary Action'),
  body('The company may monitor helpdesk system usage to protect systems and data, investigate security incidents, ensure policy compliance, and support audit and legal requirements.'),
  body('Violations may result in:'),
  bullet('Verbal or written warning'),
  bullet('Temporary suspension of system access'),
  bullet('Disciplinary action up to termination'),
  bullet('Legal action if applicable'),
  body('Examples of violations include:'),
  bullet('Unauthorized access to admin functions or other users\' tickets'),
  bullet('Submitting false or malicious tickets'),
  bullet('Sharing credentials or confidential ticket data'),
  bullet('Harassment or unprofessional communication'),

  heading1('22. Training and Acknowledgment'),
  bullet('Employees must attend orientation on helpdesk system use and security practices'),
  bullet('Employees must sign the Employee Acknowledgment Form (Appendix A)'),
  bullet('IT Administrators must complete additional training on admin functions and data handling'),
  bullet('HR will maintain records of signed acknowledgments'),
  body('No employee should be considered fully onboarded to the helpdesk system until orientation and acknowledgment are completed.'),

  heading1('23. Ticket Submission Examples'),
  heading2('23.1 Hardware Issue'),
  body('Title: Laptop Not Powering On — Sales Department'),
  body('Category: Hardware | Priority: High'),
  body('Description: My Dell laptop (Asset Tag: FPC-LT-0042) does not power on after this morning\'s update. I have a client presentation at 2:00 PM. Tried different power outlets and charger. No lights on keyboard.'),
  heading2('23.2 Software Issue'),
  body('Title: Unable to Access Microsoft Teams'),
  body('Category: Software | Priority: Medium'),
  body('Description: Teams shows "We couldn\'t sign you in" error since 9:00 AM. Restarted laptop twice. Other Office apps work. Screenshot attached.'),
  heading2('23.3 Security Concern'),
  body('Title: Suspicious Email — Possible Phishing'),
  body('Category: Security | Priority: Critical'),
  body('Description: Received email claiming to be from IT requesting password reset. Sender address does not match company domain. Screenshot attached. Did not click any links.'),

  new Paragraph({ children: [new TextRun({ break: 1, pageBreakBefore: true })] }),
  heading1('Appendix A — Employee Acknowledgment Form'),
  body(
    `I, ________________________________, employee ID ____________________, acknowledge that I have received, read, and understood the Helpdesk Ticketing System Policy and Standards Manual of ${COMPANY}.`,
  ),
  body('I agree to:'),
  bullet('Use the helpdesk system for all official IT support requests'),
  bullet('Comply with security, confidentiality, and professional standards'),
  bullet('Protect my account credentials and company information'),
  bullet('Follow turnover and offboarding requirements upon separation'),
  body('I understand that violation of this policy may result in disciplinary action.'),
  new Table({
    width: { size: 80, type: WidthType.PERCENTAGE },
    rows: [
      tableRow([cell('Field', { shading: LIGHT_BG, bold: true, width: 35 }), cell('Details', { shading: LIGHT_BG, bold: true, width: 65 })]),
      tableRow([cell('Employee Name'), cell('________________________________')]),
      tableRow([cell('Signature'), cell('________________________________')]),
      tableRow([cell('Date'), cell('________________________________')]),
      tableRow([cell('Department'), cell('________________________________')]),
      tableRow([cell('Immediate Supervisor'), cell('________________________________')]),
      tableRow([cell('Role'), cell('☐ User  ☐ Manager  ☐ Admin')]),
    ],
  }),

  heading1('Appendix B — Pre-Implementation Checklist'),
  heading2('Management / HR'),
  bullet('Approve policy manual'),
  bullet('Announce official system rollout date'),
  bullet('Update employee handbook and onboarding materials'),
  bullet('Prepare acknowledgment forms'),
  heading2('IT Department'),
  bullet('Deploy and configure the helpdesk system'),
  bullet('Create user accounts per naming and role standards'),
  bullet('Configure security settings (password policy, session management)'),
  bullet('Set up email notifications and admin alerts'),
  bullet('Prepare user guide and admin procedures'),
  bullet('Establish SLA monitoring and reporting'),
  bullet('Prepare offboarding and account deactivation process'),
  heading2('Department Heads'),
  bullet('Identify employees requiring system access'),
  bullet('Communicate ticket submission standards to teams'),
  bullet('Designate escalation contacts for urgent issues'),
  heading2('Employees'),
  bullet('Attend orientation'),
  bullet('Sign acknowledgment form'),
  bullet('Complete first login and profile setup'),
  bullet('Submit a test ticket if required during orientation'),

  heading1('Appendix C — Version History'),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableRow([
        cell('Version', { shading: NAVY, bold: true, color: WHITE, width: 15 }),
        cell('Date', { shading: NAVY, bold: true, color: WHITE, width: 20 }),
        cell('Author', { shading: NAVY, bold: true, color: WHITE, width: 25 }),
        cell('Changes', { shading: NAVY, bold: true, color: WHITE, width: 40 }),
      ]),
      tableRow([cell('1.0'), cell(EFFECTIVE_DATE), cell('IT / HR'), cell('Initial release')]),
      tableRow([cell('1.1'), cell('June 23, 2026'), cell('IT / HR'), cell('Revised response time standards and business hours for consultant-based IT support')]),
    ],
  }),
  para([font('For questions about this policy, contact:', { size: 22, bold: true })], { before: 400 }),
  bullet('IT Helpdesk: support@FPDC.com | (555) 123-4567'),
  bullet('HR Department: hr@fpdc.com'),
];

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 22 },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 32, bold: true, font: 'Calibri', color: NAVY },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 26, bold: true, font: 'Calibri', color: NAVY },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                font(SYSTEM, { size: 16, color: GRAY, italics: true }),
              ],
            }),
            new Paragraph({
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD },
              },
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
              border: {
                top: { style: BorderStyle.SINGLE, size: 6, color: GOLD },
              },
              spacing: { before: 120 },
              children: [],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                font(`${COMPANY}  |  `, { size: 16, color: GRAY }),
                font('Page ', { size: 16, color: GRAY }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: 'Calibri',
                  size: 16,
                  color: GRAY,
                }),
                font(' of ', { size: 16, color: GRAY }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  font: 'Calibri',
                  size: 16,
                  color: GRAY,
                }),
              ],
            }),
          ],
        }),
      },
      children: [...coverPage, ...toc, ...sections],
    },
  ],
});

const outDir = path.resolve('c:/Users/IT DEPT. 02/Documents');
const outFile = path.join(
  outDir,
  'Federal-Pioneer-Helpdesk-Ticketing-System-Policy-and-Standards-Manual-v1.1.docx',
);

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outFile, buffer);
console.log(`Policy document created: ${outFile}`);

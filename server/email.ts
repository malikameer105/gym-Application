import nodemailer, { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || '587', 10);
  const user = process.env.BREVO_SMTP_USER || process.env.SMTP_USER;
  const pass = process.env.BREVO_SMTP_PASSWORD || process.env.SMTP_PASSWORD;
  const from = process.env.MAIL_FROM_EMAIL || process.env.SMTP_FROM || process.env.EMAIL_FROM || (user || 'noreply@titanforgegym.com');
  const fromName = process.env.MAIL_FROM_NAME || process.env.SMTP_FROM_NAME || 'TitanForge Fitness & Gym';

  if (!user || !pass) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    user,
    pass,
    from,
    fromName
  };
}

let cachedTransporter: Transporter | null = null;

export function getEmailTransporter(): Transporter | null {
  const config = getSmtpConfig();
  if (!config) {
    return null;
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return cachedTransporter;
}

export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  const config = getSmtpConfig();
  if (!config) {
    return {
      success: false,
      message: 'Brevo SMTP credentials (SMTP_USER and SMTP_PASSWORD) are not configured in environment variables.'
    };
  }

  try {
    const transporter = getEmailTransporter();
    if (!transporter) {
      return { success: false, message: 'Failed to initialize email transporter.' };
    }
    await transporter.verify();
    return {
      success: true,
      message: `Brevo SMTP connection verified successfully (Host: ${config.host}:${config.port}, User: ${config.user})`
    };
  } catch (error: any) {
    console.error('[SMTP Verification Error]:', error);
    return {
      success: false,
      message: error?.message || 'Failed to authenticate with Brevo SMTP server.'
    };
  }
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getSmtpConfig();
  if (!config) {
    console.warn(`[Email Service Notice]: Brevo SMTP not configured. Skipped sending email "${options.subject}" to ${options.to}. Set SMTP_USER and SMTP_PASSWORD to enable live delivery.`);
    return {
      success: false,
      error: 'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD.'
    };
  }

  try {
    const transporter = getEmailTransporter();
    if (!transporter) {
      return { success: false, error: 'Email transporter unavailable.' };
    }

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]+>/g, '')
    });

    console.log(`[Email Sent]: ID ${info.messageId} to ${options.to} (${options.subject})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Email Send Error] To: ${options.to}:`, error);
    return { success: false, error: error?.message || 'Failed to send email' };
  }
}

// ----------------------------------------------------------------------
// TEMPLATES
// ----------------------------------------------------------------------

function baseTemplate(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
    .body { padding: 32px 28px; line-height: 1.6; font-size: 15px; color: #334155; }
    .table-box { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
    .table-box td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .table-box td.label { font-weight: 600; color: #64748b; width: 40%; }
    .table-box td.value { font-weight: 700; color: #0f172a; }
    .highlight-badge { display: inline-block; padding: 4px 10px; background: #e0f2fe; color: #0369a1; border-radius: 6px; font-weight: 700; font-size: 13px; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>TitanForge Fitness</h1>
      <p>${title}</p>
    </div>
    <div class="body">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>TitanForge Fitness & Athletics &bull; Official Notification</p>
      <p>Powered by Production Gym Management Software</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendWelcomeMemberEmail(member: { fullName: string; email: string; memberId: string; phone: string }, planName?: string) {
  const content = `
    <h2 style="margin-top: 0; color: #0f172a;">Welcome to TitanForge, ${member.fullName}!</h2>
    <p>We are thrilled to welcome you to the gym. Your membership profile has been successfully activated.</p>
    
    <table class="table-box">
      <tr>
        <td class="label">Member ID</td>
        <td class="value"><span class="highlight-badge">${member.memberId}</span></td>
      </tr>
      <tr>
        <td class="label">Full Name</td>
        <td class="value">${member.fullName}</td>
      </tr>
      <tr>
        <td class="label">Phone</td>
        <td class="value">${member.phone}</td>
      </tr>
      ${planName ? `<tr><td class="label">Membership Plan</td><td class="value">${planName}</td></tr>` : ''}
    </table>

    <p style="margin-top: 20px;">
      <strong>Quick Gym Tips:</strong>
      <ul>
        <li>Please mention your <strong>Member ID (${member.memberId})</strong> or phone number at the front desk check-in kiosk.</li>
        <li>Clean athletic footwear and a sweat towel are required on the training floor.</li>
        <li>Speak with our trainers anytime to set up your personal goal roadmap!</li>
      </ul>
    </p>

    <p style="margin-top: 24px;">Push your limits & stay strong,<br><strong>TitanForge Coaching Staff</strong></p>
  `;

  return sendEmail({
    to: member.email,
    subject: `Welcome to TitanForge Fitness - Your Member ID: ${member.memberId}`,
    html: baseTemplate('Welcome to TitanForge Fitness', content)
  });
}

export async function sendPaymentReceiptEmail(
  member: { fullName: string; email: string; memberId: string },
  payment: { receiptNumber: string; amount: number; paymentMethod: string; remainingBalance: number; paymentDate: Date | string },
  gymSettings?: any
) {
  const currency = gymSettings?.currency || '$';
  const gymName = gymSettings?.gymName || 'TitanForge Fitness & Athletics';
  const formattedDate = new Date(payment.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const content = `
    <h2 style="margin-top: 0; color: #0f172a;">Payment Confirmation & Receipt</h2>
    <p>Dear ${member.fullName},</p>
    <p>Thank you for your payment. We have received and recorded your transaction.</p>

    <table class="table-box">
      <tr>
        <td class="label">Receipt Number</td>
        <td class="value"><span class="highlight-badge">${payment.receiptNumber}</span></td>
      </tr>
      <tr>
        <td class="label">Date</td>
        <td class="value">${formattedDate}</td>
      </tr>
      <tr>
        <td class="label">Member ID & Name</td>
        <td class="value">${member.memberId} &bull; ${member.fullName}</td>
      </tr>
      <tr>
        <td class="label">Amount Paid</td>
        <td class="value" style="color: #16a34a; font-size: 16px;">${currency}${Number(payment.amount).toFixed(2)}</td>
      </tr>
      <tr>
        <td class="label">Payment Method</td>
        <td class="value">${payment.paymentMethod}</td>
      </tr>
      <tr>
        <td class="label">Remaining Balance</td>
        <td class="value" style="color: ${payment.remainingBalance > 0 ? '#ea580c' : '#16a34a'}">
          ${currency}${Number(payment.remainingBalance).toFixed(2)}
        </td>
      </tr>
    </table>

    <p style="margin-top: 24px; font-style: italic; color: #64748b;">
      "${gymSettings?.receiptFooter || 'Thank you for your business! Push your limits and stay healthy.'}"
    </p>

    <p style="margin-top: 24px;">Sincerely,<br><strong>${gymName} Management</strong></p>
  `;

  return sendEmail({
    to: member.email,
    subject: `Payment Receipt ${payment.receiptNumber} - ${gymName}`,
    html: baseTemplate(`Payment Receipt - ${payment.receiptNumber}`, content)
  });
}

export async function sendExpiryAlertEmail(
  member: { fullName: string; email: string; memberId: string },
  planName: string,
  endDate: Date | string,
  isExpired: boolean
) {
  const formattedDate = new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const content = `
    <h2 style="margin-top: 0; color: ${isExpired ? '#dc2626' : '#ea580c'};">
      ${isExpired ? 'Membership Expired' : 'Membership Expiring Soon'}
    </h2>
    <p>Hello ${member.fullName},</p>
    <p>${isExpired 
      ? `Your <strong>${planName}</strong> membership at TitanForge Fitness expired on <strong>${formattedDate}</strong>.`
      : `Your <strong>${planName}</strong> membership is set to expire on <strong>${formattedDate}</strong>.`
    }</p>

    <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 14px 18px; margin: 20px 0; border-radius: 6px;">
      <p style="margin: 0; color: #9a3412; font-weight: 500;">
        ${isExpired 
          ? 'Renew your membership today at the front desk or online to maintain uninterrupted access to gym facilities and trainer sessions.'
          : 'Renew ahead of time to keep your streak going and enjoy member discounts on renewals!'
        }
      </p>
    </div>

    <table class="table-box">
      <tr>
        <td class="label">Member ID</td>
        <td class="value">${member.memberId}</td>
      </tr>
      <tr>
        <td class="label">Current Plan</td>
        <td class="value">${planName}</td>
      </tr>
      <tr>
        <td class="label">Expiry Date</td>
        <td class="value">${formattedDate}</td>
      </tr>
    </table>

    <p style="margin-top: 24px;">Best regards,<br><strong>TitanForge Fitness Front Desk</strong></p>
  `;

  return sendEmail({
    to: member.email,
    subject: `${isExpired ? 'Action Required: Membership Expired' : 'Notice: Membership Expiring Soon'} - TitanForge Fitness`,
    html: baseTemplate(isExpired ? 'Membership Expired Notice' : 'Membership Expiry Notice', content)
  });
}

export async function sendPasswordResetEmail(user: { name: string; email: string }, temporaryPassword: string) {
  const content = `
    <h2 style="margin-top: 0; color: #0f172a;">Password Reset Notice</h2>
    <p>Hello ${user.name},</p>
    <p>Your account password for TitanForge Gym Management System has been reset by an administrator.</p>

    <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 18px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Temporary Password</p>
      <code style="font-size: 20px; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 6px 14px; border-radius: 6px; letter-spacing: 1px;">${temporaryPassword}</code>
    </div>

    <p style="color: #64748b; font-size: 13px;">
      For security reasons, please log in immediately and update your password under your user settings.
    </p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Your Password Has Been Reset - TitanForge Gym Management',
    html: baseTemplate('Password Reset', content)
  });
}

export async function sendTestEmail(toEmail: string) {
  const config = getSmtpConfig();
  const content = `
    <h2 style="margin-top: 0; color: #16a34a;">Brevo SMTP Connection Verified!</h2>
    <p>This is a live test email sent from your <strong>Gym Management Software</strong> deployment.</p>
    
    <table class="table-box">
      <tr>
        <td class="label">SMTP Host</td>
        <td class="value">${config?.host || 'smtp-relay.brevo.com'}</td>
      </tr>
      <tr>
        <td class="label">SMTP Port</td>
        <td class="value">${config?.port || 587}</td>
      </tr>
      <tr>
        <td class="label">Sender Identity</td>
        <td class="value">${config?.from || 'Configured'}</td>
      </tr>
      <tr>
        <td class="label">Delivered To</td>
        <td class="value">${toEmail}</td>
      </tr>
      <tr>
        <td class="label">Timestamp</td>
        <td class="value">${new Date().toISOString()}</td>
      </tr>
    </table>

    <p style="color: #16a34a; font-weight: 600;">
      ✓ Your Brevo SMTP configuration is fully operational and ready for production receipts, alerts, and registration emails.
    </p>
  `;

  return sendEmail({
    to: toEmail,
    subject: '✓ Brevo SMTP Test Email - Gym Management Software',
    html: baseTemplate('Brevo SMTP Test Email', content)
  });
}

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// In-memory outbox log to make email testing and evaluation instantaneous in any environment
export const emailOutbox = [];

let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send an email notification (or record to evaluation outbox)
 */
export async function sendEmail({ to, subject, html, text, type = 'general' }) {
  const emailRecord = {
    id: 'email_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
    type,
    sent_at: new Date().toISOString(),
    status: 'delivered'
  };

  emailOutbox.unshift(emailRecord);
  // Keep only the most recent 100 emails in outbox
  if (emailOutbox.length > 100) emailOutbox.pop();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Society Tracker" <noreply@societytracker.local>',
        to: emailRecord.to.join(', '),
        subject,
        text,
        html,
      });
    } catch (err) {
      console.error('[EmailService] SMTP delivery error:', err.message);
      emailRecord.status = 'failed';
      emailRecord.error = err.message;
    }
  } else {
    console.log(`[EmailService - Outbox] To: ${emailRecord.to.join(', ')} | Subject: "${subject}"`);
  }

  return emailRecord;
}

/**
 * Send complaint status update notification to resident
 */
export async function sendComplaintStatusEmail({ residentEmail, residentName, complaintTitle, previousStatus, newStatus, priority, note, actorName }) {
  const subject = `[Society Tracker] Update on Complaint: "${complaintTitle}" (${newStatus})`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
      <div style="background: #2563eb; color: #ffffff; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px;">Society Maintenance Tracker</h2>
      </div>
      <p>Hello <strong>${residentName}</strong>,</p>
      <p>There has been an update regarding your complaint:</p>
      
      <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 16px;">${complaintTitle}</h3>
        <p style="margin: 4px 0;"><strong>Status:</strong> <span style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px;">${previousStatus || 'Open'}</span> &rarr; <span style="background: #dbeafe; color: #1d4ed8; font-weight: bold; padding: 2px 8px; border-radius: 4px;">${newStatus}</span></p>
        <p style="margin: 4px 0;"><strong>Priority:</strong> ${priority}</p>
        <p style="margin: 4px 0;"><strong>Updated by:</strong> ${actorName}</p>
        ${note ? `<p style="margin: 8px 0 0 0; font-style: italic; color: #475569;"><strong>Admin Note:</strong> "${note}"</p>` : ''}
      </div>

      <p>You can log in to your resident portal anytime to view the complete history and details.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">This is an automated notification from your Housing Society Management System.</p>
    </div>
  `;

  return sendEmail({
    to: residentEmail,
    subject,
    html,
    text: `Your complaint "${complaintTitle}" status has changed to ${newStatus}. Note: ${note || 'None'}`,
    type: 'complaint_status_update'
  });
}

/**
 * Broadcast Important Notice to all residents
 */
export async function sendImportantNoticeEmail({ recipients, noticeTitle, noticeContent, authorName }) {
  if (!recipients || recipients.length === 0) return null;
  const emails = recipients.map(r => typeof r === 'string' ? r : r.email);

  const subject = `⚠️ IMPORTANT NOTICE: ${noticeTitle}`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fed7aa; border-radius: 8px; background: #ffffff;">
      <div style="background: #ea580c; color: #ffffff; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px;">⚠️ Society Notice Board - Important Announcement</h2>
      </div>
      <h3 style="color: #1e293b; font-size: 18px; margin-top: 0;">${noticeTitle}</h3>
      <div style="background: #fff7ed; border-left: 4px solid #ea580c; padding: 16px; margin: 16px 0; border-radius: 4px; line-height: 1.6; color: #334155; white-space: pre-line;">
${noticeContent}
      </div>
      <p style="font-size: 13px; color: #64748b;">Posted by: <strong>${authorName}</strong> on ${new Date().toLocaleDateString()}</p>
      <hr style="border: none; border-top: 1px solid #fed7aa; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">You received this broadcast because you are a registered resident of this society.</p>
    </div>
  `;

  return sendEmail({
    to: emails,
    subject,
    html,
    text: `IMPORTANT NOTICE: ${noticeTitle}\n\n${noticeContent}\n\nPosted by: ${authorName}`,
    type: 'important_notice_broadcast'
  });
}

/**
 * Send account verification & approval confirmation email to resident
 */
export async function sendResidentApprovalEmail({ residentEmail, residentName, flatNumber }) {
  const subject = `✅ Account Verified: Welcome to Gulmohar Meadows Portal (${flatNumber})`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #bbf7d0; border-radius: 8px; background: #ffffff;">
      <div style="background: #166534; color: #ffffff; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px;">✅ Apartment Registration Approved</h2>
      </div>
      <p>Hello <strong>${residentName}</strong>,</p>
      <p>Your apartment unit registration for <strong>${flatNumber}</strong> has been officially verified and approved by the RWA Managing Committee.</p>
      
      <div style="background: #f0fdf4; border-left: 4px solid #166534; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 8px 0; color: #14532d; font-size: 15px;">Full Portal Privileges Activated</h3>
        <p style="margin: 4px 0; font-size: 13px; color: #166534;">• Lodge zero-type care requests with live delivery tracking</p>
        <p style="margin: 4px 0; font-size: 13px; color: #166534;">• Access digital RFID vendor gate passes</p>
        <p style="margin: 4px 0; font-size: 13px; color: #166534;">• View official society circulars and AGM notices</p>
      </div>

      <p>You can now sign in to your resident portal using your registered credentials.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Gulmohar Meadows Co-op Housing Society Management</p>
    </div>
  `;

  return sendEmail({
    to: residentEmail,
    subject,
    html,
    text: `Hello ${residentName}, your apartment registration for ${flatNumber} has been approved by the RWA Management!`,
    type: 'resident_approved'
  });
}

// src/services/notification.service.js — MongoDB version
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { Notification } = require('../models/index');
const logger = require('../utils/logger');

if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_NAME = process.env.SENDGRID_FROM_NAME || process.env.SMTP_FROM_NAME || 'Dhameys Airlines';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'noreply@dhameys.com';
const FROM = { email: FROM_EMAIL, name: FROM_NAME };

let smtpTransport = null;
function getSmtpTransport() {
  if (smtpTransport) return smtpTransport;
  if (!process.env.SMTP_HOST) return null;
  smtpTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined,
  });
  return smtpTransport;
}

function hasEmailProvider() {
  return !!(getSmtpTransport() || process.env.SENDGRID_API_KEY);
}

/** @param attachments {{ filename: string, path: string }[]} */
async function sendEmail({ to, toName, subject, htmlContent, textContent, attachments = [] }) {
  const text = textContent || htmlContent?.replace(/<[^>]+>/g, '') || '';
  const validAttachments = [];
  for (const a of attachments) {
    if (a?.path && fs.existsSync(a.path)) {
      validAttachments.push({
        filename: a.filename || path.basename(a.path),
        path: a.path,
      });
    }
  }

  const smtp = getSmtpTransport();
  if (smtp) {
    try {
      await smtp.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: toName ? `${toName} <${to}>` : to,
        subject,
        html: htmlContent,
        text,
        attachments: validAttachments.length
          ? validAttachments.map(({ filename, path: p }) => ({ filename, path: p }))
          : undefined,
      });
      logger.info('Email sent (SMTP)', { to, subject, attachmentCount: validAttachments.length });
      return;
    } catch (err) {
      logger.error('SMTP email failed', { to, error: err.message });
      return;
    }
  }
  if (!process.env.SENDGRID_API_KEY) {
    logger.warn('No SMTP or SendGrid configured, skipping email to:', to);
    return;
  }
  try {
    const sgAttachments = [];
    for (const a of validAttachments) {
      const buf = fs.readFileSync(a.path);
      sgAttachments.push({
        content: buf.toString('base64'),
        filename: a.filename,
        type: 'application/pdf',
        disposition: 'attachment',
      });
    }
    await sgMail.send({
      to: { email: to, name: toName || '' },
      from: FROM,
      subject,
      html: htmlContent,
      text,
      ...(sgAttachments.length ? { attachments: sgAttachments } : {}),
    });
    logger.info('Email sent (SendGrid)', { to, subject, attachmentCount: sgAttachments.length });
  } catch (err) {
    logger.error('SendGrid email failed', { to, error: err.message });
  }
}

async function processEmailJob(job) {
  switch (job.type) {
    case 'BOOKING_CONFIRMATION':
      await sendEmail({
        to: job.to,
        toName: job.toName,
        subject: `Booking Confirmed — ${job.booking?.bookingRef}`,
        htmlContent: buildConfirmationEmail(job),
        attachments: job.attachments || [],
      });
      break;
    case 'EMAIL_VERIFICATION':
      await sendEmail({ to: job.to, subject: 'Verify your Dhameys account', htmlContent: `<p>Hi ${job.name},</p><p><a href="${job.url}">Click here to verify your email</a></p><p>Link expires in 24 hours.</p>` });
      break;
    case 'PASSWORD_RESET':
      await sendEmail({ to: job.to, subject: 'Reset your Dhameys password', htmlContent: `<p>Hi ${job.name},</p><p><a href="${job.url}">Click here to reset your password</a></p><p>Link expires in 1 hour.</p>` });
      break;
    case 'FLIGHT_ALERT':
      await sendEmail({ to: job.to, subject: `Flight Update — ${job.flight?.flightNumber}`, htmlContent: `<p>There is an update to your flight ${job.flight?.flightNumber}. Please check the app for details.</p>` });
      break;
    default:
      logger.warn('Unknown email job type:', job.type);
  }
}

function escapeHtml(s) {
  if (s == null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildConfirmationEmail(job) {
  const { booking, passengers = [], flights = [] } = job;
  const hasPdf = Array.isArray(job.attachments) && job.attachments.length > 0;
  const brand = '#1a3570';
  const brandLight = '#a8c4f0';
  const ref = escapeHtml(booking?.bookingRef || 'N/A');
  const firstName = escapeHtml(passengers[0]?.firstName || 'Passenger');
  const currency = escapeHtml(booking?.currency || 'USD');
  const total = parseFloat(booking?.totalAmount || 0).toFixed(2);
  const tripsUrl = escapeHtml(`${process.env.FRONTEND_URL || ''}/my-trips`.replace(/\/+$/, '') + '/');

  const flightRows = flights
    .map((f) => {
      const o = escapeHtml(f.originIata || '');
      const d = escapeHtml(f.destIata || '');
      const fn = escapeHtml(f.flightNumber || '—');
      const dt = f.departureTime ? escapeHtml(new Date(f.departureTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })) : '—';
      return `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #f3f4f6;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="vertical-align:top;width:36px;padding-top:2px;font-size:18px;">✈️</td>
              <td style="vertical-align:top;">
                <div style="font-size:15px;font-weight:700;color:#111827;letter-spacing:-0.02em;">${o} <span style="color:#9ca3af;font-weight:400;">→</span> ${d}</div>
                <div style="font-size:13px;color:#6b7280;margin-top:6px;">
                  <span style="color:#374151;">Flight ${fn}</span>
                  <span style="color:#d1d5db;margin:0 6px;">|</span>
                  ${dt}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join('');

  const pdfBlock = hasPdf
    ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:collapse;">
      <tr>
        <td style="padding:14px 18px;background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:1px solid #6ee7b7;border-radius:10px;">
          <span style="font-size:14px;font-weight:700;color:#047857;letter-spacing:0.01em;">Your e-ticket PDFs are attached to this email.</span>
          <div style="font-size:12px;color:#059669;margin-top:6px;line-height:1.45;">Download and save them — you’ll need them for check-in and boarding.</div>
        </td>
      </tr>
    </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Booking confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-collapse:collapse;">
          <tr>
            <td style="background:${brand};border-radius:14px 14px 0 0;padding:28px 24px 26px;text-align:center;background-image:linear-gradient(160deg,#1e3a6e 0%,#1a3570 45%,#152a52 100%);">
              <div style="font-size:28px;line-height:1;margin-bottom:10px;">✈️</div>
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Dhameys Airlines</h1>
              <p style="margin:10px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:${brandLight};text-transform:uppercase;letter-spacing:0.12em;">Booking confirmation</p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 14px 14px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:28px 28px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                    <h2 style="margin:0 0 18px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.03em;">Booking confirmed!</h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:linear-gradient(180deg,#f0f4ff 0%,#eef2ff 100%);border:1px solid #c7d2fe;border-radius:12px;margin:0 0 20px;">
                      <tr>
                        <td style="padding:22px 20px;text-align:center;">
                          <div style="font-size:11px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:8px;">Booking reference</div>
                          <div style="font-family:'SF Mono',Consolas,'Liberation Mono',Menlo,monospace;font-size:26px;font-weight:800;color:${brand};letter-spacing:0.06em;">${ref}</div>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;">Dear ${firstName},</p>
                    <p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#334155;">
                      Your booking is confirmed. Total paid:
                      <strong style="color:#0f172a;">${currency} ${total}</strong>
                    </p>
                    ${pdfBlock}
                    <p style="margin:20px 0 10px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Your itinerary</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fafafa;">
                      ${flightRows || `<tr><td style="padding:16px;color:#64748b;font-size:14px;">Flight details will appear in your account.</td></tr>`}
                    </table>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:28px;">
                      <tr>
                        <td align="center" style="padding:4px 0 8px;">
                          <a href="${tripsUrl}" style="display:inline-block;padding:14px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;background:linear-gradient(180deg,#2b5cad 0%,${brand} 100%);border-radius:10px;box-shadow:0 4px 14px rgba(26,53,112,0.35);">View booking</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 28px 24px;border-top:1px solid #f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;line-height:1.55;color:#94a3b8;text-align:center;">
                    Need help? Reply to this email or visit our website.<br />
                    <span style="color:#cbd5e1;">© ${new Date().getFullYear()} Dhameys Airlines · Thank you for flying with us</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 8px 8px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;color:#94a3b8;">
              This is an automated message regarding booking ${ref}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function storeNotification(userId, type, channel, subject, body, data = {}) {
  await Notification.create({ user: userId, type, channel, subject, body, data, sentAt: new Date() });
}

module.exports = { sendEmail, processEmailJob, storeNotification, hasEmailProvider };

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

const RECIPIENT_EMAIL = 'michael@mmcphotography.co.uk';
const FORMSUBMIT_AJAX_URL = `https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`;
const DEFAULT_SITE_ORIGIN = 'https://www.mmcphotography.co.uk';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lightweight in-memory rate limiter: max 5 inquiries per IP per 15 minutes
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const ipHits = new Map<string, number[]>();

interface ContactPayload {
  couple?: unknown;
  email?: unknown;
  phone?: unknown;
  date?: unknown;
  message?: unknown;
  website?: unknown; // invisible honeypot field
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  if (ipHits.size > 500) {
    for (const [key, timestamps] of ipHits.entries()) {
      const recent = timestamps.filter(ts => ts > windowStart);
      if (recent.length === 0) {
        ipHits.delete(key);
      } else {
        ipHits.set(key, recent);
      }
    }
  }

  const recentHits = (ipHits.get(ip) || []).filter(ts => ts > windowStart);
  if (recentHits.length >= RATE_LIMIT_MAX_REQUESTS) {
    ipHits.set(ip, recentHits);
    return true;
  }

  recentHits.push(now);
  ipHits.set(ip, recentHits);
  return false;
}

function sanitizeSingleLine(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, maxLength);
}

function sanitizeMultiline(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\r\n/g, '\n').trim().slice(0, maxLength);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getSafeOrigin(req: NextRequest): string {
  const rawOrigin = req.headers.get('origin') || req.headers.get('referer') || '';
  try {
    if (rawOrigin) {
      const parsed = new URL(rawOrigin);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.origin;
      }
    }
  } catch {
    // Fall back to default site origin
  }
  return DEFAULT_SITE_ORIGIN;
}

function buildHtmlEmail(fields: {
  couple: string;
  email: string;
  phone: string;
  date: string;
  message: string;
}): string {
  const safeCouple = escapeHtml(fields.couple);
  const safeEmail = escapeHtml(fields.email);
  const safePhone = escapeHtml(fields.phone || 'Not provided');
  const safeDate = escapeHtml(fields.date);
  const safeMessage = escapeHtml(fields.message || '(No additional message provided)').replace(
    /\n/g,
    '<br />'
  );

  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; color: #1c1917; max-width: 600px; margin: 0 auto; border: 1px solid #e7e5e4; background-color: #ffffff;">
      <div style="background-color: #1e2321; color: #ffffff; padding: 24px 28px; border-bottom: 3px solid #c2a378;">
        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #c2a378;">
          MMC Photography Website Inquiry
        </p>
        <h1 style="margin: 8px 0 0; font-size: 22px; font-weight: normal; color: #ffffff;">
          New Wedding Availability Inquiry
        </h1>
      </div>
      <div style="padding: 24px 28px; background-color: #fbf9f6;">
        <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #78716c; width: 140px; vertical-align: top;">Couple Names</td>
            <td style="padding: 8px 0; color: #1c1917; font-weight: 600;">${safeCouple}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #78716c; vertical-align: top;">Email Address</td>
            <td style="padding: 8px 0; color: #1c1917;">${safeEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #78716c; vertical-align: top;">Phone Number</td>
            <td style="padding: 8px 0; color: #1c1917;">${safePhone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #78716c; vertical-align: top;">Wedding Date</td>
            <td style="padding: 8px 0; color: #1c1917; font-weight: 600;">${safeDate}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5dfd5;">
          <p style="margin: 0 0 8px; font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #78716c;">
            Plans &amp; Message
          </p>
          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #292524;">
            ${safeMessage}
          </p>
        </div>
      </div>
      <div style="padding: 14px 28px; background-color: #f5f5f4; font-family: Arial, sans-serif; font-size: 12px; color: #78716c;">
        Reply directly to this email to respond to ${safeCouple} (${safeEmail}).
      </div>
    </div>
  `.trim();
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Too many inquiries sent recently. Please wait a few minutes and try again.' },
        { status: 429 }
      );
    }

    const body = (await req.json()) as ContactPayload;
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid inquiry payload.' },
        { status: 400 }
      );
    }

    // Silently accept bot honeypot submissions without sending email
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      return NextResponse.json({
        delivered: true,
        recipient: RECIPIENT_EMAIL,
      });
    }

    const couple = sanitizeSingleLine(body.couple, 150);
    const email = sanitizeSingleLine(body.email, 254);
    const phone = sanitizeSingleLine(body.phone, 40);
    const date = sanitizeSingleLine(body.date, 40);
    const message = sanitizeMultiline(body.message, 5000);

    if (!couple || !email || !date) {
      return NextResponse.json(
        { error: 'Please complete your names, email address, and wedding date.' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address so we can reply to you.' },
        { status: 400 }
      );
    }

    const subject = `Wedding Availability Inquiry — ${couple} (${date})`;
    const textBody = [
      `New Wedding Availability Inquiry`,
      ``,
      `Couple Names: ${couple}`,
      `Email Address: ${email}`,
      `Phone Number: ${phone || 'Not provided'}`,
      `Wedding Date: ${date}`,
      ``,
      `Plans & Message:`,
      message || '(No additional message provided)',
    ].join('\n');

    const htmlBody = buildHtmlEmail({ couple, email, phone, date, message });

    // 1. Primary: Direct SMTP delivery (e.g. Hostinger smtp.hostinger.com for michael@mmcphotography.co.uk)
    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    if (smtpHost && smtpUser && smtpPass) {
      const smtpPort = Number(process.env.SMTP_PORT?.trim() || '465');
      const smtpSecure =
        process.env.SMTP_SECURE !== undefined && process.env.SMTP_SECURE.trim() !== ''
          ? process.env.SMTP_SECURE.trim().toLowerCase() === 'true'
          : smtpPort === 465;

      const fromAddress =
        process.env.CONTACT_FROM_EMAIL?.trim() ||
        `MMC Photography Website <${smtpUser}>`;

      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number.isFinite(smtpPort) ? smtpPort : 465,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        });

        await transporter.sendMail({
          from: fromAddress,
          to: RECIPIENT_EMAIL,
          replyTo: email,
          subject,
          text: textBody,
          html: htmlBody,
        });

        return NextResponse.json({
          delivered: true,
          method: 'smtp',
          recipient: RECIPIENT_EMAIL,
        });
      } catch (smtpError) {
        console.error('SMTP email delivery failed:', smtpError);
      }
    }

    // 2. Secondary: Resend API delivery if configured
    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    if (resendApiKey) {
      const fromAddress =
        process.env.CONTACT_FROM_EMAIL?.trim() ||
        'MMC Photography Website <onboarding@resend.dev>';

      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [RECIPIENT_EMAIL],
            reply_to: email,
            subject,
            text: textBody,
            html: htmlBody,
          }),
        });

        if (resendRes.ok) {
          return NextResponse.json({
            delivered: true,
            method: 'resend',
            recipient: RECIPIENT_EMAIL,
          });
        }

        const errorText = await resendRes.text().catch(() => '');
        console.error('Resend API delivery failed:', resendRes.status, errorText);
      } catch (resendError) {
        console.error('Resend API request failed:', resendError);
      }
    }

    // 3. Zero-config direct relay via FormSubmit AJAX directly to michael@mmcphotography.co.uk
    const relayPayload = {
      'Couple Names': couple,
      'Email Address': email,
      'Phone Number': phone || 'Not provided',
      'Wedding Date': date,
      'Plans & Message': message || '(No additional message provided)',
      name: couple,
      email,
      _subject: subject,
      _replyto: email,
      _template: 'table',
      _captcha: 'false',
    };

    try {
      const safeOrigin = getSafeOrigin(req);
      const formSubmitRes = await fetch(FORMSUBMIT_AJAX_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: safeOrigin,
          Referer: `${safeOrigin}/`,
        },
        body: JSON.stringify(relayPayload),
      });

      const contentType = formSubmitRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const fsData = (await formSubmitRes.json()) as {
          success?: boolean | string;
          message?: string;
        };

        const isSuccess = fsData.success === true || fsData.success === 'true';
        if (formSubmitRes.ok && isSuccess) {
          return NextResponse.json({
            delivered: true,
            method: 'formsubmit',
            recipient: RECIPIENT_EMAIL,
          });
        }

        const fsMsg = String(fsData.message || '');
        if (fsMsg.toLowerCase().includes('activation')) {
          return NextResponse.json({
            delivered: false,
            needsActivation: true,
            recipient: RECIPIENT_EMAIL,
            message:
              'A one-time confirmation email has been sent to michael@mmcphotography.co.uk. Please click the activation link in that email once so all future inquiries arrive automatically.',
          });
        }
      }
    } catch (relayError) {
      console.error('Server-side FormSubmit relay attempt failed:', relayError);
    }

    // If server-side relay was blocked by origin/datacenter rules, let the browser complete the direct background POST
    return NextResponse.json({
      delivered: false,
      useClientRelay: true,
      recipient: RECIPIENT_EMAIL,
      relayPayload,
    });
  } catch (err) {
    console.error('Contact inquiry error:', err);
    return NextResponse.json(
      {
        error:
          'Unable to send your inquiry right now. Please try again in a moment or call us on 07511616354.',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

const RECIPIENT_EMAIL = 'michael@mmcphotography.co.uk';

interface ContactPayload {
  couple?: string;
  email?: string;
  phone?: string;
  date?: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactPayload;
    const couple = (body.couple || '').trim();
    const email = (body.email || '').trim();
    const phone = (body.phone || '').trim();
    const date = (body.date || '').trim();
    const message = (body.message || '').trim();

    if (!couple || !email || !date) {
      return NextResponse.json(
        { error: 'Please complete your names, email address, and wedding date.' },
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

    const mailtoUrl = `mailto:${RECIPIENT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(textBody)}`;

    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    if (resendApiKey) {
      const fromAddress =
        process.env.CONTACT_FROM_EMAIL?.trim() ||
        'MMC Photography Website <onboarding@resend.dev>';

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
        }),
      });

      if (resendRes.ok) {
        return NextResponse.json({
          delivered: true,
          recipient: RECIPIENT_EMAIL,
          mailtoUrl,
          formattedMessage: textBody,
        });
      }

      const errorText = await resendRes.text().catch(() => '');
      console.error('Resend API delivery failed:', resendRes.status, errorText);
    }

    return NextResponse.json({
      delivered: false,
      recipient: RECIPIENT_EMAIL,
      mailtoUrl,
      formattedMessage: textBody,
    });
  } catch (err) {
    console.error('Contact inquiry error:', err);
    return NextResponse.json(
      { error: 'Unable to process your inquiry right now. Please email michael@mmcphotography.co.uk directly.' },
      { status: 500 }
    );
  }
}

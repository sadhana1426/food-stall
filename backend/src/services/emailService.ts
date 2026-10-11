import { config } from '../config/env';

export class EmailService {
  static async sendEmail(to: string, subject: string, htmlContent: string) {
    const apiKey = config.BREVO_API_KEY;
    if (!apiKey) {
      console.warn('BREVO_API_KEY not set. Mocking email send to:', to);
      return;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { email: config.BREVO_SENDER_EMAIL || 'noreply@tastybites.com', name: config.BREVO_SENDER_NAME || 'Tasty Bites' },
          to: [{ email: to }],
          subject,
          htmlContent,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Brevo API Error:', errText);
        throw new Error('Failed to send email via Brevo');
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  static async sendSignupOtp(to: string, otp: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Tasty Bites!</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 5px; color: #064E3B;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p style="color: #6B7280; font-size: 12px;">If you did not request this, you can ignore this email.</p>
      </div>
    `;
    await this.sendEmail(to, 'Verify your Tasty Bites email', html);
  }

  static async sendPasswordResetOtp(to: string, otp: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Tasty Bites Password Reset</h2>
        <p>Your password reset code is:</p>
        <h1 style="letter-spacing: 5px; color: #FF5A1F;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p style="color: #6B7280; font-size: 12px;">If you did not request this, you can ignore this email.</p>
      </div>
    `;
    await this.sendEmail(to, 'Reset your Tasty Bites password', html);
  }
}

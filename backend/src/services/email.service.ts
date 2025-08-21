import nodemailer, { Transporter } from 'nodemailer';
import { IUser } from '@kinect/shared';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter!: Transporter;
  private isTestMode: boolean;

  constructor() {
    this.isTestMode = process.env.NODE_ENV !== 'production';
    this.setupTransporter();
  }

  private setupTransporter() {
    if (this.isTestMode || !process.env.SMTP_HOST) {
      // Use test mode that logs instead of sending for development
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    } else {
      // Production email service (SendGrid, AWS SES, etc.)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@kinect.app',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (this.isTestMode) {
        console.log('📧 Test email sent:', info.messageId);
        console.log('📧 Email content:', info.message?.toString());
        console.log('📧 To:', options.to);
        console.log('📧 Subject:', options.subject);
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendPasswordResetEmail(user: IUser, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0;">Kinect</h1>
          <p style="color: #6B7280; margin: 5px 0;">Stay connected with the people who matter</p>
        </div>
        
        <div style="background: #F9FAFB; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #111827; margin-top: 0;">Reset Your Password</h2>
          <p style="color: #374151; line-height: 1.6;">
            Hi ${user.firstName},
          </p>
          <p style="color: #374151; line-height: 1.6;">
            We received a request to reset your password for your Kinect account. 
            Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: 600;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">
            This link will expire in 1 hour for security reasons. If you didn't request this reset, 
            you can safely ignore this email.
          </p>
          
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">
            If the button doesn't work, you can also copy and paste this link into your browser:
            <br><a href="${resetUrl}" style="color: #4F46E5;">${resetUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; color: #6B7280; font-size: 12px;">
          <p>© 2024 Kinect. All rights reserved.</p>
          <p>This email was sent to ${user.email}</p>
        </div>
      </div>
    `;

    const text = `
      Reset Your Password - Kinect
      
      Hi ${user.firstName},
      
      We received a request to reset your password for your Kinect account.
      Click the link below to create a new password:
      
      ${resetUrl}
      
      This link will expire in 1 hour for security reasons.
      If you didn't request this reset, you can safely ignore this email.
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Reset Your Kinect Password',
      html,
      text,
    });
  }

  async sendWelcomeEmail(user: IUser): Promise<void> {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0;">Welcome to Kinect!</h1>
          <p style="color: #6B7280; margin: 5px 0;">Stay connected with the people who matter</p>
        </div>
        
        <div style="background: #F9FAFB; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #111827; margin-top: 0;">Hi ${user.firstName}!</h2>
          <p style="color: #374151; line-height: 1.6;">
            Thank you for joining Kinect! We're excited to help you maintain meaningful connections 
            with your friends and loved ones.
          </p>
          
          <p style="color: #374151; line-height: 1.6;">
            With Kinect, you can:
          </p>
          
          <ul style="color: #374151; line-height: 1.8;">
            <li>Track when you last spoke with your contacts</li>
            <li>Get gentle reminders to stay in touch</li>
            <li>Organize contacts into custom lists</li>
            <li>Never lose touch with the people who matter most</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: 600;">
              Get Started
            </a>
          </div>
        </div>
        
        <div style="text-align: center; color: #6B7280; font-size: 12px;">
          <p>© 2024 Kinect. All rights reserved.</p>
          <p>This email was sent to ${user.email}</p>
        </div>
      </div>
    `;

    const text = `
      Welcome to Kinect!
      
      Hi ${user.firstName},
      
      Thank you for joining Kinect! We're excited to help you maintain meaningful connections 
      with your friends and loved ones.
      
      With Kinect, you can:
      - Track when you last spoke with your contacts
      - Get gentle reminders to stay in touch
      - Organize contacts into custom lists
      - Never lose touch with the people who matter most
      
      Get started: ${loginUrl}
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Welcome to Kinect - Start Building Better Relationships',
      html,
      text,
    });
  }

  async sendContactReminderEmail(
    user: IUser, 
    overdueContacts: Array<{ name: string; daysSince: number }>
  ): Promise<void> {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;
    
    const contactList = overdueContacts
      .map(contact => `<li>${contact.name} (${contact.daysSince} days ago)</li>`)
      .join('');

    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0;">Kinect</h1>
          <p style="color: #6B7280; margin: 5px 0;">Stay connected with the people who matter</p>
        </div>
        
        <div style="background: #F9FAFB; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #111827; margin-top: 0;">Time to Reconnect!</h2>
          <p style="color: #374151; line-height: 1.6;">
            Hi ${user.firstName},
          </p>
          <p style="color: #374151; line-height: 1.6;">
            You have ${overdueContacts.length} contact${overdueContacts.length > 1 ? 's' : ''} 
            you haven't spoken to in a while:
          </p>
          
          <ul style="color: #374151; line-height: 1.8; margin: 20px 0;">
            ${contactList}
          </ul>
          
          <p style="color: #374151; line-height: 1.6;">
            Why not reach out today? A simple message can brighten someone's day and strengthen your connection.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" 
               style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Dashboard
            </a>
          </div>
        </div>
        
        <div style="text-align: center; color: #6B7280; font-size: 12px;">
          <p>© 2024 Kinect. All rights reserved.</p>
          <p>
            <a href="${process.env.FRONTEND_URL}/unsubscribe?email=${user.email}" 
               style="color: #6B7280;">Unsubscribe from reminders</a>
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: user.email,
      subject: `Time to reconnect with ${overdueContacts.length} contact${overdueContacts.length > 1 ? 's' : ''}`,
      html,
    });
  }
}

export const emailService = new EmailService();
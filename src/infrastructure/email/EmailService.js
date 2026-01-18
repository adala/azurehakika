const nodemailer = require('nodemailer');
const IEmailService = require('../../domain/interfaces/IEmailService');

class EmailService extends IEmailService {
  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } 

  async sendOTP(email, otp) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Hakika',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Hakika OTP</h2>
          <p>Your One-Time Password (OTP) for login is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">Hakika Team</p>
        </div>
      `,
    };
    console.log('The OTP code is: ' + otp);

    const info = await this.transporter.sendMail(mailOptions);

  }

  async sendVerificationEmail(email, userId) {
    const verificationLink = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify-email/${userId}`;
    console.log(verificationLink);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Hakika Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Hakika!</h2>
          <p>Thank you for registering with Hakika. Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${verificationLink}</p>
          <hr style="margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">Hakika Team</p>
        </div>
      `,
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log('Welcome email sent: ', info.messageId);
    console.log('Preview URL: %s', verificationLink);
  }

  async sendTeamInvitation(email, userId) {
    const verificationLink = `${process.env.APP_URL || 'http://localhost:3000'}/api/team/activate/${userId}`;
    console.log(verificationLink);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Activate Your Hakika Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Hakika!</h2>
          <p>Please activate your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Activate Email Address
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${verificationLink}</p>
          <hr style="margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">Hakika Team</p>
        </div>
      `,
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log('Welcome email sent: ', info.messageId);
    console.log('Preview URL: %s', verificationLink);
  }

  async sendPasswordResetEmail(to, resetLink, userName) {
    const subject = 'Reset Your Hakika Password';
    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #007bff; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 20px; }
                    .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Hakika</h1>
                        <p>Academic Verification Platform</p>
                    </div>
                    <div class="content">
                        <h2>Password Reset Request</h2>
                        <p>Hello ${userName},</p>
                        <p>You requested to reset your password for your Hakika account.</p>
                        <p>Click the button below to reset your password:</p>
                        <p style="text-align: center;">
                            <a href="${resetLink}" class="button">Reset Password</a>
                        </p>
                        <p>This link will expire in 1 hour for security reasons.</p>
                        <p>If you didn't request this reset, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Hakika. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

    return await this.transporter.sendEmail(to, subject, html);
  }

  async sendVerificationRequestEmail(verificationData, user, institution) {
    const {
      referenceNumber,
      processingTime,
      courseName,
      degreeType,
      graduationYear,
      verificationFee,
      expectedCompletionDate = null
    } = verificationData;

    // Calculate expected completion date if not provided
    let completionDate = expectedCompletionDate;
    if (!completionDate && processingTime) {
      const days = parseInt(processingTime) || 10;
      const date = new Date();
      date.setDate(date.getDate() + days);
      completionDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    const subject = `Verification Request Submitted: ${referenceNumber}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f9f9f9;
          }
          .header { 
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0;
          }
          .content { 
            background: white; 
            padding: 30px; 
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .verification-details {
            background: #f8fafc;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .detail-row {
            display: flex;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-label {
            font-weight: 600;
            color: #4b5563;
            min-width: 180px;
          }
          .detail-value {
            color: #1f2937;
            flex: 1;
          }
          .status-badge {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
          }
          .timeline {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
          }
          .timeline-item {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
          }
          .timeline-icon {
            background: #2563eb;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-weight: bold;
          }
          .timeline-content {
            flex: 1;
          }
          .button { 
            display: inline-block; 
            padding: 14px 28px; 
            background: #2563eb; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600;
            font-size: 16px;
            transition: background 0.3s ease;
          }
          .button:hover {
            background: #1d4ed8;
          }
          .footer { 
            text-align: center; 
            padding: 25px 20px; 
            font-size: 13px; 
            color: #6b7280; 
            border-top: 1px solid #e5e7eb;
            margin-top: 30px;
          }
          .important-note {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          @media (max-width: 600px) {
            .detail-row {
              flex-direction: column;
            }
            .detail-label {
              margin-bottom: 5px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">📋 Verification Request Submitted</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Academic Verification - Hakika</p>
          </div>
          
          <div class="content">
            <p style="font-size: 18px; margin-bottom: 10px;"><strong>Hello ${user.firstName || user.email},</strong></p>
            <p>Your academic verification request has been successfully submitted and is now being processed.</p>
            
            <div class="verification-details">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #2563eb;">Verification Details</h3>
                <span class="status-badge">⏳ In Progress</span>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Reference Number:</div>
                <div class="detail-value">
                  <strong style="color: #2563eb; font-size: 16px;">${referenceNumber}</strong>
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Institution:</div>
                <div class="detail-value">${institution.name}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Course/Program:</div>
                <div class="detail-value">${courseName}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Degree Type:</div>
                <div class="detail-value">${degreeType}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Graduation Year:</div>
                <div class="detail-value">${graduationYear}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Verification Fee:</div>
                <div class="detail-value">$${verificationFee}</div>
              </div>
            </div>
            
            <div class="timeline">
              <h3 style="color: #2563eb; margin-top: 0;">⏰ Processing Timeline</h3>
              
              <div class="timeline-item">
                <div class="timeline-icon">1</div>
                <div class="timeline-content">
                  <strong>Request Submitted</strong>
                  <p style="margin: 5px 0 0; color: #6b7280;">Today - Verification request received</p>
                </div>
              </div>
              
              <div class="timeline-item">
                <div class="timeline-icon">2</div>
                <div class="timeline-content">
                  <strong>Document Review</strong>
                  <p style="margin: 5px 0 0; color: #6b7280;">Verifying submitted documents</p>
                </div>
              </div>
              
              <div class="timeline-item">
                <div class="timeline-icon">3</div>
                <div class="timeline-content">
                  <strong>Institution Contact</strong>
                  <p style="margin: 5px 0 0; color: #6b7280;">Contacting ${institution.name} for verification</p>
                </div>
              </div>
              
              <div class="timeline-item">
                <div class="timeline-icon">4</div>
                <div class="timeline-content">
                  <strong>Completion</strong>
                  <p style="margin: 5px 0 0; color: #6b7280;">
                    <strong>Expected completion:</strong> ${completionDate || `Within ${processingTime}`}
                  </p>
                </div>
              </div>
            </div>
            
            <div class="important-note">
              <strong>ℹ️ Important Information:</strong>
              <ul style="margin: 10px 0 0; padding-left: 20px;">
                <li>Keep your reference number (${referenceNumber}) for all inquiries</li>
                <li>You will receive email updates on your verification status</li>
                <li>Contact support if you need to provide additional information</li>
                <li>Processing time is an estimate and may vary</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard" 
                 class="button">
                📊 Track Your Verification
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              You can track the status of your verification anytime from your dashboard.
              We'll notify you via email when there are updates.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px;">
              <strong>Need Help?</strong><br>
              Contact our support team: ${process.env.SUPPORT_EMAIL || 'support@hakika.com'}
            </p>
            <p style="margin: 0; font-size: 12px;">
              &copy; ${new Date().getFullYear()} Hakika - Academic Verification Platform. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Hakika Academic Verification" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: subject,
      html: html,
      replyTo: process.env.SUPPORT_EMAIL || 'support@hakika.com'
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification request email sent to ${userEmail}. Message ID: ${info.messageId}`);
      console.log(`📧 Email preview: ${nodemailer.getTestMessageUrl(info)}`);
      return info;
    } catch (error) {
      console.error('❌ Error sending verification request email:', error);
      // Don't throw the error - we don't want email failure to break verification
      return null;
    }
  }

  // Also fix the bug in sendPasswordChangedEmail method
  async sendPasswordChangedEmail(to, userName) {
    const subject = 'Your Hakika Password Has Been Changed';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Hakika</h1>
            <p>Academic Verification Platform</p>
          </div>
          <div class="content">
            <h2>Password Changed Successfully</h2>
            <p>Hello ${userName},</p>
            <p>Your Hakika account password has been successfully changed.</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Hakika. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html
    };

    return await this.transporter.sendMail(mailOptions); // Fixed: was `await this.transporter.sendMail(to, subject, html)`
  }

}

module.exports = EmailService;
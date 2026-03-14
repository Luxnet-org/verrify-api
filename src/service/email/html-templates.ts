/**
 * HTML email templates for Resend provider.
 * Each function returns a complete HTML email string with the shared layout.
 */

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapInLayout(contentHtml: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verrify Notification</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body, p, h1, h2, h3, h4, h5, h6, ul, ol, li, a {
      margin: 0; padding: 0;
      font-family: 'Inter', Arial, sans-serif;
      color: #333333;
    }
    body {
      background-color: #F3F4F6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table { border-spacing: 0; border-collapse: collapse; width: 100%; }
    .email-wrapper { width: 100%; background-color: #F3F4F6; padding: 40px 0; }
    .email-container {
      max-width: 600px; margin: 0 auto; background-color: #ffffff;
      border-radius: 12px; overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
    }
    .header { text-align: center; padding: 40px 20px; background-color: #111827; }
    .logo { max-width: 150px; height: auto; }
    .logo-text {
      font-size: 24px; font-weight: 700; color: #111827;
      display: inline-flex; align-items: center; gap: 8px; text-decoration: none;
    }
    .content { padding: 40px; text-align: left; }
    .hero-illustration {
      background-color: #111827; border-radius: 12px; padding: 40px 20px;
      text-align: center; margin-bottom: 30px;
    }
    .hero-image { max-width: 180px; height: auto; }
    h1 {
      font-size: 24px; font-weight: 700; margin-bottom: 30px;
      color: #111827; text-align: center;
    }
    p { font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #4B5563; }
    .btn {
      display: inline-block; padding: 14px 32px;
      background: linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%);
      color: #ffffff !important; text-decoration: none; border-radius: 8px;
      font-weight: 600; text-align: center; margin: 20px 0;
      box-shadow: 0 4px 14px 0 rgba(124,58,237,0.4);
    }
    .otp-code {
      font-size: 32px; font-weight: 700; letter-spacing: 4px; color: #111827;
      background-color: #F9FAFB; padding: 20px; border-radius: 8px;
      text-align: center; margin: 20px 0; border: 1px dashed #D1D5DB;
    }
    .footer {
      background-color: #ffffff; padding: 30px 40px;
      text-align: center; border-top: 1px solid #E5E7EB;
    }
    .social-links { margin-bottom: 20px; }
    .social-icon { display: inline-block; margin: 0 10px; text-decoration: none; }
    .footer-links { font-size: 12px; color: #9CA3AF; margin-bottom: 15px; }
    .footer-links a { color: #6B7280; text-decoration: none; margin: 0 8px; }
    .copyright { font-size: 12px; color: #9CA3AF; }
    @media screen and (max-width: 600px) {
      .content { padding: 20px; }
      .header { padding: 20px; }
      h1 { font-size: 20px; }
      .btn { width: 100%; box-sizing: border-box; }
    }
  </style>
</head>
<body>
  <table class="email-wrapper"><tr><td align="center">
    <table class="email-container">
      <tr><td class="header">
        <a class="logo-text" href="#">
          <img src="https://res.cloudinary.com/dj7reukeb/image/upload/v1770549817/Veriffy_qggazo.png" alt="Logo Icon" style="vertical-align:middle;margin-right:8px;border-radius:4px;max-width:154px;height:auto;">
        </a>
      </td></tr>
      <tr><td class="content">
        ${contentHtml}
      </td></tr>
      <tr><td class="footer">
        <div class="social-links">
          <a class="social-icon" href="#"><img src="https://img.icons8.com/ios-filled/50/000000/facebook-new.png" alt="Facebook" width="24"></a>
          <a class="social-icon" href="https://x.com/verrify_?s=21"><img src="https://img.icons8.com/ios-filled/50/000000/twitterx--v1.png" alt="Twitter" width="24"></a>
          <a class="social-icon" href="https://www.instagram.com/ver.rify?igsh=MWNiNWd2czIxaTJ2NA%3D%3D&utm_source=qr"><img src="https://img.icons8.com/ios-filled/50/000000/instagram-new.png" alt="Instagram" width="24"></a>
          <a class="social-icon" href="https://www.linkedin.com/company/verrify/"><img src="https://img.icons8.com/ios-filled/50/000000/linkedin.png" alt="LinkedIn" width="24"></a>
        </div>
        <div class="footer-links">
          <a href="#">Help</a> | <a href="#">Contact Us</a> | <a href="#">Terms</a> | <a href="#">Privacy</a> | <a href="#">Unsubscribe</a>
        </div>
        <p class="copyright">&copy; ${year} Verrify Inc. All rights reserved</p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

// ─── 1. Account Verification (OTP) ──────────────────────────────────────────
export function accountVerificationTemplate(ctx: Record<string, any>): string {
  const username = escapeHtml(ctx.username || 'User');
  const token = escapeHtml(ctx.token || '');
  return wrapInLayout(`
    <h1>Your one-time verification code</h1>
    <div class="hero-illustration" style="background-color:#111827;padding:40px;border-radius:12px;margin-bottom:24px;text-align:center;">
      <img src="https://res.cloudinary.com/dj7reukeb/image/upload/v1770549816/Frame_2147228598_3_kci20a.png" alt="Verification Lock" style="display:inline-block;max-width:100%;height:auto;">
    </div>
    <p style="text-align:center;color:#6B7280;margin-bottom:8px;">Dear ${username},</p>
    <p style="text-align:center;">Use the following One-Time Password (OTP) to verify your email address.</p>
    <div style="text-align:center;margin:30px 0;">
      <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:5px;color:#111827;">${token}</span>
    </div>
    <p style="text-align:center;font-size:14px;color:#9CA3AF;">This code is valid for 10 minutes.</p>
    <hr style="border:0;border-top:1px solid #E5E7EB;margin:24px 0;">
    <p style="font-size:14px;color:#6B7280;text-align:center;">If you did not request this code, please ignore this email or contact support.</p>
    <p style="text-align:center;margin-top:30px;">Best regards,<br><strong>Verrify Team</strong></p>
  `);
}

// ─── 2. Signup Confirmation ─────────────────────────────────────────────────
export function signupConfirmationTemplate(ctx: Record<string, any>): string {
  const name = escapeHtml(ctx.name || 'Valued User');
  const actionUrl = ctx.actionUrl || '#';
  return wrapInLayout(`
    <h1>Welcome! Your account is ready</h1>
    <div class="hero-illustration" style="text-align:center;">
      <img src="https://res.cloudinary.com/dj7reukeb/image/upload/v1770549817/Frame_2147228600_dcdoe7.png" alt="Welcome Illustration" style="display:inline-block;max-width:100%;height:auto;">
    </div>
    <p style="text-align:center;color:#6B7280;font-size:18px;margin-bottom:24px;">Dear ${name},</p>
    <p style="text-align:center;margin-bottom:30px;">We're excited to have you on board! Your account has been successfully created and you're all set to get started. Expect premium features, secure transactions, and a community of trusted professionals.</p>
    <div style="text-align:center;"><a class="btn" href="${escapeHtml(actionUrl)}">Go to My Dashboard</a></div>
    <p style="text-align:center;margin-top:30px;font-size:14px;color:#9CA3AF;">If the button above doesn't work, copy and paste this link into your browser:<br><a href="${escapeHtml(actionUrl)}" style="color:#4F46E5;">${escapeHtml(actionUrl)}</a></p>
    <p style="text-align:center;margin-top:40px;">Best regards,<br><strong>The Verrify Team</strong></p>
  `);
}

// ─── 3. Reset Password ─────────────────────────────────────────────────────
export function resetPasswordTemplate(ctx: Record<string, any>): string {
  const name = escapeHtml(ctx.name || 'User');
  const resetLink = ctx.resetLink || '#';
  return wrapInLayout(`
    <h1>Reset your password</h1>
    <div class="hero-illustration" style="text-align:center;margin-bottom:24px;">
      <img src="https://res.cloudinary.com/dj7reukeb/image/upload/v1770549816/Frame_2147228598_2_bmvatt.png" alt="Security Lock" style="display:inline-block;max-width:100%;height:auto;">
    </div>
    <p style="text-align:center;color:#6B7280;font-size:16px;">Hi ${name},</p>
    <p style="text-align:center;margin-bottom:30px;">We received a request to reset the password for your account associated with this email address. If you made this request, please click the button below to create a new password.</p>
    <div style="text-align:center;"><a class="btn" href="${escapeHtml(resetLink)}">Reset Password</a></div>
    <p style="text-align:center;margin-top:30px;font-size:14px;color:#9CA3AF;">If you did not request a password reset, you can safely ignore this email. This password reset link is only valid for 24 hours.</p>
    <p style="text-align:center;margin-top:20px;font-size:12px;color:#D1D5DB;">${escapeHtml(resetLink)}</p>
    <hr style="border:0;border-top:1px solid #E5E7EB;margin:30px 0;">
    <p style="text-align:center;"><strong>The Verrify Security Team</strong></p>
  `);
}

// ─── 4. Contact Me Reply (Welcome Email after Website Contact) ──────────────
export function contactRespondTemplate(ctx: Record<string, any>): string {
  const name = escapeHtml(ctx.name || 'User');
  return wrapInLayout(`
    <h1>Welcome to Verrify! Let's Secure Your Property Investment</h1>
    <div class="hero-illustration" style="text-align:center;">
      <img src="https://res.cloudinary.com/dj7reukeb/image/upload/v1770549817/Frame_2147228600_dcdoe7.png" alt="Welcome to Verrify" style="display:inline-block;max-width:100%;height:auto;">
    </div>
    <p style="text-align:center;font-size:16px;margin-bottom:24px;">Dear ${name},</p>
    <p style="text-align:center;margin-bottom:30px;">Thank you for reaching out to Verrify! We're glad you're taking this important step toward confirming property ownership.</p>
    <p style="text-align:center;margin-bottom:16px;font-weight:600;">To help us prepare for our conversation, please take 2 minutes to fill out this quick form:</p>
    <div style="text-align:center;margin-bottom:30px;"><a class="btn" href="https://forms.gle/DA4L2uxaQHM5HTdb6">Verrify Property Verification Request</a></div>
    <p style="text-align:center;margin-bottom:16px;font-weight:600;">Once you've done that, pick a time that works for you and let's talk:</p>
    <div style="text-align:center;margin-bottom:30px;"><a class="btn" href="http://calendly.com/verrifyproperties">Book a Call on Calendly</a></div>
    <p style="text-align:center;margin-bottom:30px;">On the call, we'll learn about your property, answer your questions, and walk you through how we can help.</p>
    <p style="text-align:center;margin-bottom:4px;">Talk soon,</p>
    <p style="text-align:center;font-weight:600;margin-bottom:4px;">Ifunanya Anazonwu</p>
    <p style="text-align:center;"><strong>The Verrify Team</strong></p>
    <hr style="border:0;border-top:1px solid #E5E7EB;margin:30px 0;">
    <p style="text-align:center;font-size:14px;color:#9CA3AF;">Website: <a href="https://www.verrify.io" style="color:#4F46E5;">verrify.io</a> | Follow us: <a href="https://www.instagram.com/ver.rify?igsh=MWNiNWd2czIxaTJ2NA%3D%3D&utm_source=qr" style="color:#4F46E5;">Instagram</a> | <a href="https://x.com/verrify_?s=21" style="color:#4F46E5;">X</a> | <a href="https://www.linkedin.com/company/verrify/" style="color:#4F46E5;">LinkedIn</a></p>
  `);
}

// ─── 5. Contact Admin Request ───────────────────────────────────────────────
export function contactAdminTemplate(ctx: Record<string, any>): string {
  const senderName = escapeHtml(ctx.senderName || '');
  const senderEmail = escapeHtml(ctx.senderEmail || '');
  const subject = escapeHtml(ctx.subject || '');
  const message = escapeHtml(ctx.message || '');
  const adminResponseLink = ctx.adminResponseLink || '#';
  return wrapInLayout(`
    <h1>New Contact Request</h1>
    <div class="hero-illustration">
      <img src="https://placehold.co/120x120/111827/FFFFFF/png?text=Support&font=roboto" alt="New Contact Request" style="display:inline-block;">
    </div>
    <p style="text-align:center;font-size:16px;font-weight:700;">Hello Admin,</p>
    <p style="text-align:center;margin-bottom:24px;">You have received a new message from the contact form.</p>
    <table style="width:100%;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:12px;background:#F9FAFB;font-weight:600;width:30%;border-bottom:1px solid #E5E7EB;">From</td>
        <td style="padding:12px;border-bottom:1px solid #E5E7EB;">${senderName} (${senderEmail})</td>
      </tr>
      <tr>
        <td style="padding:12px;background:#F9FAFB;font-weight:600;border-bottom:1px solid #E5E7EB;">Subject</td>
        <td style="padding:12px;border-bottom:1px solid #E5E7EB;">${subject}</td>
      </tr>
      <tr>
        <td style="padding:12px;background:#F9FAFB;font-weight:600;">Message</td>
        <td style="padding:12px;">${message}</td>
      </tr>
    </table>
    <div style="text-align:center;"><a class="btn" href="${escapeHtml(adminResponseLink)}">Respond in Dashboard</a></div>
    <p style="text-align:center;font-size:12px;color:#9CA3AF;margin-top:30px;">This is an automated notification.</p>
  `);
}

// ─── 6. Company Verified ────────────────────────────────────────────────────
export function companyVerifiedTemplate(ctx: Record<string, any>): string {
  const name = escapeHtml(ctx.name || 'User');
  const companyName = escapeHtml(ctx.companyName || '');
  const dashboardLink = ctx.dashboardLink || '#';
  return wrapInLayout(`
    <h1>Company Verification Successful!</h1>
    <div class="hero-illustration" style="text-align:center;">
      <img src="https://res.cloudinary.com/dj7reukeb/image/upload/v1770549816/Frame_2147228599_ktlbik.png" alt="Verified Checkmark" style="display:inline-block;max-width:100%;height:auto;">
    </div>
    <p style="text-align:center;font-size:18px;color:#10B981;">Great news, ${name}!</p>
    <p style="text-align:center;margin-bottom:24px;">Your company, <strong>${companyName}</strong>, has been successfully verified on Verrify. You now have full access to all employer features and can start posting jobs immediately.</p>
    <div style="text-align:center;"><a class="btn" href="${escapeHtml(dashboardLink)}">Go to Dashboard</a></div>
    <p style="text-align:center;margin-top:30px;">If you have any questions, our support team is here to help.</p>
    <p style="text-align:center;"><strong>The Verrify Team</strong></p>
  `);
}

// ─── 7. Company Rejected ────────────────────────────────────────────────────
export function companyRejectedTemplate(ctx: Record<string, any>): string {
  const name = escapeHtml(ctx.name || 'User');
  const companyName = escapeHtml(ctx.companyName || '');
  const rejectionReason = escapeHtml(ctx.rejectionReason || '');
  const dashboardLink = ctx.dashboardLink || '#';
  return wrapInLayout(`
    <h1>Verification Update - Action Required</h1>
    <div class="hero-illustration">
      <img src="https://res.cloudinary.com/dj7reukeb/image/upload/v1770549816/Frame_2147228599_ktlbik.png" alt="Action Required" style="display:inline-block;">
    </div>
    <p style="text-align:center;font-size:16px;color:#DC2626;">Attention ${name},</p>
    <p style="text-align:center;margin-bottom:24px;">Unfortunately, we were unable to verify your company <strong>${companyName}</strong> at this time. The reason provided is:<br><strong>${rejectionReason}</strong></p>
    <p style="text-align:center;">Please review the requirements and ensure all submitted documents are clear and valid. You can resubmit your verification request from your dashboard.</p>
    <div style="text-align:center;"><a class="btn" href="${escapeHtml(dashboardLink)}">Go to Dashboard and Fix</a></div>
    <p style="text-align:center;margin-top:30px;">If you believe this is an error, please contact our support team.</p>
    <p style="text-align:center;"><strong>The Verrify Review Team</strong></p>
  `);
}

// ─── 8. Property Verified ───────────────────────────────────────────────────
export function propertyVerifiedTemplate(ctx: Record<string, any>): string {
  const name = escapeHtml(ctx.name || 'User');
  const propertyName = escapeHtml(ctx.propertyName || '');
  const location = escapeHtml(ctx.location || '');
  const listingLink = ctx.listingLink || '#';
  return wrapInLayout(`
    <h1>Property Verification Successful!</h1>
    <div class="hero-illustration" style="text-align:center;">
      <img src="https://res.cloudinary.com/dj7reukeb/image/upload/v1770549816/Frame_2147228598_1_hrlb5r.png" alt="Property Checkmark" style="display:inline-block;max-width:100%;height:auto;">
    </div>
    <p style="text-align:center;font-size:18px;color:#10B981;">Congratulations, ${name}!</p>
    <p style="text-align:center;margin-bottom:24px;">Your property, <strong>${propertyName}</strong>, located at <em>${location}</em>, has been successfully verified. It is now listed and available for guests to book with full trust.</p>
    <div style="text-align:center;"><a class="btn" href="${escapeHtml(listingLink)}">View My Listing</a></div>
    <p style="text-align:center;margin-top:30px;">This verification adds a 'Verified' badge to your property, increasing visibility and trust.</p>
    <p style="text-align:center;"><strong>The Verrify Team</strong></p>
  `);
}

// ─── 9. Property Rejected ───────────────────────────────────────────────────
export function propertyRejectedTemplate(ctx: Record<string, any>): string {
  const name = escapeHtml(ctx.name || 'User');
  const propertyName = escapeHtml(ctx.propertyName || '');
  const rejectionReason = escapeHtml(ctx.rejectionReason || '');
  const dashboardLink = ctx.dashboardLink || '#';
  return wrapInLayout(`
    <h1>Verification Update - Property Rejected</h1>
    <div class="hero-illustration">
      <img src="https://res.cloudinary.com/dj7reukeb/image/upload/v1770549816/Frame_2147228598_1_hrlb5r.png" alt="Action Required" style="display:inline-block;">
    </div>
    <p style="text-align:center;font-size:16px;color:#DC2626;">Attention ${name},</p>
    <p style="text-align:center;margin-bottom:24px;">We were unable to verify your property, <strong>${propertyName}</strong>.<br>The reason for this decision is:<br><strong style="color:#B91C1C;">${rejectionReason}</strong></p>
    <p style="text-align:center;">Common reasons include missing documents, incorrect location data, or poor image quality. Ensure all details are accurate before resubmitting.</p>
    <div style="text-align:center;"><a class="btn" href="${escapeHtml(dashboardLink)}">Resubmit Property Verification</a></div>
    <p style="text-align:center;margin-top:30px;">If you need assistance correcting these issues, please consult the help center or contact support.</p>
    <p style="text-align:center;"><strong>The Verrify Review Team</strong></p>
  `);
}

// ─── 10. Verification Pipeline Update ────────────────────────────────────────
export function verificationPipelineUpdateTemplate(ctx: Record<string, any>): string {
  const firstName = escapeHtml(ctx.firstName || 'User');
  const message = escapeHtml(ctx.message || '');
  const comments = ctx.comments ? escapeHtml(ctx.comments) : null;
  const attachments = ctx.attachments as Array<{ path?: string; filename?: string }> | undefined;

  let commentsHtml = '';
  if (comments) {
    commentsHtml = `
    <div style="background-color:#F3F4F6;padding:15px;border-radius:8px;margin:20px auto;max-width:500px;">
      <p style="margin:0;font-weight:bold;color:#374151;font-size:14px;">Admin Comments:</p>
      <p style="margin:5px 0 0 0;color:#4B5563;font-size:14px;">${comments}</p>
    </div>`;
  }

  let attachmentsHtml = '';
  if (attachments && attachments.length > 0) {
    const listItems = attachments
      .map(
        (f) =>
          `<li><a href="${escapeHtml(f.path || '#')}" target="_blank" style="color:#2563EB;text-decoration:underline;">${escapeHtml(f.filename || 'View Document')}</a></li>`,
      )
      .join('');
    attachmentsHtml = `
    <div style="margin:20px auto;max-width:500px;">
      <p style="font-weight:bold;color:#374151;font-size:14px;">Attached Documents:</p>
      <ul style="padding-left:20px;color:#4B5563;font-size:14px;">${listItems}</ul>
    </div>`;
  }

  return wrapInLayout(`
    <h1>Property Verification Update</h1>
    <div class="hero-illustration" style="text-align:center;margin-bottom:20px;">
      <img src="https://res.cloudinary.com/dj7reukeb/image/upload/v1770549816/Frame_2147228598_1_hrlb5r.png" alt="Notification" style="display:inline-block;max-width:100%;height:auto;">
    </div>
    <p style="text-align:center;font-size:18px;">Hello, ${firstName}!</p>
    <p style="text-align:center;margin-bottom:24px;">${message}</p>
    ${commentsHtml}
    ${attachmentsHtml}
    <p style="text-align:center;margin-top:30px;">You can log in to your dashboard at any time to check the full details of your verification requests and manage your properties.</p>
    <p style="text-align:center;margin-top:30px;"><strong>The Verrify Team</strong></p>
  `);
}

// ─── 11. Payment Receipt ────────────────────────────────────────────────────
export function paymentReceiptTemplate(ctx: Record<string, any>): string {
  const firstName = escapeHtml(ctx.firstName || '');
  const orderId = escapeHtml(ctx.orderId || '');
  const reference = escapeHtml(ctx.reference || '');
  const date = escapeHtml(ctx.date || '');
  const description = escapeHtml(ctx.description || '');
  const amountFormatted = escapeHtml(ctx.amountFormatted || '');
  const dashboardUrl = ctx.dashboardUrl || '#';
  return wrapInLayout(`
    <div style="padding:20px;font-family:'Inter',sans-serif;color:#333;">
      <h2 style="color:#000;font-size:24px;font-weight:600;margin-bottom:20px;">Payment Receipt</h2>
      <p style="font-size:16px;margin-bottom:15px;">Hello ${firstName},</p>
      <p style="font-size:16px;margin-bottom:25px;">Thank you for your payment! This email serves as your receipt for your recent transaction with Verrify.</p>
      <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:30px;">
        <h3 style="font-size:18px;margin-top:0;margin-bottom:15px;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:10px;">Transaction Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;">Order ID:</td>
            <td style="padding:8px 0;color:#111827;font-weight:500;text-align:right;font-size:14px;">${orderId}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;">Reference:</td>
            <td style="padding:8px 0;color:#111827;font-weight:500;text-align:right;font-size:14px;">${reference}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;">Date:</td>
            <td style="padding:8px 0;color:#111827;font-weight:500;text-align:right;font-size:14px;">${date}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;">Item:</td>
            <td style="padding:8px 0;color:#111827;font-weight:500;text-align:right;font-size:14px;">${description}</td>
          </tr>
          <tr>
            <td style="padding:12px 0 8px 0;color:#111827;font-size:16px;font-weight:600;border-top:1px solid #e5e7eb;">Total Paid:</td>
            <td style="padding:12px 0 8px 0;color:#111827;font-weight:700;text-align:right;font-size:18px;border-top:1px solid #e5e7eb;">${amountFormatted}</td>
          </tr>
        </table>
      </div>
      <p style="font-size:14px;color:#6b7280;margin-bottom:10px;">You can view the full details of your transaction on your Verrify dashboard.</p>
      <div style="margin-top:30px;text-align:center;">
        <a href="${escapeHtml(dashboardUrl)}" style="background-color:#000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;font-size:14px;display:inline-block;">View Dashboard</a>
      </div>
      <p style="font-size:14px;color:#6b7280;margin-top:40px;">If you have any questions or concerns about this payment, please reply to this email or contact support.</p>
    </div>
  `);
}

/**
 * Maps template name (as used by the SMTP/Pug path) to an HTML template function.
 */
export const TEMPLATE_MAP: Record<string, (ctx: Record<string, any>) => string> = {
  'account-verification-email-template': accountVerificationTemplate,
  'signup-confirmation-email-template': signupConfirmationTemplate,
  'reset-password-email-template': resetPasswordTemplate,
  'contact-respond-email-template': contactRespondTemplate,
  'contact-admin-email-template': contactAdminTemplate,
  'company-verified-email-template': companyVerifiedTemplate,
  'company-rejected-email-template': companyRejectedTemplate,
  'property-verified-email-template': propertyVerifiedTemplate,
  'property-rejected-email-template': propertyRejectedTemplate,
  'verification-pipeline-update-email-template': verificationPipelineUpdateTemplate,
  'payment-receipt-email-template': paymentReceiptTemplate,
};

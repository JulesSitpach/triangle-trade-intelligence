import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set in environment variables');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email using Resend
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.from - Sender email (optional)
 * @returns {Promise<Object>} Resend response
 */
export async function sendEmail({ to, subject, html, from }) {
  const fromEmail = from || process.env.EMAIL_FROM || 'noreply@tradeflow-intelligence.com';

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    });

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(user) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Triangle Trade Intelligence</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #134169 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Welcome to Triangle Trade Intelligence</h1>
              <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 16px;">USMCA Compliance Platform</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello ${user.full_name || user.company_name || 'there'},
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for joining Triangle Trade Intelligence! We're excited to help you optimize your USMCA compliance and maximize tariff savings.
              </p>

              <h2 style="margin: 30px 0 15px; color: #134169; font-size: 20px; font-weight: 600;">Get Started:</h2>

              <ul style="margin: 0 0 25px; padding-left: 20px; color: #333333; font-size: 16px; line-height: 1.8;">
                <li>Run your first USMCA analysis to see potential savings</li>
                <li>Set up trade alerts for your products</li>
                <li>Explore professional services for expert support</li>
                <li>Complete your profile for personalized recommendations</li>
              </ul>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 6px; background-color: #2563eb;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/usmca-workflow" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      Start Your Analysis
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 25px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Need help? Our team is here to assist you. Reply to this email or visit our support center.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                © ${new Date().getFullYear()} Triangle Trade Intelligence. All rights reserved.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Professional trade compliance platform for enterprise clients.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await sendEmail({
    to: user.email,
    subject: 'Welcome to Triangle Trade Intelligence - Let\'s Get Started!',
    html
  });
}

/**
 * Send certificate generation notification
 */
export async function sendCertificateEmail(user, certificate) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your USMCA Certificate is Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 15px;">✓</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Certificate Ready!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello ${user.full_name || user.company_name || 'there'},
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Great news! Your USMCA certificate has been generated and is ready for download.
              </p>

              <div style="background-color: #f8f9fa; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 10px; color: #134169; font-size: 18px;">Certificate Details:</h3>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Company:</strong> ${certificate.company}</p>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Product:</strong> ${certificate.product}</p>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Status:</strong> ${certificate.qualification_status}</p>
              </div>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 6px; background-color: #2563eb;">
                    <a href="${certificate.certificate_url || process.env.NEXT_PUBLIC_APP_URL + '/certificates'}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      View Certificate
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 25px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Your certificate has been saved to your library and is available for download anytime.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                © ${new Date().getFullYear()} Triangle Trade Intelligence. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await sendEmail({
    to: user.email,
    subject: 'Your USMCA Certificate is Ready - Triangle Trade Intelligence',
    html
  });
}

/**
 * Send service purchase confirmation
 */
export async function sendServiceConfirmationEmail(user, service) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Purchase Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #134169 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Service Purchase Confirmed</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello ${user.full_name || user.company_name || 'there'},
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for your purchase! We've received your request for professional services and our team will begin working on it shortly.
              </p>

              <div style="background-color: #f8f9fa; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; color: #134169; font-size: 18px;">Service Details:</h3>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Service:</strong> ${service.type}</p>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Price:</strong> $${service.price}</p>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Status:</strong> ${service.status}</p>
              </div>

              <h3 style="margin: 30px 0 15px; color: #134169; font-size: 18px;">What's Next?</h3>

              <ul style="margin: 0 0 25px; padding-left: 20px; color: #333333; font-size: 16px; line-height: 1.8;">
                <li>Our team will review your request within 24 hours</li>
                <li>You'll receive updates via email as we progress</li>
                <li>Final deliverables will be available in your dashboard</li>
              </ul>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 6px; background-color: #2563eb;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      View Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 25px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Questions? Our team is here to help. Reply to this email or contact support.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                © ${new Date().getFullYear()} Triangle Trade Intelligence. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await sendEmail({
    to: user.email,
    subject: `Service Purchase Confirmed: ${service.type} - Triangle Trade Intelligence`,
    html
  });
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionEmail(user, subscription) {
  const tierNames = {
    professional: 'Professional',
    business: 'Business',
    enterprise: 'Enterprise'
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Activated</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Welcome to ${tierNames[subscription.tier] || 'Premium'}!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello ${user.full_name || user.company_name || 'there'},
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Your ${tierNames[subscription.tier] || 'Premium'} subscription has been activated! You now have access to all premium features.
              </p>

              <div style="background-color: #f8f9fa; border-left: 4px solid #7c3aed; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; color: #134169; font-size: 18px;">Subscription Details:</h3>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Plan:</strong> ${tierNames[subscription.tier] || 'Premium'}</p>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Billing:</strong> ${subscription.billing_period}</p>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Status:</strong> Active</p>
              </div>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 6px; background-color: #7c3aed;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      Get Started
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                © ${new Date().getFullYear()} Triangle Trade Intelligence. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await sendEmail({
    to: user.email,
    subject: `Welcome to ${tierNames[subscription.tier]} - Triangle Trade Intelligence`,
    html
  });
}

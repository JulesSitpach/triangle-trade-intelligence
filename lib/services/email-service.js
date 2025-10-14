import nodemailer from 'nodemailer';

/**
 * Email Service for Triangle Intelligence Platform
 * Handles customer confirmations and admin notifications
 */

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

/**
 * Send service request confirmation email to customer
 */
export async function sendCustomerConfirmationEmail({
  customerEmail,
  companyName,
  serviceName,
  serviceType,
  price,
  orderId
}) {
  const mailOptions = {
    from: `"Triangle Trade Intelligence" <${process.env.GMAIL_USER}>`,
    to: customerEmail,
    subject: `Service Confirmation: ${serviceName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #134169; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .order-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #134169; }
          .steps { margin: 20px 0; }
          .step { margin: 15px 0; padding-left: 10px; }
          .step strong { color: #134169; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .cta-button { display: inline-block; background: #134169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✓ Payment Confirmed</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your service request</p>
          </div>

          <div class="content">
            <p>Hello ${companyName},</p>

            <p>Your payment has been successfully processed! Our expert team has been notified and will begin working on your service request within 24 hours.</p>

            <div class="order-box">
              <h3 style="margin-top: 0; color: #134169;">Order Details</h3>
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span>${serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Price:</span>
                <span>$${price}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span>Pending Expert Review</span>
              </div>
              <div class="detail-row" style="border-bottom: none;">
                <span class="detail-label">Order ID:</span>
                <span>${orderId}</span>
              </div>
            </div>

            <h3 style="color: #134169;">What Happens Next?</h3>
            <div class="steps">
              <div class="step">
                <strong>1. Expert Assignment:</strong> Our team has been notified and will begin your service within 24 hours
              </div>
              <div class="step">
                <strong>2. Service Delivery:</strong> Receive your completed deliverable within 5-7 business days via email
              </div>
              <div class="step">
                <strong>3. Questions?</strong> Reply to this email or contact support@triangleintelligence.com
              </div>
            </div>

            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f0f9ff; border-radius: 8px;">
              <h4 style="margin-top: 0; color: #134169;">💡 Want to save 15-25% on future services?</h4>
              <p style="margin: 10px 0;">Subscribe to our Professional ($299/mo) or Premium ($599/mo) plan for automatic discounts plus unlimited USMCA analysis.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" class="cta-button">View Pricing Plans</a>
            </div>

            <div class="footer">
              <p><strong>Triangle Trade Intelligence</strong><br/>
              USMCA Compliance & Mexico Trade Bridge<br/>
              <a href="mailto:support@triangleintelligence.com">support@triangleintelligence.com</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Customer confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send customer confirmation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send admin notification email to team
 */
export async function sendAdminNotificationEmail({
  serviceName,
  serviceType,
  companyName,
  customerEmail,
  price,
  orderId,
  subscriberData
}) {
  const adminEmail = 'triangleintel@gmail.com'; // Admin team email

  const mailOptions = {
    from: `"Triangle Platform" <${process.env.GMAIL_USER}>`,
    to: adminEmail,
    subject: `🔔 New Service Request: ${serviceName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626; }
          .detail-row { padding: 8px 0; }
          .detail-label { font-weight: 600; color: #dc2626; display: inline-block; min-width: 150px; }
          .cta-button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔔 New Service Request</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Payment Confirmed - Action Required</p>
          </div>

          <div class="content">
            <h3 style="color: #dc2626;">Service Request Details</h3>

            <div class="info-box">
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span>${serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Company:</span>
                <span>${companyName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer Email:</span>
                <span>${customerEmail}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Price Paid:</span>
                <span>$${price}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span>${orderId}</span>
              </div>
            </div>

            ${subscriberData?.product_description ? `
            <h4 style="color: #dc2626;">Product Information</h4>
            <div class="info-box">
              <div class="detail-row">
                <span class="detail-label">Product:</span>
                <span>${subscriberData.product_description}</span>
              </div>
              ${subscriberData.business_type ? `
              <div class="detail-row">
                <span class="detail-label">Business Type:</span>
                <span>${subscriberData.business_type}</span>
              </div>
              ` : ''}
              ${subscriberData.trade_volume ? `
              <div class="detail-row">
                <span class="detail-label">Trade Volume:</span>
                <span>$${subscriberData.trade_volume}</span>
              </div>
              ` : ''}
            </div>
            ` : ''}

            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #fef2f2; border-radius: 8px;">
              <h4 style="margin-top: 0; color: #dc2626;">⏰ Action Required</h4>
              <p>A new service request is awaiting expert review. Please log in to the admin dashboard to begin processing.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/broker-dashboard" class="cta-button">Open Admin Dashboard</a>
            </div>

            <p style="margin-top: 30px; color: #6b7280; font-size: 14px; text-align: center;">
              This is an automated notification from the Triangle Intelligence Platform
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Admin notification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send admin notification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify email service configuration
 */
export async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
    return false;
  }
}

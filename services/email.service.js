import nodemailer from 'nodemailer';

// ── Create email transporter ──────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// ── Send order confirmation email ─────────────────────────────────────────────
const sendOrderConfirmation = async (order, customerEmail, customerName) => {
  try {
    // Ensure we have customer data
    if (!order || !order.customer) {
      throw new Error('Order or customer data is missing');
    }

    const itemsHTML = order.items
      .map(
        item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title || item.productId}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString()}</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #735c00 0%, #b39d00 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .order-info { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .label { font-weight: bold; color: #735c00; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f0f0f0; padding: 10px; text-align: left; font-weight: bold; }
          .total { font-weight: bold; font-size: 18px; color: #735c00; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Shree Collection</h1>
            <p>Order Confirmation</p>
          </div>

          <div class="content">
            <h2>Thank you for your purchase, ${customerName}!</h2>
            <p>We're excited to ship your beautiful jewelry piece to you.</p>

            <div class="order-info">
              <p><span class="label">Order ID:</span> ${order._id}</p>
              <p><span class="label">Order Date:</span> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><span class="label">Status:</span> ${order.orderStatus || 'Pending'}</p>
            </div>

            <h3>Order Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <div class="order-info">
              <p><span class="label">Subtotal:</span> ₹${order.subtotal?.toLocaleString()}</p>
              <p><span class="label">Shipping:</span> ${order.shippingCost > 0 ? `₹${order.shippingCost.toLocaleString()}` : 'Complimentary'}</p>
              <p class="total">Total: ₹${order.total?.toLocaleString()}</p>
            </div>

            <h3>Shipping Address</h3>
            <div class="order-info">
              <p>${order.customer.name}</p>
              <p>${order.customer.address.line1}${order.customer.address.line2 ? ', ' + order.customer.address.line2 : ''}</p>
              <p>${order.customer.address.city}, ${order.customer.address.state} ${order.customer.address.pincode}</p>
              <p>Phone: ${order.customer.phone}</p>
            </div>

            <p>We will send you a tracking number once your order ships. If you have any questions, please contact us at ${process.env.MAIL_FROM}.</p>
          </div>

          <div class="footer">
            <p>&copy; 2026 Shree Collection. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: customerEmail,
      subject: `Order Confirmation - Shree Collection - #${order._id}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Order confirmation email sent to ${customerEmail}`);
    return true;
  } catch (error) {
    console.error(`✗ Error sending order confirmation email: ${error.message}`);
    // Don't throw error - don't fail the order if email fails
    return false;
  }
};

// ── Send payment confirmation email ───────────────────────────────────────────
const sendPaymentConfirmation = async (order, customerEmail, customerName) => {
  try {
    // Ensure we have order data
    if (!order) {
      throw new Error('Order data is missing');
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #735c00 0%, #b39d00 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .success-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; }
          .label { font-weight: bold; color: #735c00; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Shree Collection</h1>
            <p>Payment Confirmed</p>
          </div>

          <div class="content">
            <h2>Payment Received!</h2>
            
            <div class="success-box">
              <p style="margin: 0; color: #2e7d32;">✓ Your payment has been successfully processed.</p>
            </div>

            <p><span class="label">Order ID:</span> ${order._id}</p>
            <p><span class="label">Subtotal:</span> ₹${order.subtotal?.toLocaleString()}</p>
            <p><span class="label">Shipping:</span> ${order.shippingCost > 0 ? `₹${order.shippingCost.toLocaleString()}` : 'Complimentary'}</p>
            <p><span class="label">Amount Paid:</span> ₹${order.total?.toLocaleString()}</p>
            <p><span class="label">Transaction ID:</span> ${order.transactionId || 'N/A'}</p>
            <p><span class="label">Payment Status:</span> <strong>Completed</strong></p>

            <h3>What's Next?</h3>
            <ol>
              <li>We will prepare your beautiful jewelry piece with utmost care</li>
              <li>You'll receive a shipping notification with tracking details</li>
              <li>Your order will be delivered to the address provided</li>
            </ol>

            <p>Thank you for choosing Shree Collection. We truly appreciate your business!</p>
          </div>

          <div class="footer">
            <p>&copy; 2026 Shree Collection. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: customerEmail,
      subject: `Payment Confirmed - Shree Collection - #${order._id}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Payment confirmation email sent to ${customerEmail}`);
    return true;
  } catch (error) {
    console.error(`✗ Error sending payment confirmation email: ${error.message}`);
    return false;
  }
};

// ── Send welcome email on registration ───────────────────────────────────────
const sendWelcomeEmail = async (customerEmail, customerName) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #735c00 0%, #b39d00 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .welcome-box { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; border-left: 4px solid #b39d00; }
          .welcome-box h2 { color: #735c00; margin-top: 0; }
          .features-list { list-style: none; padding: 0; }
          .features-list li { padding: 8px 0; color: #555; }
          .features-list li:before { content: "✓ "; color: #b39d00; font-weight: bold; margin-right: 8px; }
          .cta-button { background: linear-gradient(135deg, #735c00 0%, #b39d00 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Shree Collection</h1>
            <p>Welcome to Our Family!</p>
          </div>

          <div class="content">
            <h2>Welcome, ${customerName}!</h2>
            <p>Thank you for creating an account with Shree Collection. We're thrilled to have you join our community of jewelry enthusiasts.</p>

            <div class="welcome-box">
              <h2 style="margin: 0;">What You Can Now Enjoy</h2>
              <ul class="features-list">
                <li>Browse our exclusive collection of fine jewelry</li>
                <li>Save your favorite items for quick checkout</li>
                <li>Track your orders in real-time</li>
                <li>Access special promotions and discounts</li>
                <li>Receive personalized recommendations</li>
              </ul>
            </div>

            <h3>Getting Started</h3>
            <p>Visit our website to explore our stunning collection of diamonds, pearls, emeralds, and more. Each piece is crafted with precision and care.</p>

            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://shree-collection.com'}" class="cta-button">Start Shopping</a>
            </p>

            <h3>Need Help?</h3>
            <p>If you have any questions or need assistance, feel free to reach out to our customer support team at ${process.env.MAIL_FROM}.</p>

            <p>Happy shopping!<br><strong>The Shree Collection Team</strong></p>
          </div>

          <div class="footer">
            <p>&copy; 2026 Shree Collection. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: customerEmail,
      subject: 'Welcome to Shree Collection - Your Account is Ready!',
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Welcome email sent to ${customerEmail}`);
    return true;
  } catch (error) {
    console.error(`✗ Error sending welcome email: ${error.message}`);
    // Don't throw error - don't fail registration if email fails
    return false;
  }
};

// ── Send shipping notification email ──────────────────────────────────────────
const sendShippingNotification = async (order, customerEmail, customerName, trackingNumber) => {
  try {
    // Ensure we have order data
    if (!order) {
      throw new Error('Order data is missing');
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #735c00 0%, #b39d00 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .tracking-box { background: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: center; }
          .tracking-number { font-size: 24px; font-weight: bold; color: #735c00; font-family: monospace; }
          .label { font-weight: bold; color: #735c00; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Shree Collection</h1>
            <p>Your Order is On Its Way!</p>
          </div>

          <div class="content">
            <h2>Great News, ${customerName}!</h2>
            <p>Your order has been shipped and is on its way to you.</p>

            <div class="tracking-box">
              <p style="margin: 0 0 10px;">Tracking Number:</p>
              <div class="tracking-number">${trackingNumber}</div>
            </div>

            <p>You can track your shipment using the tracking number above on the courier's website.</p>

            <h3>Order Details</h3>
            <p><span class="label">Order ID:</span> ${order._id}</p>
            <p><span class="label">Total Amount:</span> ₹${order.total?.toLocaleString()}</p>

            <p>Thank you for choosing Shree Collection. We hope you enjoy your beautiful piece!</p>
          </div>

          <div class="footer">
            <p>&copy; 2026 Shree Collection. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: customerEmail,
      subject: `Your Order Has Shipped - Shree Collection - #${order._id}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Shipping notification email sent to ${customerEmail}`);
    return true;
  } catch (error) {
    console.error(`✗ Error sending shipping notification email: ${error.message}`);
    return false;
  }
};

export {
  sendOrderConfirmation,
  sendPaymentConfirmation,
  sendWelcomeEmail,
  sendShippingNotification,
};

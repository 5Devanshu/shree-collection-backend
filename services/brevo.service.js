// Brevo transactional email service — replaces nodemailer.
// Uses Brevo REST API directly (Node 22 has global fetch, no SDK needed).

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

const sendEmail = async ({ to, subject, html }) => {
  try {
    const res = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key':      process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'accept':       'application/json',
      },
      body: JSON.stringify({
        sender:      { name: process.env.MAIL_FROM_NAME || 'Shree Collection', email: process.env.MAIL_FROM_EMAIL },
        to:          [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Brevo error ${res.status}: ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Brevo send failed:', err.message);
    return false;  // never let email failure break the main flow
  }
};

const shell = (title, inner) => `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2b2b2b">
    <div style="background:#735c00;color:#fff;padding:24px;text-align:center">
      <h1 style="margin:0;font-size:22px;letter-spacing:2px">SHREE COLLECTION</h1>
    </div>
    <div style="padding:28px;background:#faf8f2">
      <h2 style="margin-top:0;font-size:18px">${title}</h2>
      ${inner}
    </div>
    <div style="padding:16px;text-align:center;font-size:12px;color:#888">
      © 2026 Shree Collection · shreecollection.co.in
    </div>
  </div>`;

// ── Customer login OTP ────────────────────────────────────────────────────────
export const sendOtpEmail = (to, otp) =>
  sendEmail({
    to,
    subject: `${otp} is your Shree Collection login code`,
    html: shell('Your Login Code', `
      <p>Use this one-time code to sign in. It expires in <strong>10 minutes</strong>.</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold;text-align:center;
                background:#fff;border:1px solid #e3dcc8;padding:16px;border-radius:6px">${otp}</p>
      <p style="font-size:13px;color:#888">If you didn't request this, you can ignore this email.</p>`),
  });

// ── Reseller registration received ────────────────────────────────────────────
export const sendResellerPendingEmail = (to, name) =>
  sendEmail({
    to,
    subject: 'Reseller application received — Shree Collection',
    html: shell('Application Received', `
      <p>Hi ${name},</p>
      <p>Thank you for applying for a reseller account. Our team will review your details
         and you'll receive a confirmation email once your account is verified.</p>
      <p>You won't be able to log in until verification is complete.</p>`),
  });

// ── Reseller verified ──────────────────────────────────────────────────────────
export const sendResellerVerifiedEmail = (to, name) =>
  sendEmail({
    to,
    subject: 'Your reseller account is verified — Shree Collection',
    html: shell('Account Verified ✓', `
      <p>Hi ${name},</p>
      <p>Your reseller account has been <strong>verified</strong>. You can now log in
         and purchase at your reseller pricing.</p>
      <p style="text-align:center;margin:24px 0">
        <a href="https://shreecollection.co.in/login"
           style="background:#735c00;color:#fff;padding:14px 36px;text-decoration:none;border-radius:4px">
           Log In Now</a></p>`),
  });

// ── Order confirmation (customer purchase) ────────────────────────────────────
export const sendOrderConfirmationEmail = (to, { orderNumber, name, items, total }) =>
  sendEmail({
    to,
    subject: `Order ${orderNumber} confirmed — Shree Collection`,
    html: shell('Order Confirmed', `
      <p>Thank you for your purchase, ${name}!</p>
      <p><strong>Order:</strong> ${orderNumber}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${items.map(i => `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #eee">${i.title} × ${i.quantity}</td>
          <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">₹${(i.price * i.quantity).toLocaleString('en-IN')}</td>
        </tr>`).join('')}
        <tr><td style="padding:10px 0;font-weight:bold">Total</td>
            <td style="padding:10px 0;font-weight:bold;text-align:right">₹${Number(total).toLocaleString('en-IN')}</td></tr>
      </table>
      <p>We'll email you the tracking number once your order ships.</p>`),
  });

// ── Low-stock alert to admin ───────────────────────────────────────────────────
export const sendLowStockAlert = (product) =>
  sendEmail({
    to: process.env.ADMIN_ALERT_EMAIL,
    subject: `⚠ Low stock: ${product.title} (${product.stock} left)`,
    html: shell('Low Stock Alert', `
      <p><strong>${product.title}</strong> is running low.</p>
      <p>Remaining stock: <strong>${product.stock}</strong> · Status: ${product.stockStatus}</p>
      <p><a href="https://shreecollection.co.in/admin/products">Open Admin → Products</a></p>`),
  });
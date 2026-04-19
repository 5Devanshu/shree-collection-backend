const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST,
  port:   parseInt(process.env.MAIL_PORT, 10),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// ── Send a stock back notification email ──────────────────────────────────────
const sendStockBackEmail = async ({ to, productTitle, productId }) => {
  const productUrl = `${process.env.CLIENT_URL}/product/${productId}`;

  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to,
    subject: `Back in Stock — ${productTitle} | Shree Collection`,
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1c1c;">
        <h1 style="font-size: 2rem; font-weight: 400; margin-bottom: 8px;">Shree Collection</h1>
        <hr style="border: none; border-top: 1px solid #d0c5af; margin-bottom: 32px;" />

        <p style="font-size: 1rem; font-weight: 300; margin-bottom: 24px;">
          Great news — the piece you were waiting for is back in stock.
        </p>

        <h2 style="font-size: 1.4rem; font-weight: 400; margin-bottom: 8px;">${productTitle}</h2>
        <p style="font-size: 0.9rem; color: #7f7663; margin-bottom: 32px;">
          Quantities are limited. We recommend ordering soon.
        </p>

        <a href="${productUrl}"
          style="
            display: inline-block;
            background-color: #735c00;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 500;
          ">
          View Product
        </a>

        <hr style="border: none; border-top: 1px solid #d0c5af; margin-top: 48px; margin-bottom: 16px;" />
        <p style="font-size: 0.75rem; color: #7f7663;">
          You received this email because you requested a stock notification from Shree Collection.
        </p>
      </div>
    `,
  });
};

// ── Send order confirmation email to customer ─────────────────────────────────
const sendOrderConfirmationEmail = async ({ to, customerName, orderId, items, total }) => {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e2e2e2;">
        ${item.title} ${item.material ? `<br/><span style="font-size:0.8rem;color:#7f7663;">${item.material}</span>` : ''}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #e2e2e2; text-align: center;">×${item.qty}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #e2e2e2; text-align: right;">₹${(item.price * item.qty).toLocaleString()}</td>
    </tr>
  `).join('');

  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to,
    subject: `Order Confirmed — #${orderId} | Shree Collection`,
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1c1c;">
        <h1 style="font-size: 2rem; font-weight: 400; margin-bottom: 8px;">Shree Collection</h1>
        <hr style="border: none; border-top: 1px solid #d0c5af; margin-bottom: 32px;" />

        <p style="font-size: 1rem; font-weight: 300;">Dear ${customerName},</p>
        <p style="font-size: 1rem; font-weight: 300; margin-bottom: 32px;">
          Your order has been confirmed. Thank you for choosing Shree Collection.
        </p>

        <p style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #7f7663; margin-bottom: 8px;">
          Order ID
        </p>
        <p style="font-size: 1rem; margin-bottom: 32px;">#${orderId}</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr>
              <th style="text-align: left; padding-bottom: 12px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #7f7663; font-weight: 500;">Item</th>
              <th style="text-align: center; padding-bottom: 12px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #7f7663; font-weight: 500;">Qty</th>
              <th style="text-align: right; padding-bottom: 12px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #7f7663; font-weight: 500;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding-top: 16px; font-weight: 500;">Total</td>
              <td style="padding-top: 16px; text-align: right; font-weight: 500;">₹${total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <hr style="border: none; border-top: 1px solid #d0c5af; margin-top: 48px; margin-bottom: 16px;" />
        <p style="font-size: 0.75rem; color: #7f7663;">
          © Shree Collection. All rights reserved.
        </p>
      </div>
    `,
  });
};

module.exports = { sendStockBackEmail, sendOrderConfirmationEmail };
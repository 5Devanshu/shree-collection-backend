import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

// Snapshot of a checkout attempt, taken at POST /checkout/initiate — BEFORE
// the customer is redirected to PhonePe.
//
// Why this exists: the customer's browser can lose its in-memory cart/email/
// shippingAddress state during the round-trip to PhonePe (Android UPI app
// switch, in-app browser reload, closed tab, etc). When that happens,
// POST /checkout/confirm arrives with an incomplete payload and — before this
// fix — was rejected with "Missing order details", even though PhonePe had
// already captured the payment. This row lets both /checkout/confirm and the
// /checkout/webhook handler recover the full order details from the server
// side instead of trusting the browser to still have them.
const PendingCheckout = sequelize.define(
  'PendingCheckout',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // PhonePe merchantOrderId — the join key between initiate, confirm, and webhook
    merchantOrderId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // May be null if the frontend hasn't collected it yet at initiate time —
    // confirm/webhook will use whatever the frontend later provides if this is empty
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    items: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    subtotal:     { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    shippingCost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total:        { type: DataTypes.DECIMAL(10, 2), allowNull: false },

    resellerId: { type: DataTypes.UUID,   allowNull: true, defaultValue: null },
    customerId: { type: DataTypes.UUID,   allowNull: true, defaultValue: null },
    sessionId:  { type: DataTypes.STRING, allowNull: true, defaultValue: null },

    // Set once an Order has been created from this snapshot (by either
    // /confirm or the webhook) — kept for debugging, not currently cleaned up
    consumedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
  },
  {
    tableName: 'pending_checkouts',
    timestamps: true,
    indexes: [{ fields: ['merchantOrderId'] }],
  }
);

export default PendingCheckout;
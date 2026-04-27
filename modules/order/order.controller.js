import * as orderService from './order.service.js';

// POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrderService(req.body);
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/orders  [Admin]
export const getAllOrders = async (req, res) => {
  try {
    const result = await orderService.getAllOrdersService(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/recent  [Admin]
export const getRecentOrders = async (req, res) => {
  try {
    const orders = await orderService.getRecentOrdersService(req.query.limit);
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/stats  [Admin]
export const getOrderStats = async (req, res) => {
  try {
    const stats = await orderService.getOrderStatsService();
    res.status(200).json({ success: true, ...stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/export  [Admin]
export const exportOrdersCSV = async (req, res) => {
  try {
    const csv = await orderService.exportOrdersCSVService();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="shree-orders.csv"');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/:id  [Admin]
export const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderByIdService(req.params.id);
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// PATCH /api/orders/:id/status  [Admin]
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await orderService.updateOrderStatusService(req.params.id, req.body);
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/orders/:id  [Admin]
export const deleteOrder = async (req, res) => {
  try {
    const result = await orderService.deleteOrderService(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// POST /api/orders/demo  [Public - Guest Checkout Demo]
export const createDemoOrder = async (req, res) => {
  try {
    const order = await orderService.createOrderService(req.body);
    res.status(201).json({ 
      success: true, 
      data: {
        orderId: order.orderNumber,
        orderNumber: order.orderNumber,
        email: order.email,
        total: order.total,
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
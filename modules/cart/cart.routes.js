import express        from 'express';
import optionalAuth   from './cart.auth.middleware.js';
import {
  getCart, getCartCount, addToCart,
  updateCartItem, removeFromCart, clearCart,
} from './cart.controller.js';

const router = express.Router();

router.use(optionalAuth);   // ← attaches reseller/customer if token present

router.get('/count',             getCartCount);
router.get('/',                  getCart);
router.post('/add',              addToCart);
router.patch('/item/:productId', updateCartItem);
router.delete('/item/:productId',removeFromCart);
router.delete('/clear',          clearCart);

export default router;
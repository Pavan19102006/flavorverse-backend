const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const Joi = require('joi');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Validation schemas
const orderSchema = Joi.object({
  restaurant_id: Joi.string().required(),
  restaurant_name: Joi.string().required(),
  items: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    price: Joi.number().positive().required(),
    quantity: Joi.number().integer().positive().required(),
    image: Joi.string().uri().optional(),
    restaurantId: Joi.string().optional(),
    restaurantName: Joi.string().optional()
  })).min(1).required(),
  total: Joi.number().positive().required(),
  address: Joi.object({
    fullName: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().allow('').optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    deliveryInstructions: Joi.string().allow('').optional()
  }).required(),
  payment: Joi.object({
    method: Joi.string().valid('card', 'upi', 'cod').required(),
    cardNumber: Joi.string().optional(),
    nameOnCard: Joi.string().optional(),
    upiId: Joi.string().optional()
  }).required(),
  userId: Joi.string().required()
});

// GET /api/orders - Get user's orders
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    // For now, extract user ID from query params or implement JWT verification
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    res.json({
      success: true,
      orders: orders || [],
      count: orders?.length || 0
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const { error: validationError, value: validatedData } = orderSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationError.details.map(d => d.message)
      });
    }

    // Create order object for database
    const orderData = {
      user_id: validatedData.userId,
      restaurant_id: validatedData.restaurant_id,
      restaurant_name: validatedData.restaurant_name,
      items: validatedData.items,
      total: validatedData.total,
      address: validatedData.address,
      payment: validatedData.payment,
      status: 'confirmed',
      placed_at: new Date().toISOString(),
      estimated_delivery: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      tracking_steps: [
        {
          step: 'order_placed',
          timestamp: new Date().toISOString(),
          message: 'Order has been placed successfully'
        }
      ]
    };

    const { data: order, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Failed to create order',
        details: error.message 
      });
    }

    res.status(201).json({
      success: true,
      order: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id - Get specific order
router.get('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch order' });
    }

    res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:id/status - Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, message } = req.body;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses: validStatuses
      });
    }

    // Get current order to update tracking steps
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('tracking_steps')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Add new tracking step
    const trackingSteps = currentOrder.tracking_steps || [];
    trackingSteps.push({
      step: status,
      timestamp: new Date().toISOString(),
      message: message || `Order status updated to ${status}`
    });

    const { data: order, error } = await supabase
      .from('orders')
      .update({ 
        status: status,
        tracking_steps: trackingSteps,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to update order status' });
    }

    res.json({
      success: true,
      order: order,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

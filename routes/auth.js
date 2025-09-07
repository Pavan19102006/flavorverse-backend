const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const Joi = require('joi');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    // Validate request body
    const { error: validationError, value: validatedData } = registerSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationError.details.map(d => d.message)
      });
    }

    const { email, password, fullName } = validatedData;

    // Use Supabase Auth for registration
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      console.error('Supabase auth error:', error);
      return res.status(400).json({
        error: 'Registration failed',
        details: error.message
      });
    }

    if (data.user && !data.session) {
      return res.status(200).json({
        success: true,
        message: 'Registration successful! Please check your email to confirm your account.',
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name
        }
      });
    }

    // Create JWT token for immediate login (if email confirmation is disabled)
    const token = jwt.sign(
      { 
        userId: data.user.id, 
        email: data.user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name
      },
      token: token
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const { error: validationError, value: validatedData } = loginSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationError.details.map(d => d.message)
      });
    }

    const { email, password } = validatedData;

    // Use Supabase Auth for login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error('Supabase auth error:', error);
      return res.status(401).json({
        error: 'Login failed',
        details: error.message
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: data.user.id, 
        email: data.user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name
      },
      token: token,
      session: data.session
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase logout error:', error);
      return res.status(500).json({
        error: 'Logout failed',
        details: error.message
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/profile - Get user profile
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name,
          emailConfirmed: user.email_confirmed_at !== null,
          createdAt: user.created_at
        }
      });
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/refresh - Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refresh_token
    });

    if (error) {
      return res.status(401).json({
        error: 'Token refresh failed',
        details: error.message
      });
    }

    // Create new JWT token
    const token = jwt.sign(
      { 
        userId: data.user.id, 
        email: data.user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: token,
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name
      }
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

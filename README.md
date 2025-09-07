# FlavorVerse Backend API

A robust Node.js/Express backend for the FlavorVerse food delivery application, featuring authentication, order management, and restaurant APIs.

## 🚀 Features

- **Authentication**: User registration, login, logout with JWT tokens
- **Order Management**: Create, read, update order status with tracking
- **Restaurant API**: Browse restaurants, view menus, filter by cuisine
- **Database Integration**: Supabase PostgreSQL with Row Level Security
- **Security**: CORS, rate limiting, input validation, helmet security headers
- **Logging**: Request logging with Morgan
- **Validation**: Request validation with Joi schemas

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system health information

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh` - Refresh authentication token

### Orders
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get specific order
- `PATCH /api/orders/:id/status` - Update order status

### Restaurants
- `GET /api/restaurants` - Get all restaurants (with filtering)
- `GET /api/restaurants/:id` - Get specific restaurant
- `GET /api/restaurants/:id/menu` - Get restaurant menu
- `GET /api/restaurants/meta/cuisines` - Get available cuisines

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and fill in your values:
   ```env
   PORT=3000
   NODE_ENV=production
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=your_frontend_url
   ```

3. **Start the server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🌐 Deployment on Render

This backend is configured for deployment on Render.com:

1. **Connect your GitHub repository to Render**
2. **Set environment variables** in Render dashboard
3. **Deploy** - Render will automatically install dependencies and start the server

### Required Environment Variables on Render:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `FRONTEND_URL`
- `ALLOWED_ORIGINS`

## 🔐 Security Features

- **CORS**: Configured for specific origins
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **JWT Authentication**: Secure token-based auth
- **Environment Variables**: Sensitive data protection

## 📊 Database Schema

The backend works with Supabase PostgreSQL with the following main tables:

### Orders Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- restaurant_id (VARCHAR)
- restaurant_name (VARCHAR)
- items (JSONB)
- total (DECIMAL)
- address (JSONB)
- payment (JSONB)
- status (VARCHAR)
- placed_at (TIMESTAMPTZ)
- estimated_delivery (TIMESTAMPTZ)
- tracking_steps (JSONB)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

## 🧪 Testing

Test the API endpoints:

```bash
# Health check
curl https://your-backend-url.com/api/health

# Register user
curl -X POST https://your-backend-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'

# Get restaurants
curl https://your-backend-url.com/api/restaurants
```

## 📝 API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "error": "Error message (if success is false)"
}
```

## 🔧 Configuration

### CORS Configuration
Configure allowed origins in environment variables:
```env
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain.com
```

### Rate Limiting
Adjust rate limiting in environment variables:
```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window
```

## 📈 Monitoring

The backend includes:
- Request logging with Morgan
- Health check endpoints
- Error handling and logging
- Performance monitoring data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

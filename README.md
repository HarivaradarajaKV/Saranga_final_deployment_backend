# Cosmetics App Backend

This is the backend server for the Cosmetics App, built with Node.js, Express, and PostgreSQL with Supabase integration.

## Features

- RESTful API endpoints for products, categories, users, cart, orders, and more
- Authentication and authorization using JWT
- File upload functionality for product images
- Integration with Supabase for database management
- Comprehensive error handling and validation

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL (via Supabase)

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Connection Pooling
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url

# Other Configuration
PORT=5001
JWT_SECRET=your_jwt_secret
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables as described above
4. Run the migrations:
   ```bash
   node migrations/supabase_migration.js
   ```
5. Start the server:
   ```bash
   npm start
   ```

## API Documentation

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- GET /api/auth/verify - Verify JWT token

### Products
- GET /api/products - Get all products
- GET /api/products/:id - Get product by ID
- POST /api/products - Add new product (admin only)
- PUT /api/products/:id - Update product (admin only)
- DELETE /api/products/:id - Delete product (admin only)

### Categories
- GET /api/categories - Get all categories
- POST /api/categories - Add new category (admin only)
- PUT /api/categories/:id - Update category (admin only)
- DELETE /api/categories/:id - Delete category (admin only)

### Cart
- GET /api/cart - Get user's cart
- POST /api/cart - Add item to cart
- PUT /api/cart/:id - Update cart item
- DELETE /api/cart/:id - Remove item from cart

### Orders
- GET /api/orders - Get user's orders
- POST /api/orders - Create new order
- GET /api/orders/:id - Get order details

### Brand Reviews
- GET /api/brand-reviews - Get all brand reviews
- POST /api/brand-reviews - Add new brand review
- PUT /api/brand-reviews/:id - Update brand review
- DELETE /api/brand-reviews/:id - Delete brand review

## Error Handling

The API uses standard HTTP response codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 
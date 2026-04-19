# Optional Dependencies for Enhanced Features

To fully utilize all features of the refactored backend, consider installing these optional dependencies:

## API Rate Limiting (Recommended)

For production use, install express-rate-limit:

```bash
npm install express-rate-limit
```

The rate limiter middleware is already configured in `middlewares/rateLimiter.js`.

**Usage in routes:**
```javascript
const limiter = require('../../middlewares/rateLimiter');

router.post('/login', limiter, loginController);
```

## Validation (Recommended)

For input validation, consider adding:

```bash
npm install joi
```

Or

```bash
npm install yup
```

**Example with Joi:**
```javascript
const Joi = require('joi');

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const { error, value } = schema.validate(req.body);
if (error) throw new Error(error.details[0].message);
```

## Request Logging (Optional)

Already using Morgan. To enhance it:

```bash
npm install express-winston winston
```

## API Documentation (Optional)

For Swagger/OpenAPI documentation:

```bash
npm install swagger-jsdoc swagger-ui-express
```

## Database Admin UI (Optional)

For MongoDB visualization:

```bash
npm install mongo-express
```

## Caching (Optional)

For Redis caching:

```bash
npm install redis
```

## Email Enhancements (Optional)

Already using Nodemailer. For email templates:

```bash
npm install nodemailer-express-handlebars
```

## Testing (Recommended for Development)

```bash
npm install --save-dev jest supertest @testing-library/jest-dom
```

## Complete Enhanced package.json

```json
{
  "name": "shree-collection-backend",
  "version": "1.0.0",
  "description": "Backend API for Shree Collection jewelry store",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch"
  },
  "keywords": ["jewelry", "ecommerce", "api"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "axios": "^1.14.0",
    "bcryptjs": "^2.4.3",
    "cashfree-pg": "^5.1.0",
    "cloudinary": "^2.9.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "jsonwebtoken": "^9.0.3",
    "joi": "^17.11.0",
    "mongoose": "^8.0.0",
    "morgan": "^1.10.1",
    "multer": "^2.0.0",
    "nodemailer": "^8.0.4"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.5",
    "jest": "^29.7.0",
    "nodemon": "^3.1.14",
    "supertest": "^6.3.3"
  },
  "type": "commonjs"
}
```

## Installation Command

To install all recommended dependencies:

```bash
npm install express-rate-limit joi
npm install --save-dev jest supertest @testing-library/jest-dom
```

---

Each optional dependency serves a specific purpose. Install only what you need for your use case.

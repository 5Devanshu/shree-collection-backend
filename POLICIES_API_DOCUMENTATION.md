# Backend Policies API - Implementation Guide

## Overview
The Policies API provides backend endpoints to serve Terms & Conditions, Privacy Policy, Shipping Policy, and Return & Refund Policy content.

## API Endpoints

### Base URL
```
/api/policies
```

### Endpoints

#### 1. Get All Available Policies
```
GET /api/policies/
```

**Response:**
```json
{
  "success": true,
  "message": "Policies available",
  "endpoints": [
    "/api/policies/terms",
    "/api/policies/privacy",
    "/api/policies/shipping",
    "/api/policies/returns"
  ]
}
```

#### 2. Get Terms and Conditions
```
GET /api/policies/terms
```

**Response:**
```json
{
  "success": true,
  "title": "Terms and Conditions",
  "content": {
    "general": { "title": "...", "text": "..." },
    "userResponsibilities": { "title": "...", "text": "..." },
    "productDescriptions": { "title": "...", "text": "..." },
    "orderAcceptance": { "title": "...", "text": "..." },
    "pricing": { "title": "...", "text": "..." },
    "intellectualProperty": { "title": "...", "text": "..." },
    "limitationOfLiability": { "title": "...", "text": "..." },
    "governingLaw": { "title": "...", "text": "..." }
  },
  "lastUpdated": "2026-04-22"
}
```

#### 3. Get Privacy Policy
```
GET /api/policies/privacy
```

**Response:**
```json
{
  "success": true,
  "title": "Privacy Policy",
  "content": {
    "informationCollection": {
      "title": "Information We Collect",
      "items": [...]
    },
    "informationUsage": {
      "title": "How We Use Your Information",
      "items": [...]
    },
    "dataSharing": { "title": "...", "text": "..." },
    "dataSecurity": { "title": "...", "text": "..." },
    "cookiesAndTracking": { "title": "...", "text": "..." },
    "thirdPartyLinks": { "title": "...", "text": "..." },
    "userRights": { "title": "...", "items": [...] }
  },
  "lastUpdated": "2026-04-22"
}
```

#### 4. Get Shipping Policy
```
GET /api/policies/shipping
```

**Response:**
```json
{
  "success": true,
  "title": "Shipping Policy",
  "content": {
    "orderProcessing": {
      "title": "Order Processing",
      "text": "Orders are typically processed within 1–3 business days."
    },
    "deliveryTimes": {
      "title": "Delivery Times",
      "standardDelivery": "5–10 business days",
      "expressDelivery": "3-5 business days",
      "note": "..."
    }
  },
  "lastUpdated": "2026-04-22"
}
```

#### 5. Get Return & Refund Policy
```
GET /api/policies/returns
```

**Response:**
```json
{
  "success": true,
  "title": "Return & Refund Policy",
  "content": {
    "returnPolicy": {
      "title": "Return Policy",
      "items": [...]
    },
    "exchangePolicy": {
      "title": "Exchange / Replacement Policy",
      "items": [...]
    },
    "refundPolicy": {
      "title": "Refund Policy",
      "items": [...]
    }
  },
  "lastUpdated": "2026-04-22"
}
```

## Integration

### Registering Routes
The policies routes are already registered in `server.js`:

```javascript
import policiesRoutes from './modules/policies/routes.js';

app.use('/api/policies', policiesRoutes);
```

### CORS Configuration
All policy endpoints are accessible via CORS-enabled requests. No special authorization required (GET requests are public).

## Frontend Integration

### Using the API
Import the policies API client:

```javascript
import { getTerms, getPrivacyPolicy, getShippingPolicy, getReturnPolicy } from './api/policiesApi';

// Fetch terms
const termsData = await getTerms();

// Fetch privacy policy
const privacyData = await getPrivacyPolicy();

// Fetch shipping policy
const shippingData = await getShippingPolicy();

// Fetch return policy
const returnData = await getReturnPolicy();
```

## Content Structure

### Policy Response Format
Each policy endpoint returns:
- `success` (boolean): Request success status
- `title` (string): Policy title
- `content` (object): Policy content with structured sections
- `lastUpdated` (string): Last update date in YYYY-MM-DD format

### Content Organization
- **Hierarchical structure**: Policies are organized by sections
- **Flexible format**: Sections can contain text or item arrays
- **Extensible**: Easy to add new sections or policies

## Customization

### Adding New Policy
1. Create new endpoint in `modules/policies/routes.js`:
```javascript
router.get('/new-policy', (req, res) => {
  res.json({
    success: true,
    title: 'New Policy Title',
    content: {
      section1: { title: "...", text: "..." },
      section2: { title: "...", items: [...] }
    },
    lastUpdated: '2026-04-22'
  });
});
```

2. Update the policies list endpoint to include the new route

### Updating Existing Policy Content
Edit the respective section in `modules/policies/routes.js` and update the `lastUpdated` date:

```javascript
router.get('/terms', (req, res) => {
  res.json({
    // ... existing code ...
    lastUpdated: '2026-04-22' // Update this date
  });
});
```

## Error Handling
- All endpoints return `{ success: true }` on successful retrieval
- Endpoints don't require authentication
- GET requests are cached-friendly (consider adding ETag headers in production)

## Performance Optimization

### Recommendations for Production:
1. **Add caching headers**:
```javascript
router.get('/terms', (req, res) => {
  res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
  res.json({ /* ... */ });
});
```

2. **Add compression** (already enabled via Express):
```javascript
app.use(compression());
```

3. **Consider moving to database** for dynamic policy updates:
```javascript
// Future enhancement: Store policies in MongoDB
const policy = await Policy.findOne({ type: 'terms' });
res.json(policy);
```

## Testing

### cURL Examples
```bash
# Get all available policies
curl http://localhost:5000/api/policies/

# Get terms and conditions
curl http://localhost:5000/api/policies/terms

# Get privacy policy
curl http://localhost:5000/api/policies/privacy

# Get shipping policy
curl http://localhost:5000/api/policies/shipping

# Get return policy
curl http://localhost:5000/api/policies/returns
```

### Postman Collection
- Method: GET
- URL: `http://localhost:5000/api/policies/{policy-type}`
- Headers: None required
- Auth: None required
- Response: JSON

## API Response Times
- Average response time: < 50ms (no database queries)
- All requests are synchronous and fast
- No blocking operations

## Version History
- **v1.0** (April 22, 2026): Initial implementation with 4 core policies

## Future Enhancements
1. Database storage for policy updates
2. Admin API for policy management
3. Policy versioning and history
4. Multi-language support
5. Automatic changelog generation
6. Policy acceptance tracking
7. Email notifications for policy updates

## Security Notes
- GET endpoints are public (no authentication required)
- No sensitive data is exposed
- Static content with no injection vulnerabilities
- CORS properly configured

## Monitoring
- Monitor endpoint response times
- Track policy update frequency
- Log failed requests (for debugging)
- Monitor backend health

## Support
For API-related issues or modifications, contact the development team.

Last Updated: April 22, 2026

#!/bin/bash

# PhonePe Payment Gateway & Guest Checkout Setup Script
# This script sets up the environment variables and validates the configuration

echo "═══════════════════════════════════════════════════════════════════════"
echo "  PhonePe Payment Gateway & Guest Checkout Setup"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in backend directory
if [ ! -f "server.js" ]; then
    echo -e "${RED}✗ Please run this script from the backend root directory${NC}"
    exit 1
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating one...${NC}"
    cat > .env << 'EOF'
# MongoDB
MONGODB_URI=mongodb://localhost:27017/shree-collection

# PhonePe Configuration
PHONEPE_ENV=TEST
PHONEPE_CLIENT_ID=M22WI0U1WRSFJ_2604272338
PHONEPE_CLIENT_SECRET=ODliMTYxOWUtNjBkOS00NTFiLThlNzktMWI3YzI0Y2UxMWY4
PHONEPE_APP_ID=M22WI0U1WRSFJ_2604272338

# Frontend & Backend URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Admin credentials
ADMIN_EMAIL=admin@shreecollection.com
ADMIN_PASSWORD=your_secure_password

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Client URL
CLIENT_URL=http://localhost:5173
EOF
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  Checking PhonePe Configuration"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Check if PhonePe credentials are set
if grep -q "PHONEPE_CLIENT_ID=M22WI0U1WRSFJ_2604272338" .env; then
    echo -e "${GREEN}✓ PhonePe Client ID configured${NC}"
else
    echo -e "${YELLOW}⚠ PhonePe Client ID may not be configured${NC}"
fi

if grep -q "PHONEPE_CLIENT_SECRET=ODliMTYxOWUtNjBkOS00NTFiLThlNzktMWI3YzI0Y2UxMWY4" .env; then
    echo -e "${GREEN}✓ PhonePe Client Secret configured${NC}"
else
    echo -e "${YELLOW}⚠ PhonePe Client Secret may not be configured${NC}"
fi

if grep -q "PHONEPE_ENV=TEST" .env; then
    echo -e "${GREEN}✓ PhonePe Environment set to TEST${NC}"
else
    echo -e "${YELLOW}⚠ PhonePe Environment may not be set to TEST${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  File Structure Verification"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Check for new files
FILES=(
    "config/phonepe.js"
    "modules/payment/payment.routes.js"
    "modules/payment/payment.controller.js"
    "modules/payment/payment.service.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file (missing)${NC}"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  Frontend Files Verification"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

FRONTEND_FILES=(
    "../shree-collection/shree-collection/src/components/GuestCheckout.jsx"
    "../shree-collection/shree-collection/src/components/GuestCheckout.css"
)

for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $(basename $file)${NC}"
    else
        echo -e "${YELLOW}⚠ $(basename $file) (may not be in expected location)${NC}"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  Installation Steps"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

echo "1. Backend Setup:"
echo "   - Install dependencies: npm install"
echo "   - Start development server: npm run dev"
echo ""

echo "2. Frontend Setup:"
echo "   - Navigate to frontend: cd ../shree-collection/shree-collection"
echo "   - Install dependencies: npm install"
echo "   - Start dev server: npm run dev"
echo ""

echo "3. Add Route to Router:"
echo "   - Import: import GuestCheckout from './components/GuestCheckout';"
echo "   - Route: { path: '/checkout/guest', element: <GuestCheckout /> }"
echo ""

echo "4. Test Payment Flow:"
echo "   - Navigate to http://localhost:5173/checkout/guest"
echo "   - Fill in guest details (no login required)"
echo "   - Complete payment with PhonePe"
echo ""

echo "═══════════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Setup complete!${NC}"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "📚 Documentation: PHONEPE_INTEGRATION_GUIDE.md"
echo ""

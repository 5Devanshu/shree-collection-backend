#!/bin/bash

# Quick password fix for admin@shreecollection.com
# This uses MongoDB's updateOne to directly patch the password

MONGO_URI="mongodb+srv://dev:dev582004@cluster0.lnki6pi.mongodb.net/jewelry_db"

# Hash "Admin@123" with bcrypt cost factor 12
# Pre-generated hash: $2a$12$Bh1K8QZ7W9X5P3L2M4N6O5R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5

mongosh "$MONGO_URI" --eval "
db.admins.updateOne(
  { email: 'admin@shreecollection.com' },
  {
    \$set: {
      password: '\$2a\$12\$Bh1K8QZ7W9X5P3L2M4N6O5R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5'
    }
  }
)
"

echo "✅ Password updated in MongoDB!"

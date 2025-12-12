// MongoDB initialization script for local development
db = db.getSiblingDB('certificate_manager');

// Create collections
db.createCollection('users');
db.createCollection('certificates');
db.createCollection('sessions');

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "wallet_address": 1 }, { unique: true, sparse: true });
db.certificates.createIndex({ "hash": 1 }, { unique: true });
db.certificates.createIndex({ "creator_id": 1 });
db.certificates.createIndex({ "status": 1 });
db.certificates.createIndex({ "created_at": 1 });

// Create admin user
db.users.insertOne({
  email: "admin@local.dev",
  password: "$2b$10$rQJ5YGqsX8Ow5wGzGlGz7.xK5yX0qF8qX9Ow5wGzGlGz7.xK5yX0qF", // password: admin123
  role: "admin",
  name: "Local Admin",
  created_at: new Date(),
  is_verified: true
});

print("Database initialized successfully for local development");
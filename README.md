# Website Analytics Backend API

Backend service for event collection, API key management, reporting, short URL tracking, and analytics aggregation. This project is designed to be scalable, cache-optimized, and deployable on modern cloud providers.

**Live Deployment URL (Render):**
https://alter-office-w7nh.onrender.com

**API Documentation (Swagger/OpenAPI):**
https://alter-office-w7nh.onrender.com/docs

## 1. Overview

This backend provides a complete analytics system designed to be integrated into any website or mobile application. It supports high-volume event ingestion, efficient reporting, API key management, short URL tracking, and device/user-based insights.

The system follows a modular, scalable architecture and uses PostgreSQL, Redis caching, and Fastify for high-performance handling.

All requirements from the task brief have been implemented and validated.

## 2. Features Implemented
### API Key Management
- Register application and generate API key
- API key hashing and TTL support
- Key revocation and regeneration
- API key validation middleware
- Authentication via `x-api-key` header

### Event Data Collection
- High-volume event ingestion
- Records URL, referrer, userId, device, metadata, IP, timestamp
- Automatic timestamp fallback
- Optimized PostgreSQL schema

### Analytics & Reporting
- Event summary with device-level breakdown
- Unique user counts (IP-based)
- User-level statistics (recent event, device info, total events)
- Supports date filters
- Supports app-level and cross-app queries

### Rate Limiting
- Implemented using `@fastify/rate-limit`
- Applied specifically to ingestion endpoints

### Short URL Management
- Create short URLs
- Redirect handler
- Auto-record analytics event `shorturl_click` on redirection

### Caching Layer (Redis)
- Event summaries
- User statistics
- API key validation
- Automatic TTL-based caching

### Testing
- Jest-based tests
- Supertest integration testing
- Test server builder to avoid port conflicts
- Covers Auth, Analytics, Short URL modules

### Swagger Documentation
- Complete OpenAPI 3.0 documentation
- Includes schemas, tags, and security handling

### Deployment
- Fully deployed on Render
- Production build
- Environment-variable-driven configuration
- Works without Docker (optional)

## 3. Tech Stack
| Component | Technology |
|-----------|------------|
| Backend Framework | Fastify (Node.js) |
| Database | PostgreSQL |
| Cache | Redis |
| ORM | Prisma |
| Testing | Jest + Supertest |
| Documentation | Swagger / OpenAPI |
| ID Generation | nanoid |
| Deployment | Render |

## 4. Project Structure
```
src/
  modules/
    auth/
      auth.controller.ts
      auth.routes.ts
      auth.service.ts
      apiKey.middleware.ts
    analytics/
      analytics.controller.ts
      analytics.routes.ts
      analytics.service.ts
    shorturl/
      shorturl.routes.ts
      shorturl.service.ts
  utils/
    prisma.ts
    redis.ts
    crypto.util.ts
  server.ts
  buildServer.ts
tests/
  auth.test.ts
  analytics.test.ts
  shorturl.test.ts
prisma/
  schema.prisma
scripts/
  debugging scripts
```

## 5. Installation & Setup
### Install Dependencies
```bash
npm install
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Run All Tests
```bash
npx jest --runInBand
```

## 6. Environment Variables
```
PORT=4000
NODE_ENV=production
CORS_ORIGIN=*

DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db>?sslmode=require"

REDIS_HOST=<host>
REDIS_PORT=<port>
REDIS_PASSWORD=<password>

API_KEY_TTL_DAYS=365
API_KEY_BYTE_SIZE=32

RATE_LIMIT_REQUESTS=500
RATE_LIMIT_WINDOW=60

JWT_SECRET=supersecret123

GOOGLE_CLIENT_ID=dummy
GOOGLE_CLIENT_SECRET=dummy
GOOGLE_REDIRECT_URI=https://localhost/auth/callback

SWAGGER_ENABLED=true

PRISMA_CLIENT_ENGINE_TYPE=binary

BASE_URL=https://alter-office-w7nh.onrender.com
```

## 7. API Endpoints
### 1. API Key Management
**POST /api/auth/register**

Registers a new client application.

**Request:**
```json
{
  "name": "MyApp",
  "ownerEmail": "admin@example.com"
}
```

**Response:**
```json
{
  "apiKey": "...",
  "appId": "..."
}
```

**POST /api/auth/revoke**
```json
{
  "appId": "..."
}
```

**POST /api/auth/regenerate**
```json
{
  "appId": "..."
}
```

### 2. Event Collection
**POST /api/analytics/collect**

**Headers:**
```
x-api-key: <key>
```

**Body:**
```json
{
  "event": "button_click",
  "url": "https://example.com",
  "referrer": "https://google.com",
  "device": "mobile",
  "userId": "user123",
  "metadata": {
    "browser": "Chrome",
    "os": "Windows"
  }
}
```

### 3. Event Summary
**GET /api/analytics/event-summary**

Example:
```
/api/analytics/event-summary?event=button_click&startDate=2024-01-01&endDate=2024-01-15
```

### 4. User Stats
**GET /api/analytics/user-stats?userId=user123**

### 5. Short URLs
**POST /api/shorten**
```json
{
  "originalUrl": "https://example.com/very-long-url"
}
```

**Response:**
```json
{
  "shortId": "abc123",
  "shortUrl": "https://alter-office-w7nh.onrender.com/r/abc123"
}
```

**GET /r/:shortId**

Redirects and logs click event.

## 8. Database Schema (Prisma)
```prisma
model App {
  id         String   @id @default(uuid())
  name       String
  ownerEmail String
  apiKeyHash String
  expiresAt  DateTime?
  revoked    Boolean  @default(false)
  createdAt  DateTime @default(now())
  events     Event[]  @relation("AppEvents")
}

model Event {
  id         BigInt   @id @default(autoincrement())
  appId      String
  app        App      @relation("AppEvents", fields: [appId], references: [id])
  eventName  String
  url        String?
  referrer   String?
  device     String?
  ipAddress  String?
  userId     String?
  timestamp  DateTime @default(now())
  metadata   Json?
}

model ShortUrl {
  id          String   @id
  appId       String
  originalUrl String
  createdAt   DateTime @default(now())
}
```

## 9. Architecture Notes
- Fastify chosen for performance and plugin ecosystem
- Prisma ORM with binary engine for cloud deployment
- Redis caching layer to reduce DB load
- Modular design for extendability and maintainability
- Short URL module added as an additional analytics feature
- Tests built using ephemeral Fastify injection server

## 10. Challenges & Solutions
- **Fastify preParsing Hook Error**: Resolved by removing unnecessary global hooks.
- **Prisma table mismatch**: Short URL table added manually; raw SQL used for compatibility.
- **Render build errors**: Resolved by adding `@types/node` to production dependencies.
- **Tests timing out**: BuildServer separation resolved listener issues.

## 11. Future Enhancements
- Dashboard UI
- Queue-based ingestion (BullMQ)
- Advanced user-agent parsing
- App-level team management
- Admin portal

## 12. Final Notes

This project meets all requirements specified in the task brief:
- API key management
- Event collection
- Analytics aggregation
- Rate limiting
- Short URL module
- Caching system
- Deployment
- Testing coverage
- Clean documentation

The backend is scalable, production-ready, and cloud-deployed.
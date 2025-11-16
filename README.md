# Analytics Backend

A scalable backend API for a Website Analytics app that collects detailed analytics events such as clicks, website visits, referrer data, and device metrics.

## Features

- **API Key Management**: Register apps, generate/revoke/regenerate API keys with expiration support.
- **Event Collection**: Collect analytics events via authenticated API calls.
- **Analytics Reporting**: Aggregate data by events, users, devices, and time ranges with Redis caching.
- **Short URL Management**: Create and track short URLs with analytics.
- **Rate Limiting**: Prevents abuse on event submission endpoints.
- **Containerized**: Docker support for easy deployment.
- **Documentation**: Swagger API docs at `/docs`.

## Tech Stack

- **Node.js** with **Fastify** framework
- **TypeScript** for type safety
- **PostgreSQL** with **Prisma** ORM
- **Redis** for caching
- **Docker** for containerization
- **Jest** for testing

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Kavin-Bakyaraj/alter-office.git
   cd alter-office
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file with:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/analytics"
   REDIS_URL="redis://localhost:6379"
   NODE_ENV=development
   ```

4. **Run database migrations**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Build the project**:
   ```bash
   npm run build
   ```

6. **Start the server**:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

7. **Run tests**:
   ```bash
   npm test
   ```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register a new app
- `GET /api/auth/api-key` - Get API key for an app
- `POST /api/auth/revoke` - Revoke API key
- `POST /api/auth/regenerate` - Regenerate API key

### Analytics
- `POST /api/analytics/collect` - Collect events (requires API key)
- `GET /api/analytics/event-summary` - Get event summary
- `GET /api/analytics/user-stats` - Get user statistics

### Short URL
- `POST /api/shorten` - Create short URL
- `GET /:shortId` - Redirect to original URL

## Deployment

The application is deployed on Render: [https://alter-office-w7nh.onrender.com](https://alter-office-w7nh.onrender.com)

API documentation: [https://alter-office-w7nh.onrender.com/docs](https://alter-office-w7nh.onrender.com/docs)

## Challenges Faced

- Handling high-volume event ingestion with efficient database indexing.
- Implementing caching to reduce query load on frequent analytics requests.
- Ensuring type safety with Prisma and TypeScript for complex aggregations.
- Configuring rate limiting and authentication middleware properly.

## Future Enhancements

- Add Google OAuth for app registration.
- Implement more advanced analytics (e.g., real-time dashboards).
- Add monitoring with Prometheus/Grafana.
- Support for more metadata fields and custom event schemas.
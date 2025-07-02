# Design Document Generator Backend v0.7.1

## Overview
This is the backend API for the Design Document Generator, implementing Phase 5 functionality with Express.js, database integration, and secure API client communication.

## Features

### ✅ Phase 5 Implementation
- **Express.js Backend API** - RESTful API with comprehensive endpoints
- **Database Integration** - Support for PostgreSQL (local and Render-managed)
- **Admin Database Selection** - Switch between database types at runtime
- **Configuration Storage** - Full CRUD operations for configurations
- **Session Management** - Secure session handling with database storage
- **API Client** - Frontend client with secret layer implementation
- **Authentication** - API key-based authentication with encryption
- **Security** - Rate limiting, CORS, helmet, and input validation

## Architecture

### Database Layer
- **PostgreSQL** - Local development and production
- **Supabase** - Cloud-based alternative
- **Migration System** - Automated database schema management
- **Connection Pooling** - Optimized database connections

### API Layer
- **RESTful Endpoints** - Standard HTTP methods and status codes
- **Versioning** - API versioning for backward compatibility
- **Validation** - Joi schema validation for all inputs
- **Error Handling** - Comprehensive error responses and logging

### Security Layer
- **API Key Authentication** - Secure key-based authentication
- **Rate Limiting** - Protection against abuse
- **CORS Configuration** - Cross-origin resource sharing
- **Input Sanitization** - Protection against injection attacks

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL (for local development)
- Supabase account (for cloud deployment)

### Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

4. **Run database migrations**
   ```bash
   npm run migrate
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

### Environment Configuration

#### PostgreSQL Configuration
```env
DB_TYPE=postgresql
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=design_doc_generator
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_SSL=false
```

#### Supabase Configuration
```env
DB_TYPE=supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Security Configuration
```env
SESSION_SECRET=your_session_secret_key_here
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

## API Endpoints

### Health & Status
- `GET /health` - Health check
- `GET /api/status` - API status information

### Configuration Management
- `GET /api/v1/configurations` - List configurations
- `GET /api/v1/configurations/:id` - Get configuration by ID
- `POST /api/v1/configurations` - Create new configuration
- `PUT /api/v1/configurations/:id` - Update configuration
- `DELETE /api/v1/configurations/:id` - Delete configuration
- `POST /api/v1/configurations/:id/export` - Export configuration
- `POST /api/v1/configurations/import` - Import configuration
- `POST /api/v1/configurations/:id/duplicate` - Duplicate configuration
- `GET /api/v1/configurations/stats` - Get configuration statistics

### Admin Endpoints
- `GET /api/admin/database/status` - Database status (admin only)
- `POST /api/admin/database/switch` - Switch database type (admin only)

## Database Schema

### Core Tables
- **users** - User accounts and authentication
- **sessions** - Session storage for authentication
- **configurations** - Configuration storage and management
- **conversations** - Conversation tracking and history
- **conversation_history** - Detailed conversation logs
- **system_settings** - System configuration and settings
- **api_keys** - API key management and permissions

### Key Features
- **UUID Primary Keys** - Secure and globally unique identifiers
- **Timestamps** - Automatic created_at and updated_at tracking
- **Indexes** - Optimized query performance
- **Foreign Keys** - Referential integrity
- **Triggers** - Automatic timestamp updates

## Security Features

### API Key Management
- **Secure Storage** - Encrypted API key storage
- **Permission System** - Granular access control
- **Key Rotation** - Automatic key expiration and renewal
- **Usage Tracking** - Monitor API key usage patterns

### Authentication Flow
1. **API Key Generation** - Secure key generation process
2. **Key Validation** - Database lookup and validation
3. **Permission Check** - Role-based access control
4. **Request Processing** - Authenticated request handling

### Rate Limiting
- **Per-IP Limits** - Prevent abuse from individual sources
- **Per-User Limits** - User-specific rate limiting
- **Configurable Windows** - Flexible time windows
- **Exponential Backoff** - Automatic retry with backoff

## Development

### Scripts
```bash
npm run dev          # Start development server
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Lint code
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data
```

### Database Migrations
```bash
# Run all pending migrations
npm run migrate

# Check migration status
node src/database/migrate.js status

# Rollback specific migration
node src/database/migrate.js rollback <filename>
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="Configuration"
```

## Deployment

### Production Setup
1. **Environment Variables** - Configure production environment
2. **Database Setup** - Configure production database
3. **SSL/TLS** - Enable HTTPS for production
4. **Process Management** - Use PM2 or similar
5. **Monitoring** - Set up logging and monitoring

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables
- **NODE_ENV** - Set to 'production'
- **PORT** - Server port (default: 3001)
- **DATABASE_URL** - Production database connection
- **SESSION_SECRET** - Strong session secret
- **JWT_SECRET** - Strong JWT secret

## API Client Integration

### Frontend Integration
The frontend includes a secure API client that:
- **Hides API Details** - All API information is encapsulated
- **Secure Key Storage** - Encrypted API key storage
- **Automatic Retry** - Network error handling with retry logic
- **Type Safety** - Full TypeScript support
- **Error Handling** - Comprehensive error management

### Usage Example
```typescript
import apiClient from '../services/apiClient';

// Set API key
apiClient.setApiKey('your-api-key');

// Get configurations
const configs = await apiClient.getConfigurations();

// Create configuration
const newConfig = await apiClient.createConfiguration({
  name: 'My Configuration',
  config_data: configurationData
});
```

## Monitoring & Logging

### Logging Levels
- **DEBUG** - Detailed debugging information
- **INFO** - General application information
- **WARN** - Warning messages
- **ERROR** - Error messages and stack traces

### Metrics
- **Request Counts** - API endpoint usage statistics
- **Response Times** - Performance monitoring
- **Error Rates** - Error tracking and alerting
- **Database Performance** - Query performance monitoring

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database status
curl http://localhost:3001/api/admin/database/status

# Verify environment variables
echo $POSTGRES_HOST
echo $POSTGRES_DB
```

#### API Key Issues
```bash
# Check authentication
curl -H "x-api-key: your-key" http://localhost:3001/api/status
```

#### Migration Issues
```bash
# Check migration status
node src/database/migrate.js status

# Reset migrations (development only)
node src/database/migrate.js reset
```

### Performance Optimization
- **Connection Pooling** - Optimize database connections
- **Query Optimization** - Use database indexes effectively
- **Caching** - Implement Redis caching for frequently accessed data
- **Compression** - Enable gzip compression for responses

## Contributing

### Development Workflow
1. **Fork Repository** - Create your own fork
2. **Create Branch** - Feature branch for your changes
3. **Write Tests** - Include tests for new functionality
4. **Run Linting** - Ensure code quality
5. **Submit PR** - Pull request with detailed description

### Code Standards
- **ESLint** - Follow linting rules
- **TypeScript** - Use TypeScript for type safety
- **JSDoc** - Document all public methods
- **Testing** - Maintain high test coverage

## License
This project is part of the Design Document Generator v0.7.0 and follows the same licensing terms.

## Support
For issues and questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check GitHub issues
4. Create new issue with detailed information 
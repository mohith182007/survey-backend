# Survey API Backend

Express.js API server for the Personality Assessment Survey Platform.

## Quick Start

```bash
npm install
npm start
```

Server runs on port 5000.

## Environment Variables

```
MONGODB_URI=mongodb+srv://surveyadmin:PASSWORD@cluster.mongodb.net/survey_db?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

## API Endpoints

- `POST /api/survey/user` - Create user
- `POST /api/survey/submit` - Submit survey response
- `GET /api/survey/user/:userId` - Get user data
- `GET /api/survey/response/:responseId` - Get response
- `GET /api/survey/responses` - Get all responses

## Database

Uses MongoDB with Mongoose ODM.

Collections:
- `users` - User information
- `surveyresponses` - Survey responses and classifications

## Deployment

Deploy to Render, Heroku, or Railway:

```bash
# Set environment variables on your hosting platform
# Push code to trigger deployment
```

See parent repository for full deployment guides.
# Redeploy timestamp: Wed Oct 22 10:31:40 IST 2025

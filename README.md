# M/S SUMON ENTERPRISE - Backend API

Backend REST API for M/S SUMON ENTERPRISE Construction Company website built with Node.js, Express.js, and MongoDB.

## Features

- RESTful API architecture
- JWT authentication
- File upload (local or Cloudinary)
- Email notifications
- Input validation
- Error handling
- Rate limiting
- Security headers
- CORS support

## Tech Stack

- **Runtime**: Node.js 18.x
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Express-validator
- **Security**: Helmet, bcrypt

## Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env` file

5. Start MongoDB (if running locally):
```bash
mongod
```

6. Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Environment Variables

See `.env.example` for all required environment variables:

- `NODE_ENV`: development or production
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `EMAIL_*`: Email configuration for Nodemailer
- `CLOUDINARY_*`: (Optional) Cloudinary credentials for cloud storage

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register admin
- `POST /api/auth/login` - Login admin
- `GET /api/auth/me` - Get current admin (Protected)
- `POST /api/auth/logout` - Logout (Protected)

### Projects
- `GET /api/projects` - Get all projects (Public)
- `GET /api/projects/featured` - Get featured projects (Public)
- `GET /api/projects/:id` - Get project by ID (Public)
- `GET /api/projects/slug/:slug` - Get project by slug (Public)
- `POST /api/projects` - Create project (Protected)
- `PUT /api/projects/:id` - Update project (Protected)
- `DELETE /api/projects/:id` - Delete project (Protected)

### Inquiries
- `POST /api/inquiries` - Submit inquiry (Public)
- `GET /api/inquiries` - Get all inquiries (Protected)
- `GET /api/inquiries/stats` - Get inquiry statistics (Protected)
- `GET /api/inquiries/:id` - Get inquiry by ID (Protected)
- `PUT /api/inquiries/:id/status` - Update inquiry status (Protected)
- `DELETE /api/inquiries/:id` - Delete inquiry (Protected)

## Project Structure

```
backend/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── utils/           # Utility functions
├── validators/      # Input validators
├── uploads/         # Uploaded files (local storage)
├── app.js           # Express app configuration
├── server.js        # Server entry point
└── package.json     # Dependencies
```

## Scripts

```bash
npm start       # Start production server
npm run dev     # Start development server with nodemon
```

## Security

- Passwords hashed with bcrypt
- JWT token authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- Security headers with Helmet
- CORS configuration
- Protected routes

## Error Handling

All errors return consistent JSON format:
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "statusCode": 400
  }
}
```

## File Upload

Supports both local storage and Cloudinary:
- Set `USE_CLOUDINARY=true` for cloud storage
- Set `USE_CLOUDINARY=false` for local storage
- Images stored in `/uploads` directory (local)
- Maximum file size: 5MB
- Allowed types: JPEG, JPG, PNG, WebP

## Database Models

### Project
- Project information
- Address details
- Location coordinates
- Images
- Specifications
- Status and dates

### Inquiry
- Contact form submissions
- Name, email, phone
- Subject and message
- Status tracking

### Admin
- Admin users
- Authentication credentials
- Role management

## License

Proprietary - M/S SUMON ENTERPRISE

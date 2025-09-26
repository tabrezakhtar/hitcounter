# Hit Counter

A simple, privacy-focused hit counter API built with Hono.js that records anonymized visitor information.

## Features

- Fast and lightweight API built with [Hono.js](https://hono.dev/)
- Privacy-first approach with anonymized data collection
- Simple hit tracking functionality
- RESTful API endpoints
- Modern ES modules support

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- MongoDB (local installation or cloud instance)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hitcounter
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/hitcounter

# Server Configuration  
PORT=3000

# Security Configuration
ALLOWED_DOMAINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com
```

4. Set up MongoDB:
- Install MongoDB locally or use a cloud service (MongoDB Atlas)
- Create a database named `hitcounter` 
- The `logs` collection will be created automatically when the first log entry is saved

5. Start the application:
```bash
npm start
```

The server will start on `http://localhost:3000`

### Development

To run the application with auto-reload during development:
```bash
npm run dev
```

## API Endpoints

### GET /ping
A simple health check endpoint that returns "hello".

**Response:**
```
hello
```

### GET /
Returns basic application information.

**Response:**
```json
{
  "message": "Hono.js app is running!"
}
```

### POST /log
Records anonymized analytics data.

**Request Body:**
```json
{
  "date": "2025-09-26", 
  "project": "my-website"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Log entry created successfully"
}
```

**Notes:**
- IP address is automatically extracted from request headers and anonymized
- User agent is automatically captured and sanitized
- Referrer is captured and cleaned (query parameters removed)
- Localhost requests are ignored
- Only requests from allowed domains are accepted

## Privacy & Data Collection

This hit counter is designed with privacy in mind:

- **Anonymized Data**: No personally identifiable information (PII) is collected
- **IP Anonymization**: IP addresses are masked (e.g., `192.168.1.x`)
- **Referrer Sanitization**: Query parameters and tracking codes removed
- **Input Sanitization**: All data is cleaned to prevent injection attacks
- **No Tracking**: No cookies or persistent tracking mechanisms are used
- **Domain Restrictions**: Only accepts requests from authorized domains

### What Is Collected

- **Date**: Request date (YYYY-MM-DD format)
- **Project**: Project/website identifier  
- **User Agent**: Browser information (sanitized)
- **IP Address**: Anonymized to subnet level
- **Referrer**: Source website (without query parameters)
- **Timestamp**: Server timestamp when request was processed

### What Is Not Collected

- Full IP addresses (only anonymized versions)
- Personal information or identifiers
- Email addresses or contact details
- Device fingerprinting data
- Cross-site tracking data
- Query parameters from URLs
- Localhost/development requests

### Data Storage

Data is stored in MongoDB with the following structure:
```javascript
{
  date: "2025-09-26",
  project: "my-website", 
  userAgent: "Mozilla/5.0 (sanitized)",
  ip: "192.168.1.x",
  referrer: "https://example.com/page",
  timestamp: "2025-09-26T10:30:00.000Z"
}
```

## Configuration

### Environment Variables

Create a `.env` file in the project root with these required variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/hitcounter

# Server Configuration
PORT=3000

# Security Configuration (comma-separated domains)
ALLOWED_DOMAINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com
```

### Database Setup

1. **Install MongoDB:**
   - Local: Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Cloud: Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)

2. **Database Structure:**
   - **Database Name**: `hitcounter` (or as specified in MONGODB_URI)
   - **Collection Name**: `logs` (created automatically)
   - **Indexes**: Consider adding indexes on `date` and `project` fields for better query performance

3. **MongoDB Connection Examples:**
   ```env
   # Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/hitcounter
   
   # MongoDB Atlas
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hitcounter
   
   # MongoDB with authentication
   MONGODB_URI=mongodb://username:password@localhost:27017/hitcounter
   ```

### Security Configuration

**ALLOWED_DOMAINS**: Comma-separated list of domains authorized to send analytics data
- Include protocol (`https://` or `http://`)
- Include all variations (with/without `www.`)
- Add localhost for development: `http://localhost:3000,http://localhost:8080`

Example:
```env
ALLOWED_DOMAINS=https://example.com,https://www.example.com,https://blog.example.com,http://localhost:3000
```

## Client Integration

To track page visits, add this script just before the closing `</body>` tag in your HTML:

```html
<script>
(function(projectName) {
  if (!projectName || typeof projectName !== 'string') {
    console.error('Hit Counter: Project name is required');
    return;
  }
  
  const API_URL = 'https://<YOUR API URL>/log';
  
  function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  }
  
  function sendHit() {
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: getCurrentDate(),
        project: projectName
      }),
      keepalive: true
    }).catch(function(error) {
      console.debug('Analytics request failed:', error);
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sendHit);
  } else {
    sendHit();
  }
})('my-website-name'); // Replace with your project identifier
</script>
```

**Usage Notes:**
- Replace `'my-website-name'` with a unique identifier for your project
- Script is non-blocking and won't affect page load performance
- Fails silently if the API is unavailable
- Only works from domains listed in `ALLOWED_DOMAINS`

## Project Structure

```
hitcounter/
├── index.js          # Main application file
├── package.json      # Project configuration and dependencies
├── test-log.js       # Test utilities
├── .env              # Environment variables (create this)
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Hono.js
- **Server**: @hono/node-server
- **Database**: MongoDB
- **Environment**: dotenv

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help with the hit counter, please:

1. Check the existing issues
2. Create a new issue with detailed information
3. Include steps to reproduce any problems

## Roadmap

Future enhancements may include:

- Database integration for persistent storage
- Analytics dashboard
- Rate limiting and abuse protection
- Additional privacy controls
- Custom hit counter widgets
- Export functionality for collected data

---

Built with love using Hono.js
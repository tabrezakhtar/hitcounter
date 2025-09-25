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

3. Start the application:
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
Returns basic application information and available endpoints.

**Response:**
```json
{
  "message": "Hono.js app is running!",
  "endpoints": ["/ping"]
}
```

## Privacy & Data Collection

This hit counter is designed with privacy in mind:

- **Anonymized Data**: No personally identifiable information (PII) is collected
- **Minimal Logging**: Only essential metrics are recorded
- **No Tracking**: No cookies or persistent tracking mechanisms are used
- **Transparent**: All data collection practices are documented

### What Is Collected

- Request timestamps (for analytics)
- General geographic region (country/city level, not precise location)
- Browser type and version (user agent)
- Referring website (if applicable)

### What Is Not Collected

- IP addresses are not stored permanently
- No personal information
- No device fingerprinting
- No cross-site tracking

## Configuration

The application can be configured using environment variables:

- `PORT`: Server port (default: 3000)

Example:
```bash
PORT=8080 npm start
```
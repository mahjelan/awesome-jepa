# Content Aggregation and Analysis Platform

A modern web application that combines YouTube and Instagram content with AI-powered analysis.

## Features

- YouTube video search and trending videos
- Instagram Reels integration
- AI-powered content analysis
- Real-time updates and caching
- Responsive design
- Error handling and loading states

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- API keys for:
  - YouTube Data API
  - Instagram Graph API
  - OpenAI API

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
# Google Identity Services (OAuth 2.0) - Web application Client ID
GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com

# YouTube Data API v3
REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key_here

# OpenAI
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

# (Optional) Instagram
REACT_APP_INSTAGRAM_APP_ID=your_instagram_app_id_here
REACT_APP_INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
```

4. Configure Google Cloud Console:
- Create an OAuth 2.0 Client ID of type "Web application".
- Add Authorized JavaScript origins for local dev (Parcel default):
  - http://localhost:1234
  - http://127.0.0.1:1234
- Do not set redirect URIs for the Token Client flow used here.
- Publish the OAuth consent screen (or add your test users).

5. Start the development server:
```bash
npm start
```

## Project Structure

```
src/
├── components/
│   └── ContentFeed.tsx
├── services/
│   ├── YouTubeService.ts
│   ├── InstagramService.ts
│   └── OpenAIService.ts
├── styles/
│   └── ContentFeed.css
└── types/
    └── index.ts
```

## API Services

### YouTube Service
- Video search
- Trending videos
- Video details
- Thumbnail generation

### Instagram Service
- Authentication
- Reel fetching
- Token management
- Error handling

### OpenAI Service
- Content generation
- Video analysis
- Rate limiting
- Response caching

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- YouTube Data API
- Instagram Graph API
- OpenAI API
- React
- TypeScript 
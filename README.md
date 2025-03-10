# Lost in Translation

A fun language translation game that takes your text on a journey through multiple languages!

## Features

- Translation Journey: Watch your text transform as it travels through different languages
- Language Guessing Game: Test your language recognition skills
- Leaderboard System: Compete with other players for high scores
- Customizable Translation Path: Choose your own language journey

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`
4. Add your Google Cloud Translation API key to the `.env` file
5. Start the development server: `npm run dev`

## Environment Variables

The following environment variables are required:

- `VITE_GOOGLE_TRANSLATE_API_KEY`: Your Google Cloud Translation API key

To obtain an API key:
1. Go to the Google Cloud Console
2. Create a new project or select an existing one
3. Enable the Cloud Translation API
4. Create credentials (API key)
5. Copy the API key to your `.env` file

## Development

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Vite
- Google Cloud Translation API
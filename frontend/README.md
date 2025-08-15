# PrecisionAds Frontend

This is the frontend application for the PrecisionAds advertising platform.

## Features

- **Multi-role Support**: Admin, Advertiser, and Publisher dashboards
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern UI**: Built with React 18 and TypeScript
- **Component Library**: Reusable UI components
- **Fast Development**: Built with Vite for lightning-fast builds

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Accounts

The application includes demo accounts for testing:

- **Admin**: admin@adtech.com / admin123
- **Advertiser**: advertiser@digital.com / advertiser123  
- **Publisher**: publisher@brand.com / publisher123

## Available Scripts

- `npm run dev` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm run preview` - Preview the production build locally

## Project Structure

```
src/
├── components/          # React components
│   ├── dashboards/     # Role-specific dashboards
│   └── ui/            # Reusable UI components
├── lib/               # Utility functions
├── styles/            # Global styles
└── App.tsx           # Main application component
```

## Technologies Used

- React 18
- TypeScript
- Tailwind CSS
- Vite (Build tool)
- Lucide React (icons)
- Sonner (toasts) 
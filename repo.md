# KeepWatch Web Repository

## Overview
KeepWatch is a modern SaaS telemetry platform for monitoring application systems, uptime, and logs. It provides real-time insights into infrastructure health, helping teams stay ahead of issues before they impact users.

## Project Information
- **Name**: keepwatch-web
- **Type**: Web Application
- **Framework**: React Router v7 with SSR
- **Language**: TypeScript

## Tech Stack

### Core Technologies
- **React Router 7.9.2** - Full-stack framework with server-side rendering
- **React 19.1.1** - UI library
- **TypeScript 5.9.2** - Type safety
- **Vite 7.1.7** - Build tool and dev server
- **TailwindCSS 4.1.13** - Utility-first CSS framework

### UI Components & Libraries
- **Radix UI** - Accessible component primitives (checkbox, label, popover, slot)
- **Lucide React** - Icon library
- **React Icons** - Additional icon set
- **class-variance-authority** - Component variant management
- **tailwind-merge** - Tailwind class merging utility

### Utilities
- **RxJS 7.8.2** - Reactive programming
- **Moment.js 2.30.1** - Date/time manipulation
- **Validator 13.15.20** - String validation
- **clsx** - Conditional class names

## Project Structure

```
keepwatch-web/
├── app/
│   ├── components/
│   │   ├── project/
│   │   │   ├── cards/          # APIKeyCard, AlarmCard, LogCard
│   │   │   ├── dialogs/        # CRUD dialogs for projects, API keys
│   │   │   └── tabs/           # Project detail tabs
│   │   ├── ui/                 # Reusable UI components (button, card, input, etc.)
│   │   ├── AddAlarmForm.tsx
│   │   └── DashboardHeader.tsx
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   ├── auth.server.ts      # Server-side authentication
│   │   └── utils.ts            # Utility functions
│   ├── routes/
│   │   ├── home.tsx            # Dashboard/home page
│   │   ├── login.tsx           # Authentication
│   │   ├── signup.tsx
│   │   ├── logout.tsx
│   │   ├── account.settings.tsx
│   │   ├── account.billing.tsx
│   │   ├── project.$projectId.tsx
│   │   ├── project.$projectId.logs.$logId.tsx
│   │   └── projects.invite.$inviteId.tsx
│   ├── welcome/                # Welcome page assets
│   ├── app.css                 # Global styles
│   ├── root.tsx                # Root layout
│   └── routes.ts               # Route configuration
├── public/
│   └── favicon.ico
├── .zencoder/                  # Zencoder configuration
├── Dockerfile                  # Multi-stage Docker build
├── package.json
├── tsconfig.json
├── vite.config.ts
└── react-router.config.ts
```

## Key Features

### Monitoring Capabilities
- **System Uptime Monitoring** - Track availability and performance metrics
- **Application Telemetry** - Deep insights into application behavior
- **Log Management** - Real-time log aggregation and analysis
- **Instant Alerts** - Immediate notifications for issues

### Application Features
- User authentication (login/signup)
- Project management
- API key management
- Alarm/alert configuration
- Log viewing and filtering
- Account settings and billing
- Team invitations
- Dashboard with project overview

## Design System

### Color Palette
- **Primary Dark**: `#001542` - Deep navy blue for headers and important elements
- **Brand Color**: `#085454` - Teal/cyan for primary actions and brand identity
- **Neutral**: `#7A7A7A` - Gray for secondary text and subtle elements
- **Base**: `#FFFFFF` - White for backgrounds and contrast
- **Accent**: `#FFB30D` - Vibrant orange for highlights and calls-to-action

## Development

### Prerequisites
- Node.js 20+
- npm

### Scripts
```bash
npm run dev        # Start development server (http://localhost:5173)
npm run build      # Create production build
npm run start      # Start production server
npm run typecheck  # Run TypeScript type checking
```

### TypeScript Configuration
- **Target**: ES2022
- **Module**: ES2022
- **JSX**: react-jsx
- **Strict Mode**: Enabled
- **Path Alias**: `~/*` maps to `./app/*`

## Deployment

### Docker
Multi-stage Dockerfile optimized for production:
1. Development dependencies installation
2. Production dependencies installation
3. Build stage
4. Final runtime image (Node 20 Alpine)

```bash
docker build -t keepwatch-web .
docker run -p 3000:3000 keepwatch-web
```

### Supported Platforms
- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment
Deploy the `build/` directory output with:
- `build/client/` - Static assets
- `build/server/` - Server-side code

## Architecture

### Routing
React Router v7 file-based routing with:
- Server-side rendering (SSR)
- Nested routes
- Dynamic route parameters
- Meta tag configuration per route

### Component Organization
- **UI Components**: Reusable, accessible components in `app/components/ui/`
- **Feature Components**: Domain-specific components in `app/components/project/`
- **Route Components**: Page-level components in `app/routes/`

### API Integration
Centralized API client in `app/lib/api.ts` handling:
- Project management
- Log retrieval
- Alarm configuration
- User authentication
- Team management

## Development Workflow
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Make changes with HMR
4. Type check: `npm run typecheck`
5. Build for production: `npm run build`
6. Test production build: `npm run start`

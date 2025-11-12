# KeepWatch Web

A modern SaaS telemetry platform for monitoring your application systems, uptime, and logs. KeepWatch provides real-time insights into your infrastructure health, helping you stay ahead of issues before they impact your users.

## Overview

KeepWatch is a comprehensive monitoring solution designed to give you full visibility into your applications and systems. Whether you're running microservices, monoliths, or serverless architectures, KeepWatch helps you:

- **Monitor System Uptime** - Track availability and performance metrics across all your services
- **Application Telemetry** - Gain deep insights into your application behavior and performance
- **Log Management** - Receive, aggregate, and analyze application and system logs in real-time
- **Instant Alerts** - Get notified immediately when things go wrong via email, Slack, or webhooks
- **Team Collaboration** - Invite team members to projects with role-based access control

## Tech Stack

### Core Technologies

- **React 19.1.1** - Modern React with latest features
- **React Router 7.9.2** - Full-stack routing with server-side rendering
- **TypeScript 5.9.2** - Type safety and enhanced developer experience
- **Vite 7.1.7** - Lightning-fast build tool and development server
- **TailwindCSS 4.1.13** - Utility-first CSS framework

### UI Components

- **Radix UI** - Accessible, unstyled component primitives
  - Checkbox, Label, Popover, Slot components
- **Lucide React** - Beautiful and consistent icon set
- **React Icons** - Additional icon library
- **class-variance-authority** - CSS class composition utilities
- **tailwind-merge** - Intelligent Tailwind class merging

### Utilities & Libraries

- **Moment.js & Moment Timezone** - Date and time handling with timezone support
- **RxJS** - Reactive programming for event streams
- **Validator** - String validation and sanitization
- **isbot** - Bot detection for analytics

### Authentication

- **Google OAuth** - Sign in with Google integration via @react-oauth/google

## Project Structure

```
keepwatch-web/
├── app/                          # Application source code
│   ├── components/               # React components
│   │   ├── ui/                  # UI primitives (buttons, inputs, cards, etc.)
│   │   ├── project/             # Project-specific components
│   │   │   ├── cards/           # Card components (API keys, alarms, logs)
│   │   │   ├── dialogs/         # Modal dialogs (create, edit, delete)
│   │   │   └── tabs/            # Tab views (overview, logs, settings, etc.)
│   │   └── DashboardHeader.tsx  # Main dashboard header
│   ├── lib/                     # Library code
│   │   ├── api.ts              # API client functions
│   │   ├── auth.server.ts      # Server-side authentication
│   │   ├── timezones.ts        # Timezone utilities
│   │   └── utils.ts            # General utilities
│   ├── routes/                  # Route handlers
│   │   ├── home.tsx            # Dashboard home
│   │   ├── login.tsx           # Login page
│   │   ├── signup.tsx          # Registration page
│   │   ├── forgot-password.tsx # Password recovery
│   │   ├── account.settings.tsx # User settings
│   │   ├── account.billing.tsx  # Billing/subscription management
│   │   ├── project.$projectId.tsx              # Project detail view
│   │   ├── project.$projectId.logs.$logId.tsx  # Individual log view
│   │   └── projects.invite.$inviteId.tsx       # Project invitation handling
│   ├── welcome/                 # Welcome page assets
│   ├── routes.ts               # Route configuration
│   ├── root.tsx                # Root layout component
│   └── app.css                 # Global styles
├── public/                      # Static assets
├── build/                       # Production build output
│   ├── client/                 # Client-side assets
│   └── server/                 # Server-side bundle
├── .react-router/              # React Router generated files
├── Dockerfile                   # Container configuration
├── package.json                 # Project dependencies
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
└── react-router.config.ts      # React Router configuration
```

## Key Features

### Authentication & User Management

- Email/password authentication with 2FA support
- Google OAuth integration
- Password recovery workflow
- Email verification
- User profile management with timezone support
- Account deletion with verification

### Project Management

- Create and manage multiple monitoring projects
- Project settings and configuration
- Team collaboration with role-based access
- Project invitations via email
- API key management with constraints:
  - IP restrictions
  - Referer restrictions
  - Rate limits
  - Expiration dates
  - Environment restrictions
  - Origin restrictions
  - User agent restrictions

### Log Management

- Real-time application and system log ingestion
- Advanced search and filtering:
  - By level, environment, hostname, category
  - Message and stack trace search
  - Custom time ranges
  - Full-text document search
- Individual log detail views
- Bulk log deletion
- Pagination support

### Alarms & Notifications

- Create custom alarms based on log criteria:
  - Log type (application/system)
  - Log levels
  - Message patterns
  - Environment
  - Categories
- Multiple delivery methods:
  - Email notifications
  - Slack webhooks
  - Custom webhooks
- Alarm management (create, update, delete)

### Usage & Billing

- Usage quota tracking
- Subscription plan management
- Billing period monitoring
- Log usage statistics

## API Integration

The application communicates with a backend API (configurable via `VITE_API_BASE_URL`). The API client in `app/lib/api.ts` provides typed functions for:

- User authentication and management
- Project CRUD operations
- API key management
- Log search and retrieval
- Alarm configuration
- Team member management
- Usage and subscription tracking

All API requests support both server-side (with explicit token) and client-side (with cookies) authentication.

## Design System

### Color Palette

- **Primary Dark** - `#001542` - Deep navy blue for headers and important elements
- **Brand Color** - `#085454` - Teal/cyan for primary actions and brand identity
- **Neutral** - `#7A7A7A` - Gray for secondary text and subtle elements
- **Base** - `#FFFFFF` - White for backgrounds and contrast
- **Accent** - `#FFB30D` - Vibrant orange for highlights and calls-to-action

### Component Library

The application uses a custom component library built on Radix UI primitives, including:

- Buttons (multiple variants)
- Input fields and forms
- Cards and containers
- Dialogs and modals
- Popovers and dropdowns
- Checkboxes and labels
- Pagination controls
- Toast notifications
- Breadcrumb navigation
- Select dropdowns

## Development

### Prerequisites

- Node.js 20+
- npm (or pnpm/yarn/bun)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file with the following variables:

```env
VITE_API_BASE_URL=http://localhost:3300/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Development Server

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Type Checking

Run TypeScript type checking:

```bash
npm run typecheck
```

This will generate React Router types and run the TypeScript compiler.

### Building for Production

Create a production build:

```bash
npm run build
```

The build output will be in the `build/` directory:
- `build/client/` - Static client assets
- `build/server/` - Server-side bundle

### Running Production Build

```bash
npm run start
```

## Deployment

### Docker Deployment

The project includes a multi-stage Dockerfile optimized for production:

```bash
# Build the Docker image
docker build -t keepwatch-web .

# Run the container
docker run -p 3000:3000 keepwatch-web
```

The Docker image:
- Uses Node 20 Alpine for minimal size
- Multi-stage build for optimization
- Includes only production dependencies in final image
- Runs on port 3000

### Supported Platforms

The containerized application can be deployed to:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway
- Heroku
- Any Docker-compatible platform

### Traditional Deployment

Deploy the output of `npm run build`:

```
├── package.json
├── package-lock.json
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

The built-in app server is production-ready and handles:
- Server-side rendering
- Static asset serving
- API proxying (if configured)

## Code Statistics

- **Total Lines of Code**: ~11,186 lines (TypeScript/TSX)
- **Components**: 30+ React components
- **Routes**: 10 main routes with nested routes
- **API Functions**: 50+ typed API client functions

## Recent Development Activity

Recent commits show active development on:

- Google OAuth integration
- User timezone support
- Password recovery workflow
- API key constraints and management
- User invitation system
- 2FA authentication
- Category-based log filtering
- Alarm system enhancements

## Architecture Highlights

### Server-Side Rendering

The application uses React Router's SSR capabilities for:
- Improved initial page load performance
- Better SEO
- Progressive enhancement

### Type Safety

Full TypeScript coverage with:
- Strict mode enabled
- API response types
- Component prop types
- Route parameter types

### Authentication Flow

1. User authenticates via email/password or Google OAuth
2. Server returns JWT token
3. Token stored in HTTP-only cookies (server-side) or localStorage (client-side)
4. All API requests include token via Authorization header or cookies
5. Token validated on each request

### State Management

- Server-side data fetching via React Router loaders
- Client-side state in React components
- RxJS for reactive event streams

## Security Features

- HTTP-only cookies for token storage
- CSRF protection
- Input validation and sanitization
- API key constraints (IP, referer, rate limits, etc.)
- 2FA support
- Email verification
- Secure password reset flow
- Account deletion verification

## Browser Support

The application targets modern browsers with ES2022+ support:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

This project is private and proprietary.

## Contributing

This is a private repository. For access and contribution guidelines, please contact the project owner.

---

Built with React Router and TypeScript

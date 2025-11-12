# KeepWatch

A modern SaaS telemetry platform for monitoring your application systems, uptime, and logs. KeepWatch provides real-time insights into your infrastructure health, helping you stay ahead of issues before they impact your users.

## About

KeepWatch is designed to give you comprehensive visibility into your applications and systems. Whether you're running microservices, monoliths, or serverless architectures, KeepWatch helps you:

- **Monitor System Uptime** - Track availability and performance metrics across all your services
- **Application Telemetry** - Gain deep insights into your application behavior and performance
- **Log Management** - Receive, aggregate, and analyze application and system logs in real-time
- **Instant Alerts** - Get notified immediately when things go wrong

## Tech Stack

Built with modern web technologies:

- ⚡️ React Router with server-side rendering
- 🔒 TypeScript for type safety
- 🎨 TailwindCSS for styling
- 🚀 Vite for fast builds and HMR

## Design System

### Color Palette

Our brand colors create a professional and modern aesthetic:

- **Primary Dark** - `#001542` - Deep navy blue for headers and important elements
- **Brand Color** - `#085454` - Teal/cyan for primary actions and brand identity
- **Neutral** - `#7A7A7A` - Gray for secondary text and subtle elements
- **Base** - `#FFFFFF` - White for backgrounds and contrast
- **Accent** - `#FFB30D` - Vibrant orange for highlights and calls-to-action

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
# Cloud Build deployment test
# Retry deployment with proper permissions
# Deployment test with proper service account
# Trigger automated Cloud Build deployment

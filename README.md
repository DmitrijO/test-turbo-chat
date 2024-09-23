
# My Fullstack Application

This project is built using Turborepo and Docker Compose, including both Next.js and Nest.js applications.

## Getting Started

To start the application using Docker Compose, run the following command:

```sh
docker-compose up --build
```

Alternatively, you can develop the project locally using Turborepo:

```sh
turbo dev
```

## What's inside?

This project includes the following apps:

### Apps and Packages

- `web`: a [Next.js](https://nextjs.org/) app
- `server`: a [Nest.js](https://nestjs.com/) app
- `directus`: a Directus app(docker) for admin management


## Environment Variables

Before running the application, ensure you set up the following environment variables in your `.env` files:

### Next.js (Frontend)

```env
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_****
```

### Nest.js (Backend)

```env
DIRECTUS_ADMIN_URL=http://localhost:8055
DIRECTUS_ADMIN_EMAIL=admin@example.com
DIRECTUS_ADMIN_PASSWORD=password
STRIPE_SECRET_KEY=sk_test_***
JWT_SECRET=MY_NEW_SECRET
```

## App Module Configuration

To ensure proper database connection, configure the `host` parameter in the `app.module.ts` file according to your environment:

- **For Docker:**

```typescript
host: 'db',
// host: 'localhost',
```

- **For Local Development:**

```typescript
// host: 'db',
host: 'localhost',
```

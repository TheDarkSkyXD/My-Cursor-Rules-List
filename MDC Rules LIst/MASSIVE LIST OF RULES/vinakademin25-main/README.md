# Vinakademin - Wine Academy Platform

This is the repository for Vinakademin, a web platform built with Next.js, Payload CMS, and Shadcn UI.

## Project Overview

Vinakademin aims to be a comprehensive guide to the world of wine, offering courses, articles, a curated wine list, and potentially other features. It uses Payload CMS for flexible content management and a modern Next.js frontend built with Shadcn UI components and Tailwind CSS for styling.

## Key Technologies

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **CMS:** [Payload CMS](https://payloadcms.com/)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** (Likely MongoDB or PostgreSQL - check your `.env` configuration)
- **Package Manager:** [pnpm](https://pnpm.io/)

## Features

- **Payload CMS Backend:** For managing users, media, and potentially custom collections for courses, articles, wines, etc. Located at `/admin`.
- **Next.js Frontend:** SSR/SSG application providing the user interface.
- **Authentication:** User login/registration handled by Payload.
- **Responsive Sidebar Navigation:** Collapsible sidebar for navigating the application.
- **Theme Switching:** Light and Dark mode support.
- **Shadcn UI Components:** Leverages a variety of pre-built, customizable UI components.

## Getting Started - Local Development

To set up and run this project locally, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/fredrik9X6/vinakademin.git # Replace with your repo URL
    cd vinakademin
    ```

2.  **Set up Environment Variables:**

    - Copy the example environment file:
      ```bash
      cp .env.example .env
      ```
    - Edit the `.env` file and provide the necessary values, especially:
      - `PAYLOAD_SECRET`: A strong secret key for Payload authentication.
      - `MONGODB_URI` or `POSTGRES_URI`: Your database connection string. (Choose one based on your Payload DB adapter).
      - Potentially other keys depending on email adapters, cloud storage, etc.

3.  **Install Dependencies:**

    ```bash
    pnpm install
    ```

4.  **Generate Payload Types:**

    ```bash
    pnpm payload generate:types
    ```

    (Run this again if you modify Payload collections).

5.  **Run the Development Server:**

    ```bash
    pnpm dev
    ```

    This command starts both the Next.js frontend and the Payload CMS backend concurrently.

6.  **Access the App:**

    - Frontend: Open [`http://localhost:3000`](http://localhost:3000)
    - Payload Admin: Open [`http://localhost:3000/admin`](http://localhost:3000/admin)

7.  **Create First Admin User:** Navigate to the `/admin` panel and follow the on-screen instructions to create your first Payload admin user.

## Available Scripts

- `pnpm dev`: Starts the development server for both Next.js and Payload.
- `pnpm build`: Builds the Next.js application for production.
- `pnpm start`: Starts the production server (requires a build first).
- `pnpm lint`: Lints the codebase using Next.js ESLint configuration.
- `pnpm payload <command>`: Run Payload-specific CLI commands (e.g., `pnpm payload migrate`).
- `pnpm generate:types`: Regenerates TypeScript types based on your Payload config.

## Docker (Optional)

If you prefer using Docker for local development:

1.  Ensure Docker and Docker Compose are installed.
2.  Follow steps 1 and 2 from the [Local Development](#getting-started---local-development) section.
3.  Modify the `MONGODB_URI` in `.env` to point to the Docker container (e.g., `mongodb://127.0.0.1/vinakademin`).
4.  Ensure the `docker-compose.yml` file is configured correctly for your database service.
5.  Run `docker-compose up -d` (the `-d` runs it in the background).
6.  Continue with steps 4-7 from the [Local Development](#getting-started---local-development) section.

## Questions

If you have any issues or questions specific to Payload CMS, reach out via their [Discord](https://discord.com/invite/payload) or [GitHub discussions](https://github.com/payloadcms/payload/discussions). For project-specific questions, please use this repository's issue tracker.

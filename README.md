# Academia LMS

Academia is a modern learning management platform designed to help schools, teachers, and students work better together. It offers a clean user experience, smooth classroom workflows, and secure campus operations.

## Key Features

- **Student Experience**
  - Central dashboard for classes, assignments, attendance, and performance.
  - Quick access to study materials and progress tracking.
  - Simple, polished interface for classroom participation.

- **Teacher Productivity**
  - Lesson planning and classroom management tools.
  - Gradebook and attendance management in one place.
  - Messaging and resource distribution for faster collaboration.

- **School Management**
  - Attendance and fee tracking with clear dashboards.
  - Reporting that helps school leaders monitor performance.
  - Secure access control for students, teachers, and staff.

- **Reporting & Analytics**
  - Built-in insights for attendance, academic progress, and finance.
  - Fast search and role-aware navigation for every campus user.
  - Clean, modern visuals that support operational decision-making.

## Deployment

Academia is configured for deployment on Vercel using `next build` and `.next` as the output directory.

### Recommended steps

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the project:
   ```bash
   npm run build
   ```
3. Run locally:
   ```bash
   npm run dev
   ```

### Vercel configuration

The existing `vercel.json` is set up for a Next.js deployment and includes runtime settings for API routes. It expects these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Set them in your Vercel project settings before deploying.

## GitHub Repository Setup

This project can be initialized as a Git repository with:

```bash
git init
git add .
git commit -m "Initial Academia LMS project"
```

To publish to GitHub, create a new repository and add it as a remote:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

## Notes

- The app is built with Next.js, Tailwind CSS, React, and Supabase.
- Sensitive environment variables should never be committed to the repository.
- Keep `.env.local` and any secret files out of source control.

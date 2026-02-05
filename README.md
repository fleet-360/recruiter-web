# Recruiter Web Dashboard

A React/Next.js web application for recruiters to manage jobs, candidates, matches, and chat with candidates.

## Features

- **Authentication**: Login/signup with Supabase Auth
- **Jobs Management**: Create, edit, and delete job postings
- **Candidates**: View candidates who swiped on your jobs
- **Matches**: Manage matches and chat with candidates
- **Profile**: Update recruiter profile information
- **Real-time Chat**: Real-time messaging with candidates using Supabase Realtime

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Backend (Auth, Database, Storage, Realtime)
- **React Query (TanStack Query)** - Server state management
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Recharts** - Charts and analytics
- **React Dropzone** - File uploads

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## Project Structure

```
recruiter-web/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   ├── jobs/              # Jobs management pages
│   ├── candidates/        # Candidates pages
│   ├── matches/           # Matches and chat pages
│   └── profile/           # Profile management page
├── components/            # React components
│   ├── layout/           # Layout components (Sidebar, TopBar)
│   └── jobs/             # Job-related components
├── contexts/             # React contexts (AuthContext)
├── hooks/                # Custom React hooks
│   ├── useJobs.ts       # Jobs queries and mutations
│   ├── useCandidates.ts # Candidates queries
│   ├── useMatches.ts    # Matches queries and mutations
│   ├── useMessages.ts   # Messages queries and mutations
│   └── useProfile.ts    # Profile mutations
├── lib/                  # Utilities and services
│   ├── supabase.ts      # Supabase client
│   ├── react-query.tsx  # React Query provider
│   └── storage.ts       # File upload utilities
└── types/                # TypeScript types
    └── database.ts      # Database type definitions
```

## Features in Detail

### Authentication
- Email/password authentication
- Role-based access (only recruiters can access)
- Protected routes with middleware
- Session management

### Jobs Management
- List all jobs with search and filters
- Create new job postings with:
  - Title, company, description
  - Location (with city search)
  - Salary range
  - PDF document upload
  - Image upload
- Edit existing jobs
- Delete jobs

### Candidates
- View candidates who swiped right on your jobs
- Filter and search candidates
- View candidate profiles
- Create matches with candidates

### Matches & Chat
- View all matches
- Real-time chat with candidates
- Message history
- Auto-scroll to latest message

### Profile
- Update profile information
- Upload avatar
- Manage company details

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Self-hosted with Docker

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Database Setup

This application uses the same Supabase database as the mobile app. Make sure:

1. The `profiles` table has a `role` column with values 'candidate' or 'recruiter'
2. The `jobs` table is set up with all required columns
3. The `matches` and `messages` tables are configured
4. Row Level Security (RLS) policies are set up correctly
5. Realtime is enabled for the `messages` table

## Real-time Setup

To enable real-time messaging, make sure Realtime is enabled for the `messages` table in Supabase:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
```

## Storage Buckets

The following Supabase Storage buckets are required:

- `avatars` - For profile pictures
- `job-documents` - For job PDFs
- `job-images` - For job images

Make sure these buckets exist and have proper RLS policies.

## License

Private - All rights reserved

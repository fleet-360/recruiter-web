# Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

## Supabase Setup

### Database Requirements

The application uses the same database schema as the mobile app. Ensure the following tables exist:

- `profiles` - User profiles with `role` column ('candidate' or 'recruiter')
- `jobs` - Job postings
- `swipes` - Swipe interactions
- `matches` - Matches between recruiters and candidates
- `messages` - Chat messages

### Row Level Security (RLS)

Make sure RLS policies are configured:
- Recruiters can only see/edit their own jobs
- Recruiters can see candidates who swiped on their jobs
- Recruiters can see matches they're part of
- Recruiters can see messages in their matches

### Realtime Setup

Enable Realtime for the `messages` table:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
```

Run this in the Supabase SQL Editor.

### Storage Buckets

Create the following storage buckets in Supabase:

1. **avatars** - For profile pictures
   - Public access
   - Max file size: 5MB
   - Allowed types: image/*

2. **job-documents** - For job PDFs
   - Public access
   - Max file size: 10MB
   - Allowed types: application/pdf

3. **job-images** - For job images
   - Public access
   - Max file size: 5MB
   - Allowed types: image/*

### Storage Policies

Set up RLS policies for storage buckets to allow:
- Authenticated users to upload files
- Public read access for uploaded files

## Testing

1. **Create a recruiter account:**
   - Go to `/auth/signup`
   - Sign up with email/password
   - Make sure the profile has `role = 'recruiter'`

2. **Create a job:**
   - Go to `/jobs/new`
   - Fill in job details
   - Upload documents/images if needed

3. **View candidates:**
   - Go to `/candidates`
   - See candidates who swiped on your jobs

4. **Create matches:**
   - Click "Match" on a candidate
   - Go to `/matches` to see your matches

5. **Chat:**
   - Click on a match
   - Send messages (real-time updates should work)

## Troubleshooting

### Authentication Issues

- Make sure Supabase URL and keys are correct
- Check that the user's profile has `role = 'recruiter'`
- Verify RLS policies allow access

### Real-time Not Working

- Check that Realtime is enabled for `messages` table
- Verify the SQL migration was run
- Check browser console for errors

### File Upload Issues

- Verify storage buckets exist
- Check bucket policies allow uploads
- Ensure file sizes are within limits

### Build Errors

- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors: `npm run build`
- Clear `.next` folder and rebuild

## Production Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Make sure to set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Use production Supabase credentials, not development ones.


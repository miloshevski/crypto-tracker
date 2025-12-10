# Crypto Tracker - Setup Instructions

## Overview
This is a cryptocurrency tracking application built with Next.js, Supabase, and TailwindCSS. Users can view real-time crypto data, compare coins, and manage their favorite cryptocurrencies.

## Features Implemented

### 1. Authentication (Supabase)
- User registration with email/password
- User login with email/password
- OAuth support (Google & GitHub - requires configuration)
- Session management
- Logout functionality
- Protected routes (Profile page)

### 2. Favorites System
- Add/remove coins to favorites (requires login)
- Favorites stored in Supabase database
- View all favorited coins in Profile page
- Persistent across sessions
- Login prompt for non-authenticated users

### 3. Coin Comparison
- Select up to 5 coins for comparison
- Visual charts showing price trends
- Performance metrics
- Side-by-side comparison view

### 4. User Profile
- View user information
- Display favorited coins
- Settings tab
- Account management

## Setup Steps

### 1. Environment Variables
Your `.env` file is already configured with:
```
NEXT_PUBLIC_SUPABASE_URL=https://xsukomrokaajqovbhsmu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Supabase Database Setup

#### Run the SQL Schema
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/xsukomrokaajqovbhsmu
2. Navigate to: **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run** to execute the script

This will create:
- `user_favorites` table
- Necessary indexes for performance
- Permissions for database access

#### Verify Setup
1. Go to **Table Editor** in Supabase Dashboard
2. Confirm `user_favorites` table exists
3. Table structure:
   - `id` (UUID, primary key)
   - `user_id` (UUID, references auth.users)
   - `coin_symbol` (VARCHAR)
   - `coin_name` (VARCHAR)
   - `created_at` (TIMESTAMP)

### 3. Supabase Authentication Configuration

#### Enable Email Authentication
1. Go to: **Authentication → Providers**
2. Ensure **Email** provider is enabled
3. Configure email settings (can use Supabase's default for development)

#### Configure Site URL
1. Go to: **Authentication → URL Configuration**
2. Set **Site URL**: `http://localhost:3000`
3. Add **Redirect URLs**: `http://localhost:3000/**`

#### (Optional) Enable OAuth Providers
For **Google OAuth**:
1. Go to: **Authentication → Providers → Google**
2. Enable Google provider
3. Add your Google OAuth credentials (requires Google Console setup)

For **GitHub OAuth**:
1. Go to: **Authentication → Providers → GitHub**
2. Enable GitHub provider
3. Add your GitHub OAuth credentials (requires GitHub OAuth App setup)

### 4. Start Development Server

```bash
cd Domashna-2/crypto_tracker
npm install  # If not already done
npm run dev
```

Your app will be available at: http://localhost:3000

## Testing the Application

### 1. Test User Registration
1. Navigate to http://localhost:3000/register
2. Fill in the registration form
3. Click "Create Account"
4. You should be redirected to the home page
5. User info should appear in the navbar

### 2. Test Login
1. Navigate to http://localhost:3000/login
2. Enter your credentials
3. Click "Sign In"
4. You should be redirected to the home page

### 3. Test Favorites (Requires Login)
1. Ensure you're logged in
2. Click the star icon on any coin
3. The star should turn yellow (favorited)
4. Click the star again to unfavorite
5. Navigate to http://localhost:3000/profile
6. You should see your favorited coins

### 4. Test Favorites Without Login
1. Log out if logged in
2. Try clicking the star icon on a coin
3. You should see a confirmation dialog asking you to login
4. Clicking "OK" should redirect to the login page

### 5. Test Coin Comparison
1. Select 2-5 coins by clicking "Compare" button on each
2. Click the floating "Compare" button at the bottom right
3. You should see a comparison page with charts

### 6. Test Compare Button in Navbar
1. Without selecting any coins, click "Compare" in navbar
2. Should show alert: "No coins are selected for comparison"
3. Select 1 coin and try again
4. Should show alert about needing at least 2 coins
5. Select 2+ coins and click "Compare"
6. Should navigate to comparison page

### 7. Test Profile Page
1. Ensure you're logged in
2. Click "Profile" in the navbar
3. View your account information
4. Switch between "Favorite Coins" and "Settings" tabs
5. Try removing a favorite from the profile page

## File Structure

```
Domashna-2/crypto_tracker/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── coins/
│   │   │   │   ├── route.js
│   │   │   │   └── [symbol]/route.js
│   │   │   └── favorites/
│   │   │       └── route.js          # Favorites CRUD API
│   │   ├── coin/[symbol]/
│   │   │   └── page.js
│   │   ├── compare/
│   │   │   └── page.js
│   │   ├── login/
│   │   │   └── page.js                # Login page
│   │   ├── register/
│   │   │   └── page.js                # Registration page
│   │   ├── profile/
│   │   │   └── page.js                # User profile with favorites
│   │   ├── layout.js                  # Root layout with AuthProvider
│   │   └── page.js                    # Home page with coin list
│   ├── contexts/
│   │   └── AuthContext.js             # Authentication context
│   ├── hooks/
│   │   └── useFavorites.js            # Favorites management hook
│   └── lib/
│       └── supabase.js                # Supabase client
├── .env                               # Environment variables
├── supabase-schema.sql                # Database schema
└── SETUP_INSTRUCTIONS.md              # This file
```

## API Endpoints

### Coins API
- `GET /api/coins` - Get all coins
- `GET /api/coins/[symbol]` - Get specific coin data with historical prices

### Favorites API (Requires Authentication)
- `GET /api/favorites` - Get user's favorite coins
- `POST /api/favorites` - Add coin to favorites
- `DELETE /api/favorites?symbol=XXX` - Remove coin from favorites

## Key Components

### Authentication
- **AuthContext** (`src/contexts/AuthContext.js`): Manages user authentication state
- **useAuth Hook**: Provides `user`, `signIn`, `signUp`, `signOut` functions

### Favorites
- **useFavorites Hook** (`src/hooks/useFavorites.js`): Manages favorites state
- Provides: `favorites`, `isFavorite()`, `toggleFavorite()`, `refetch()`

## Security Notes

### Row Level Security (RLS)
The database is configured with RLS **disabled** for the `user_favorites` table. This means:
- Authentication is handled at the API level (via Bearer tokens)
- Direct database access would allow viewing/modifying all favorites
- For production, consider enabling RLS for additional security layer

### Authentication Flow
1. User logs in via Supabase Auth
2. Access token is stored in session
3. API endpoints verify token before allowing operations
4. Non-authenticated users are blocked from favorite operations

## Troubleshooting

### "supabaseUrl is required" Error
- Check that `.env` file exists in the correct directory
- Verify `NEXT_PUBLIC_SUPABASE_URL` is spelled correctly (with "URL" not "UR")
- Restart the dev server after changing `.env`

### Favorites Not Saving
1. Verify Supabase table was created (check Table Editor)
2. Check browser console for API errors
3. Ensure you're logged in
4. Verify authentication token in Network tab

### OAuth Not Working
1. Ensure providers are enabled in Supabase Dashboard
2. Configure OAuth credentials in respective platforms (Google Console, GitHub Settings)
3. Add authorized redirect URIs in OAuth apps

### Can't Access Profile Page
- Ensure you're logged in
- Profile page redirects to login if not authenticated
- Check that AuthContext is properly wrapped in layout.js

## Next Steps

### Optional Enhancements
1. **Enable RLS** for better security (see `supabase-schema.sql`)
2. **Add Password Reset** functionality
3. **Implement Email Verification** for new users
4. **Add Portfolio Tracking** feature
5. **Real-time Price Updates** using Supabase Realtime
6. **Price Alerts** for favorite coins
7. **Export Favorites** to CSV/JSON

### Production Deployment
1. Update Site URL in Supabase to production domain
2. Update redirect URLs for OAuth
3. Enable RLS for database security
4. Add proper error boundaries
5. Implement rate limiting on API endpoints
6. Add monitoring and analytics

## Support

For issues or questions:
1. Check Supabase Dashboard for database/auth issues
2. Review browser console for client-side errors
3. Check Next.js terminal output for server errors
4. Verify all environment variables are set correctly

## Architecture

This application follows the **Pipe and Filter Architecture**:
- Data flows through filters (API → Processing → Display)
- Each component processes and transforms data
- Modular design allows easy modification of individual filters
- Clear separation between data fetching, processing, and rendering

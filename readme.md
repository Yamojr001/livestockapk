# Livestock Data System

## Overview

A mobile-first government livestock data management system built with Expo/React Native and a Laravel backend. The application enables field agents to collect and manage agricultural data across Local Government Areas (LGAs) in Jigawa State, Nigeria. It features role-based access (Admin/Agent), offline-capable data collection, and sync functionality for field operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Expo SDK 54 with React Native 0.81
- **Navigation**: React Navigation v7 with native stack and bottom tabs
- **State Management**: TanStack React Query for server state, React Context for auth/network state
- **Styling**: StyleSheet-based with a custom theming system (light/dark mode support)
- **Animations**: React Native Reanimated for smooth UI interactions

### Role-Based Navigation
The app uses separate tab navigators based on user role:
- **Admin**: Dashboard, Data Management, User Management, Profile (4 tabs)
- **Agent**: Home, My Submissions, Submit Form, Profile (4 tabs)

### Offline-First Data Strategy
- Local storage via AsyncStorage for submissions, users, and sync state
- Pending submissions queue for offline data collection
- Network status monitoring via NetInfo
- Sync status tracking per submission

### Backend Architecture
- **Framework**: Laravel 10+ with PHP 8.1+
- **Database**: MySQL on Hostinger
- **Authentication**: Laravel Sanctum for API token authentication
- **API Pattern**: RESTful endpoints prefixed with `/api/v1`
- **Location**: `laravel-backend/` folder (deploy to Hostinger separately)

### Authentication
- Laravel Sanctum token-based authentication
- Role-based access control (Admin/Agent/Viewer roles)
- New users default to "agent" role
- **First login requires real API connection** - Token is saved persistently
- After first login, offline access is allowed using cached credentials
- Logout clears all tokens and requires fresh API authentication
- Auth state managed via React Context

### Data Collection Features
- **Farmer Photo**: Camera capture or gallery selection using expo-image-picker
- **GPS Location**: Automatic coordinate capture using expo-location
- **Offline Submissions**: Data saved locally and synced when online
- **ID Fields**: NIN, BVN, and VIN (all optional - can fill all, some, or none)
- **Literacy Status**: Literate, Semi-Literate, or Illiterate
- **Livestock Health**: Disease status (Yes/No) with comments field
- All submissions include: farmer info, bank details, LGA, ward, association, animal count

### Project Structure
```
client/              # React Native/Expo frontend
  ├── components/    # Reusable UI components
  ├── screens/       # Screen components
  ├── navigation/    # Navigation configuration
  ├── contexts/      # React contexts (Auth, Network)
  ├── hooks/         # Custom hooks
  ├── lib/           # Utilities (storage, api-config, sync-service)
  └── data/          # Static data (LGA/Ward mappings)
laravel-backend/     # Laravel API backend (for Hostinger deployment)
  ├── app/           # Models, Controllers, Middleware
  ├── config/        # Configuration files
  ├── database/      # Migrations and seeders
  ├── routes/        # API routes
  └── public/        # Entry point for web server
shared/              # Shared types
```

## API Endpoints (Laravel)

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout (requires auth)
- `GET /api/v1/auth/me` - Get current user (requires auth)
- `PUT /api/v1/auth/profile` - Update profile (requires auth)
- `POST /api/v1/auth/change-password` - Change password (requires auth)

### Submissions
- `GET /api/v1/submissions` - List submissions
- `POST /api/v1/submissions` - Create submission
- `GET /api/v1/submissions/stats` - Get statistics
- `POST /api/v1/submissions/sync` - Batch sync offline submissions
- `GET /api/v1/submissions/{id}` - Get single submission
- `PUT /api/v1/submissions/{id}` - Update submission
- `DELETE /api/v1/submissions/{id}` - Delete submission

### Users (Admin only)
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/stats` - User statistics
- `GET /api/v1/users/{id}` - Get single user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

## Deployment

### Laravel Backend (Hostinger)
1. Upload `laravel-backend` folder to Hostinger
2. Configure `.env` with MySQL database credentials
3. Run `composer install`
4. Run `php artisan migrate`
5. Run `php artisan db:seed --class=AdminSeeder`
6. Default admin: admin@jigawa.gov.ng / admin123

### Mobile App Configuration
1. Go to Profile > API Settings
2. Enter your deployed Laravel API URL (e.g., https://yourdomain.com/api/v1)
3. Test connection
4. Save

## Key Libraries
- **expo-location**: GPS coordinates for submission geolocation
- **expo-image-picker**: Camera and gallery image capture
- **@react-native-async-storage/async-storage**: Local data persistence
- **@react-native-community/netinfo**: Network connectivity monitoring
- **expo-haptics**: Tactile feedback for user interactions
- **date-fns**: Date formatting and manipulation

## Role-Based Features
- **Admin Only**: API Settings configuration, User Management
- **All Users**: Change Password, Profile settings, Data submission
- **Agents**: Submit livestock data, View own submissions, Offline data collection

# Livestock Data System

## Overview
A mobile-first government livestock data management system built with Expo/React Native for web, iOS, and Android. The application enables field agents to collect and manage agricultural data across Local Government Areas (LGAs) in Jigawa State, Nigeria.

## Current State
- **Frontend**: Expo SDK 54 with React Native 0.81 running as a web application
- **Backend**: External Laravel API (deployed separately on Hostinger)
- **Status**: Frontend is functional and displays login screen. Backend API is deployed externally.

## Project Architecture

### Frontend
- **Framework**: Expo SDK 54 with React Native 0.81
- **Entry Point**: `client/index.js` -> `client/App.tsx`
- **Navigation**: React Navigation v7 with native stack and bottom tabs
- **State Management**: TanStack React Query for server state, React Context for auth/network state
- **Port**: 5000 (Expo Web)

### Key Directories
```
client/              # React Native/Expo frontend
  ├── components/    # Reusable UI components
  ├── screens/       # Screen components
  ├── navigation/    # Navigation configuration
  ├── contexts/      # React contexts (Auth, Network)
  ├── hooks/         # Custom hooks
  ├── lib/           # Utilities (storage, api-config, sync-service)
  └── data/          # Static data (LGA/Ward mappings)
livestock-api/       # Laravel API backend (deployed to Hostinger)
shared/              # Shared TypeScript types
```

## Running the Application

### Development
The Expo web server runs on port 5000:
```
npx expo start --web --port 5000 --host lan
```

### Backend
The Laravel backend is designed to be deployed on Hostinger separately. See `livestock-api/README.md` for setup instructions.

## Features
- Role-based access (Admin/Agent)
- Offline-capable data collection
- Farmer photo capture
- GPS location tracking
- Livestock health tracking
- Data synchronization

## User Preferences
- Preferred communication style: Simple, everyday language

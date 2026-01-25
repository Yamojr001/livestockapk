# Livestock Data Collection System - Mobile Design Guidelines

## Brand Identity

**Purpose**: Government livestock data management system for field agents and administrators to collect, track, and analyze agricultural data across Local Government Areas (LGAs).

**Aesthetic Direction**: **Professional/Government** - Clean, trustworthy, data-focused with excellent readability. Emphasizes clarity over decoration. Think official government apps that inspire confidence.

**Memorable Element**: Color-coded role indicators and clear data visualization that makes complex information digestible at a glance.

## Architecture Decisions

### Authentication
**Auth Required** - Multi-role system with SSO:
- Apple Sign-In (iOS required)
- Google Sign-In (Android/cross-platform)
- Role-based access: Admin, Agent, Viewer
- Offline-capable: Cache credentials for offline access
- Account screen includes: Role badge, sync status, logout, settings

### Navigation

**Root Navigation**: Tab Navigation (Admin Role - 4 tabs with FAB)
- **Dashboard** - Overview stats and charts
- **Data** - Submissions list and export
- **Users** - User management (admin only)
- **Profile** - Account and settings

**Root Navigation**: Tab Navigation (Agent Role - 3 tabs)
- **My Submissions** - Agent's data entries
- **Submit** (center tab) - New data entry form
- **Profile** - Account and settings

**Floating Action Button**: "New Submission" (for Admin view, positioned bottom-right)

## Screen-by-Screen Specifications

### 1. Login Screen (Stack-Only)
- **Layout**: Center-aligned form with logo at top
- **Header**: None
- **Content**: 
  - App logo/icon (120x120pt)
  - "Livestock Data System" title
  - Role selector (Admin/Agent) - segmented control
  - SSO buttons (Apple/Google)
  - Version number footer
- **Safe Area**: top: insets.top + 40pt, bottom: insets.bottom + 40pt

### 2. Dashboard (Admin - Tab 1)
- **Header**: Transparent, title "Dashboard", right: date range picker icon
- **Content**: ScrollView
  - Stats grid (2x2): Total Submissions, Active Agents, LGAs Covered, This Period
  - Bar chart card: Submissions by LGA (top 10)
  - Pie chart card: By Association (top 6)
  - Admin modules grid (2 columns): Data Management, User Management, System Config, Agent Management
- **Components**: Stat cards with icons, charts, tappable module cards
- **Safe Area**: top: headerHeight + 24pt, bottom: tabBarHeight + 24pt

### 3. Data Management (Admin - Tab 2)
- **Header**: Default with title "Submissions", right: filter + export icons
- **Content**: FlatList
  - Search bar (sticky)
  - Filter chips (LGA, Date, Association)
  - Submission cards: farmer name, LGA, date, livestock count badge
  - Pull-to-refresh
  - Empty state: "No submissions yet"
- **Safe Area**: top: 16pt, bottom: tabBarHeight + 16pt

### 4. User Management (Admin - Tab 3)
- **Header**: Default with title "Users", right: add user icon
- **Content**: SectionList (sections: Admins, Agents, Pending)
  - Search bar
  - User cards: avatar, name, role badge, status indicator, actions (edit/deactivate)
  - Empty state: "No users in this category"
- **Safe Area**: top: 16pt, bottom: tabBarHeight + 16pt

### 5. Profile (All Roles - Tab 4/3)
- **Header**: Transparent with title "Profile"
- **Content**: ScrollView
  - User avatar (editable, 100pt diameter)
  - Name and role badge
  - Sync status card (online/offline, last sync time)
  - Settings list: Notifications, Theme, Language, Help
  - Danger zone (nested): Logout, Delete Account
- **Safe Area**: top: headerHeight + 24pt, bottom: tabBarHeight + 24pt

### 6. Submission Form (Agent - Tab 2 or Modal)
- **Header**: Default with title "New Submission", left: cancel, right: none
- **Content**: Scrollable form
  - Form fields: Farmer Name, Phone, LGA (picker), Ward (picker), Association (picker), Livestock types (multi-select with counts), Photos (camera/gallery), Location (auto-captured)
  - Submit button (bottom, fixed): "Submit Data"
- **Form validation**: Inline error messages
- **Safe Area**: top: 16pt, bottom: insets.bottom + 80pt (for fixed button)

### 7. My Submissions (Agent - Tab 1)
- **Header**: Default with title "My Submissions", right: filter icon
- **Content**: FlatList
  - Status filter chips (All, Synced, Pending)
  - Submission cards with sync status icon
  - Empty state: "Start collecting data"
- **Safe Area**: top: 16pt, bottom: tabBarHeight + 16pt

## Color Palette

**Primary**: #10b981 (Emerald-600) - Government green, trustworthy
**Secondary**: #3b82f6 (Blue-500) - Informational actions
**Background**: #f8fafc (Slate-50)
**Surface**: #ffffff (White)
**Text Primary**: #0f172a (Slate-900)
**Text Secondary**: #64748b (Slate-500)

**Role Colors**:
- Admin: #8b5cf6 (Purple-500)
- Agent: #f59e0b (Amber-500)
- Viewer: #6b7280 (Gray-500)

**Semantic**:
- Success: #10b981 (Emerald-600)
- Error: #ef4444 (Red-500)
- Warning: #f59e0b (Amber-500)
- Info: #3b82f6 (Blue-500)

**Status Indicators**:
- Synced: #10b981
- Pending: #f59e0b
- Offline: #6b7280

## Typography

**Font**: System default (SF Pro for iOS, Roboto for Android)

**Type Scale**:
- Heading 1: 28pt, Bold (Screen titles)
- Heading 2: 20pt, Semibold (Section headers)
- Heading 3: 16pt, Semibold (Card titles)
- Body: 15pt, Regular (Main content)
- Caption: 13pt, Regular (Metadata)
- Small: 11pt, Medium (Badges, labels)

## Visual Design

- Icons: Feather icon set from @expo/vector-icons
- Cards: 12pt border radius, 1pt border (#e2e8f0)
- Buttons: Primary (filled emerald), Secondary (outlined), Tertiary (text only)
- Floating Action Button: 56pt diameter, emerald background, white plus icon, shadow: offset(0,2), opacity 0.10, radius 2
- Badges: 16pt border radius, 6pt vertical padding, role-colored backgrounds at 20% opacity
- Status dots: 8pt diameter, positioned top-right of cards
- Charts: Use recharts library colors matching role palette

## Assets to Generate

**icon.png** - App icon featuring a simplified livestock silhouette (cow/goat) in emerald on white circular background with subtle green gradient border
*WHERE USED*: Device home screen

**splash-icon.png** - Same as icon.png but larger, centered on emerald gradient background
*WHERE USED*: App launch screen

**empty-submissions.png** - Illustration of clipboard with checkmarks in muted emerald tones
*WHERE USED*: Data Management screen, My Submissions screen (when no data)

**empty-users.png** - Illustration of three user silhouettes in circle arrangement, muted purple tones
*WHERE USED*: User Management screen (when section empty)

**offline-sync.png** - Illustration of cloud with sync arrows, muted gray to amber gradient
*WHERE USED*: Profile screen sync status, offline mode indicator

**avatar-admin.png** - Default avatar with admin badge overlay (purple accent)
*WHERE USED*: Profile screen, user cards

**avatar-agent.png** - Default avatar with agent badge overlay (amber accent)
*WHERE USED*: Profile screen, user cards
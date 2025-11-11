# Admin Dashboard Guide

## Overview

The Admin Dashboard is the main interface for receptionists and administrators to manage visitors and staff members. It requires authentication via Clerk.

## Access URLs

### Main Dashboard (Visitor Management)
**URL:** `http://localhost:3000/dashboard`

**Features:**
- View all checked-in visitors
- Filter visitors by time period (Today, This Week, All Visitors)
- Click on any visitor card to see detailed information
- Check out visitors
- Export visitor data to CSV
- View visitor photos (if uploaded)
- See visitor check-in/check-out times

### Staff Management
**URL:** `http://localhost:3000/dashboard/staff`

**Features:**
- View all staff members in a table
- Add new staff members
- Edit existing staff information
- Delete staff members
- Toggle staff active/inactive status
- Manage staff details (name, email, department, title)

## Authentication

1. **First Time Access:**
   - Navigate to `/dashboard` or `/dashboard/staff`
   - You'll be redirected to `/sign-in`
   - Sign up or sign in with Clerk
   - After authentication, you'll be redirected back to the dashboard

2. **Sign In URL:** `http://localhost:3000/sign-in`
3. **Sign Up URL:** `http://localhost:3000/sign-up`

## Dashboard Features

### Visitor Dashboard (`/dashboard`)

#### Header Section
- Welcome message with your name/email
- Export CSV button - Downloads visitor data as CSV file
- Sign Out button

#### Filter Section
- **Today** - Shows visitors checked in today
- **This Week** - Shows visitors checked in this week
- **All Visitors** - Shows all visitors (no date filter)

#### Visitors List
- Each visitor is displayed as a card with:
  - Photo (or placeholder avatar)
  - Full Name
  - Company
  - Who they're visiting
  - Check-in time
  - Status badge (Checked In / Checked Out)
- Click any visitor card to see full details in a modal

#### Visitor Details Modal
When you click a visitor card, a modal opens showing:
- Full visitor information
- Photo (if available)
- Check-in time
- Check-out time (if checked out)
- Check-out button (if still checked in)

### Staff Management (`/dashboard/staff`)

#### Staff Table
Shows all staff members with columns:
- **Name** - Full name of staff member
- **Email** - Contact email
- **Department** - Department/division
- **Title** - Job title
- **Status** - Active/Inactive badge
- **Actions** - Edit and Delete buttons

#### Add/Edit Staff Form
- **Full Name*** (required)
- **Email** (optional)
- **Department** (optional)
- **Title** (optional)
- **Active Status** - Checkbox to show/hide from visitor list

## Navigation

The dashboard includes a navigation bar at the top with:
- **Visitor Dashboard** - Main visitor management
- **Staff Management** - Staff CRUD operations

## Quick Start

1. **Sign In:**
   ```
   http://localhost:3000/sign-in
   ```

2. **Access Dashboard:**
   ```
   http://localhost:3000/dashboard
   ```

3. **Manage Staff:**
   ```
   http://localhost:3000/dashboard/staff
   ```

## Workflow Example

1. **Add Staff Members:**
   - Go to `/dashboard/staff`
   - Click "Add Staff Member"
   - Fill in details and save
   - Staff will immediately appear in visitor check-in dropdown

2. **View Visitors:**
   - Go to `/dashboard`
   - Select filter (Today/Week/All)
   - View visitor cards
   - Click card for details

3. **Check Out Visitor:**
   - Click visitor card
   - Click "Check Out" button in modal
   - Visitor status updates

4. **Export Data:**
   - Click "Export CSV" button
   - CSV file downloads with filtered visitor data

## Notes

- All routes require authentication
- Staff members must be active to appear in visitor check-in
- Visitor check-in is public (no auth required)
- Dashboard access requires Clerk authentication

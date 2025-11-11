# Organization Settings - Clerk Sync Implementation

## Overview
The Organization Settings page now syncs data bidirectionally between Clerk and your database, ensuring organization information stays consistent across both systems.

## What Was Implemented

### 1. **Real-time Data Loading**
- Fetches organization name, slug, and image from **Clerk**
- Fetches email, phone, address, and website from **local database**
- Shows loading state while data is being fetched
- Auto-populates form fields when data loads

### 2. **Organization Name Sync**
- **Source**: Clerk Organizations API
- **Editable**: Yes
- **Sync**: Updates Clerk when changed via `organization.update({ name })`
- **Effect**: Name change reflects across all Clerk components (OrganizationSwitcher, etc.)

### 3. **Organization Slug**
- **Source**: Clerk Organizations API
- **Editable**: No (Read-only)
- **Display**: Shows in disabled input field
- **Note**: Slug is set in Clerk Dashboard and cannot be changed programmatically

### 4. **Organization Logo/Image**
- **Source**: Clerk Organizations API
- **Editable**: No (via Clerk Dashboard only)
- **Display**: Shows image preview if uploaded in Clerk
- **Note**: Logo management handled through Clerk Dashboard

### 5. **Contact Information**
- **Fields**: Email, Phone, Address, Website
- **Source**: Local database
- **Editable**: Yes
- **Sync**: Saves to database via `organization.updateSettings` mutation

## How It Works

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Updates Form                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Click "Save Changes"  │
                └───────────┬───────────┘
                            │
        ┌───────────────────┴────────────────────┐
        │                                        │
        ▼                                        ▼
┌──────────────────┐                  ┌──────────────────┐
│ Organization     │                  │ Contact Info     │
│ Name Changed?    │                  │ (Email, Phone,   │
│                  │                  │  Address, Web)   │
└────────┬─────────┘                  └────────┬─────────┘
         │ YES                                  │
         ▼                                      ▼
┌────────────────────────┐         ┌─────────────────────────┐
│ Update Clerk API       │         │ Update Local Database   │
│ organization.update()  │         │ via tRPC mutation       │
└────────────────────────┘         └─────────────────────────┘
         │                                      │
         └──────────────┬───────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │ Show Success     │
              │ Toast            │
              └──────────────────┘
```

### Code Implementation

#### Frontend (`app/(dashboard)/dashboard/settings/page.tsx`)

```typescript
// Load data from Clerk and database
const { organization, isLoaded } = useOrganization();
const { data: dbOrganization } = trpc.organization.getCurrent.useQuery();

// Update handler
const handleSaveOrganization = async () => {
  // 1. Update Clerk if name changed
  if (orgSettings.name !== organization.name) {
    await organization.update({ name: orgSettings.name });
  }

  // 2. Update database fields
  await updateOrgMutation.mutateAsync({
    email: orgSettings.email,
    phone: orgSettings.phone,
    address: orgSettings.address,
    website: orgSettings.website,
  });
};
```

#### Backend (`server/routers/organization.ts`)

```typescript
// Get current organization
getCurrent: protectedProcedure.query(async ({ ctx }) => {
  return await ctx.db.organization.findUnique({
    where: { clerkOrgId: ctx.organizationId },
  });
}),

// Update organization settings
updateSettings: protectedProcedure
  .input(z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    website: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    return await ctx.db.organization.update({
      where: { clerkOrgId: ctx.organizationId },
      data: input,
    });
  }),
```

## User Experience

### Initial Load
1. User opens `/dashboard/settings` → Organization tab
2. Page shows loading spinner: "Loading organization data..."
3. Data fetches from both Clerk and database
4. Form fields populate automatically

### Viewing Organization Info
- **Organization Logo**: Displays if uploaded in Clerk
- **Organization Slug**: Shows as read-only field (e.g., `gsa-1762442683`)
- **Organization Name**: Editable (syncs to Clerk)
- **Contact fields**: Editable (saves to database)

### Updating Information
1. User edits any field(s)
2. Clicks "Save Changes"
3. Button shows "Saving..." state
4. Updates process in background
5. Success toast appears: "Organization settings have been updated successfully"
6. Form refreshes with saved data

## Database Schema

```prisma
model Organization {
  id             String   @id @default(cuid())
  clerkOrgId     String   @unique
  name           String   // Synced from Clerk
  slug           String   @unique // Synced from Clerk
  
  // Contact info (editable in settings)
  email          String?
  phone          String?
  address        String?
  website        String?
  
  // Branding (white-label)
  logoUrl        String?
  primaryColor   String   @default("#3b82f6")
  secondaryColor String   @default("#10b981")
  
  // Relations
  staff          Staff[]
  visitors       Visitor[]
  meetings       Meeting[]
  tickets        Ticket[]
  // ... more relations
}
```

## Features

### ✅ Implemented
- [x] Fetch organization data from Clerk
- [x] Fetch contact info from database
- [x] Display organization logo from Clerk
- [x] Display slug as read-only
- [x] Edit organization name (syncs to Clerk)
- [x] Edit contact information (saves to database)
- [x] Loading states
- [x] Error handling with toast notifications
- [x] Success feedback

### 🎯 Benefits
1. **Single Source of Truth**: Organization name managed in Clerk
2. **Extended Data**: Additional fields (email, phone, etc.) in database
3. **Automatic Sync**: Name changes reflect everywhere instantly
4. **User-Friendly**: Clear labels showing what syncs where
5. **Validation**: tRPC provides type safety and validation

## Testing

### Test Scenarios

1. **View Organization**:
   - Navigate to Settings → Organization tab
   - Verify all fields load correctly
   - Check if logo displays (if uploaded in Clerk)

2. **Update Organization Name**:
   - Change organization name
   - Click "Save Changes"
   - Verify success toast
   - Check OrganizationSwitcher to see new name
   - Refresh page to confirm persistence

3. **Update Contact Info**:
   - Update email, phone, address, or website
   - Click "Save Changes"
   - Verify success toast
   - Refresh page to confirm changes saved

4. **Error Handling**:
   - Try updating with no organization context
   - Verify error toast displays

5. **Loading States**:
   - Open settings page
   - Verify loading spinner shows briefly
   - Confirm data populates after load

## Notes

- **Clerk Dashboard**: To change logo or slug, users must go to Clerk Dashboard
- **Name Sync**: Changes to name propagate to Clerk's `OrganizationSwitcher` immediately
- **Database Fields**: Email, phone, address, website are app-specific and don't exist in Clerk
- **Permissions**: Only admins can access settings page (enforced by role checks)

## Future Enhancements

1. **Logo Upload**: Allow logo upload directly from settings (saves to Clerk)
2. **Slug Edit**: Request slug change feature from Clerk (currently not supported)
3. **Validation**: Add email/phone format validation
4. **Audit Log**: Track who changed what and when
5. **Bulk Import**: Import organization data from CSV





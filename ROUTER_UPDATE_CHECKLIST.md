# Router Update Checklist for Multi-Tenancy

## ✅ Completed
- [x] `server/trpc.ts` - Added organizationId to context
- [x] `server/routers/_app.ts` - Added organization router
- [x] `server/routers/organization.ts` - Created organization router
- [x] `server/routers/staff.ts` - Added organizationId filter to getAll, create, update

## 🔄 Needs Updating

### 1. `server/routers/visitor.ts`
**Update these procedures:**
- `getAll` - Add `where: { organizationId: ctx.organizationId }`
- `create` - Add `organizationId: ctx.organizationId` to data
- `search` - Add `organizationId: ctx.organizationId` filter
- `checkoutPublic` - Add organizationId check

### 2. `server/routers/meeting.ts`
**Update these procedures:**
- `getAll` - Add `where: { organizationId: ctx.organizationId }`
- `getTodaysMeetings` - Add organizationId filter
- `create` - Add `organizationId: ctx.organizationId` to data
- `update` - Add organizationId verification
- `delete` - Add organizationId verification

### 3. `server/routers/ticket.ts`
**Update these procedures:**
- `getAll` - Add organizationId filter
- `getMyTickets` - Add organizationId filter
- `getById` - Add organizationId verification
- `create` - Add `organizationId: ctx.organizationId` to data
- `update` - Add organizationId verification
- `addMessage` - Add organizationId verification (via ticket)

### 4. `server/routers/analytics.ts`
**Update these procedures:**
- `getOverviewMetrics` - Add organizationId filter to all queries
- `getVisitorAnalytics` - Add organizationId filter
- `getTrafficInsights` - Add organizationId filter

### 5. `server/routers/company.ts`
**Update these procedures:**
- `getSuggestions` - Add organizationId filter (or null for shared)
- `recordCompanyUsage` - Add organizationId to data

### 6. `server/routers/employee.ts`
**Update these procedures:**
- `getProfile` - Add organizationId filter to staff query
- `respondToVisitor` - Add organizationId verification

## 📝 Pattern to Follow

### For `getAll` / `findMany` queries:
```typescript
// BEFORE
const items = await ctx.db.model.findMany({
  orderBy: { createdAt: 'desc' },
});

// AFTER ✅
if (!ctx.organizationId) {
  return [];
}

const items = await ctx.db.model.findMany({
  where: {
    organizationId: ctx.organizationId, // ✅
  },
  orderBy: { createdAt: 'desc' },
});
```

### For `create` mutations:
```typescript
// BEFORE
const item = await ctx.db.model.create({
  data: {
    ...input,
  },
});

// AFTER ✅
if (!ctx.organizationId) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'No organization context',
  });
}

const item = await ctx.db.model.create({
  data: {
    ...input,
    organizationId: ctx.organizationId, // ✅
  },
});
```

### For `update` / `delete` mutations:
```typescript
// BEFORE
const item = await ctx.db.model.findUnique({
  where: { id: input.id },
});

// AFTER ✅
if (!ctx.organizationId) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'No organization context',
  });
}

const item = await ctx.db.model.findUnique({
  where: { id: input.id },
});

// ✅ Verify ownership
if (item?.organizationId !== ctx.organizationId) {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'Not found in your organization',
  });
}
```

## ⚠️ Special Cases

### Public Procedures (visitor check-in)
- `visitor.create` - This is public, but needs organizationId
- **Solution**: Get organization from staff member being visited or use a default

### Cross-Organization Queries
- None needed for this app - all data is org-isolated

## 🧪 Testing After Updates

For each router:
1. ✅ Queries return only org data
2. ✅ Creates assign to current org
3. ✅ Updates/Deletes verify org ownership
4. ✅ No cross-org data leakage

## 📊 Priority Order

1. **HIGH** - Staff (✅ Done)
2. **HIGH** - Organization (✅ Done)
3. **MEDIUM** - Visitor
4. **MEDIUM** - Meeting
5. **MEDIUM** - Ticket
6. **LOW** - Analytics
7. **LOW** - Company
8. **LOW** - Employee



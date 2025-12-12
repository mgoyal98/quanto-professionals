# Customer Tab View - Active & Archived

## Overview

This specification outlines the implementation of a tab view in the Customers page to display **Active** and **Archived** customers separately. Currently, the system only shows active customers, and the archive (delete) action performs a soft delete by setting `isArchived: true`. This feature will expose archived customers in a separate tab, allowing users to view and potentially restore them.

---

## Current State Analysis

### Database Schema (`src/db/schema/customers.ts`)

- ✅ `isArchived` field already exists (`integer({ mode: 'boolean' }).notNull().default(false)`)
- No schema changes required

### Backend (`src/main/customer.ts`)

- `listCustomers()` currently filters: `where(eq(customersTable.isArchived, false))`
- `deleteCustomer()` performs soft delete: `set({ isArchived: true })`
- Needs modification to support listing archived customers

### Frontend (`src/renderer/pages/customers/list-customers.tsx`)

- Single table view displaying only active customers
- Search functionality across customer fields
- Pagination support via `usePagination` hook
- Needs tab view implementation

---

## Proposed Changes

### 1. Backend API Changes

#### 1.1 IPC Channel Updates (`src/shared/ipc.ts`)

Add new IPC channel for listing archived customers:

```typescript
export enum CustomerIpcChannel {
  Create = 'customer:create',
  List = 'customer:list',
  ListArchived = 'customer:list-archived', // NEW
  Delete = 'customer:delete',
  Restore = 'customer:restore', // NEW
}
```

#### 1.2 Main Process Handler Updates (`src/main/customer.ts`)

Add functions for:

**a) List Archived Customers:**

```typescript
function listArchivedCustomers() {
  const db = getActiveDb();
  const result = db
    .select()
    .from(customersTable)
    .where(eq(customersTable.isArchived, true))
    .orderBy(asc(customersTable.name))
    .all();
  return result;
}
```

**b) Restore Customer (Unarchive):**

```typescript
function restoreCustomer(id: number) {
  const db = getActiveDb();
  const result = db
    .update(customersTable)
    .set({ isArchived: false })
    .where(eq(customersTable.id, id))
    .returning();
  return result;
}
```

**c) Register IPC handlers for new channels**

#### 1.3 Preload Updates (`src/preload/preload.ts`)

Add new API methods:

```typescript
const customerApi = {
  // ... existing methods
  listArchivedCustomers: () =>
    ipcRenderer.invoke(CustomerIpcChannel.ListArchived) as Promise<Customer[]>,
  restoreCustomer: (id: number, name: string) =>
    ipcRenderer.invoke(
      CustomerIpcChannel.Restore,
      id,
      name
    ) as Promise<boolean>,
};
```

#### 1.4 Type Definitions (`src/types/preload.d.ts`)

Update Window interface:

```typescript
customerApi?: {
  // ... existing methods
  listArchivedCustomers(): Promise<Customer[]>;
  restoreCustomer(id: number, name: string): Promise<boolean>;
};
```

---

### 2. Frontend UI Changes

#### 2.1 Tab View Component Structure

The tab view will use MUI's `Tabs` component placed below the page header and above the search bar.

```
┌────────────────────────────────────────────────────────┐
│  Customers                         [+ Create Customer] │
├────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐                     │
│  │   Active     │ │   Archived   │                     │
│  └──────────────┘ └──────────────┘                     │
├────────────────────────────────────────────────────────┤
│  🔍 Search customer by name, GSTIN, or email...        │
├────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐│
│  │  Table with customers based on selected tab        ││
│  │  Active Tab: Shows Archive action                  ││
│  │  Archived Tab: Shows Restore action                ││
│  └────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────┘
```

#### 2.2 Tab States

| Tab      | Data Source               | Actions Available                  |
| -------- | ------------------------- | ---------------------------------- |
| Active   | `listCustomers()`         | Edit, Archive                      |
| Archived | `listArchivedCustomers()` | Restore, Permanent Delete (future) |

#### 2.3 Visual Indicators

- **Active Tab Badge**: Show count of active customers (optional)
- **Archived Tab Badge**: Show count of archived customers (optional)
- **Archived Row Styling**: Slightly muted/greyed appearance for archived customers table

#### 2.4 Action Buttons

**Active Tab:**

- Edit (Primary) - Existing
- Archive (Warning) - Existing (soft delete)

**Archived Tab:**

- Restore (Success) - New action to unarchive
- _(Future: Permanent Delete with confirmation)_

---

### 3. Component Architecture

#### 3.1 State Management

```typescript
// Tab state
const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

// Separate data stores
const [activeCustomers, setActiveCustomers] = useState<Customer[]>([]);
const [archivedCustomers, setArchivedCustomers] = useState<Customer[]>([]);

// Derive displayed customers based on tab
const displayedCustomers =
  activeTab === 'active' ? activeCustomers : archivedCustomers;
```

#### 3.2 Data Loading Strategy

**Option A: Load Both on Mount (Recommended)**

- Load both active and archived customers when component mounts
- Better UX - instant tab switching
- Slightly higher initial load

**Option B: Lazy Load on Tab Switch**

- Load archived customers only when tab is clicked
- Lower initial load
- Slight delay on first archived tab view

**Recommendation:** Option A for better UX given the local SQLite database (fast queries)

#### 3.3 Search Behavior

Search should be scoped to the currently active tab:

- When on "Active" tab, search filters active customers
- When on "Archived" tab, search filters archived customers

---

### 4. Implementation Steps

#### Phase 1: Backend Updates

1. [ ] Update `src/shared/ipc.ts` - Add new IPC channels
2. [ ] Update `src/main/customer.ts` - Add `listArchivedCustomers()` and `restoreCustomer()` functions
3. [ ] Update `src/main/customer.ts` - Register new IPC handlers
4. [ ] Update `src/preload/preload.ts` - Expose new API methods
5. [ ] Update `src/types/preload.d.ts` - Add type definitions

#### Phase 2: Frontend Updates

6. [ ] Update `src/renderer/pages/customers/list-customers.tsx`:
   - Add tab state management
   - Implement tab UI using MUI `Tabs` component
   - Add separate state for active/archived customers
   - Modify data loading to fetch both lists
   - Update table to show appropriate actions per tab
   - Add restore functionality for archived tab
7. [ ] Update search to work with current tab context
8. [ ] Update pagination to reset when switching tabs

#### Phase 3: Polish & Testing

9. [ ] Add loading states for tab content
10. [ ] Add empty states for each tab
11. [ ] Test archive → appears in archived tab
12. [ ] Test restore → appears in active tab
13. [ ] Test search within each tab
14. [ ] Test pagination within each tab

---

### 5. MUI Components to Use

```typescript
import { Tabs, Tab, Badge } from '@mui/material';
import {
  Restore, // For restore action
  DeleteForever, // For future permanent delete
} from '@mui/icons-material';
```

---

### 6. Code Examples

#### 6.1 Tab UI Implementation

```tsx
<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
  <Tabs
    value={activeTab}
    onChange={(_e, newValue) => setActiveTab(newValue)}
    aria-label='customer tabs'
  >
    <Tab
      label={
        <Badge badgeContent={activeCustomers.length} color='primary'>
          Active
        </Badge>
      }
      value='active'
    />
    <Tab
      label={
        <Badge badgeContent={archivedCustomers.length} color='secondary'>
          Archived
        </Badge>
      }
      value='archived'
    />
  </Tabs>
</Box>
```

#### 6.2 Restore Handler

```tsx
const handleRestore = async (id: number, name: string) => {
  if (!window.customerApi) return;

  try {
    const result = await window.customerApi.restoreCustomer(id, name);
    if (result) {
      void loadCustomers(); // Refresh both lists
    }
  } catch (err) {
    // Handle error
  }
};
```

#### 6.3 Conditional Actions

```tsx
<TableCell align='right'>
  <Stack direction='row' spacing={1} justifyContent='flex-end'>
    {activeTab === 'active' ? (
      <>
        <IconButton size='small' onClick={() => navigate(`/`)} color='primary'>
          <Edit />
        </IconButton>
        <IconButton
          size='small'
          onClick={() => handleArchive(customer.id, customer.name)}
          color='warning'
        >
          <Archive />
        </IconButton>
      </>
    ) : (
      <IconButton
        size='small'
        onClick={() => handleRestore(customer.id, customer.name)}
        color='success'
      >
        <Restore />
      </IconButton>
    )}
  </Stack>
</TableCell>
```

---

### 7. Empty State Messages

**Active Tab (No Customers):**

> "No active customers found. Add your first customer to get started."

**Active Tab (No Search Results):**

> "No active customers found matching your search."

**Archived Tab (No Customers):**

> "No archived customers. Customers you archive will appear here."

**Archived Tab (No Search Results):**

> "No archived customers found matching your search."

---

### 8. Future Considerations

1. **Permanent Delete**: Add option to permanently delete archived customers with confirmation dialog
2. **Bulk Actions**: Select multiple customers to archive/restore at once
3. **Archive Reason**: Track why a customer was archived
4. **Archive Date**: Show when the customer was archived (would need `archivedAt` field)
5. **URL Sync**: Sync tab state with URL (`/customers?tab=archived`) for shareable links

---

### 9. Files to Modify

| File                                              | Changes                                                               |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| `src/shared/ipc.ts`                               | Add `ListArchived` and `Restore` channels                             |
| `src/main/customer.ts`                            | Add `listArchivedCustomers()`, `restoreCustomer()`, register handlers |
| `src/preload/preload.ts`                          | Expose new API methods                                                |
| `src/types/preload.d.ts`                          | Add type definitions                                                  |
| `src/renderer/pages/customers/list-customers.tsx` | Main UI changes - tabs, state, actions                                |

---

### 10. Estimated Effort

| Phase                | Estimated Time |
| -------------------- | -------------- |
| Backend Updates      | 30 mins        |
| Frontend Tab UI      | 1 hour         |
| Data Loading & State | 30 mins        |
| Actions & Handlers   | 30 mins        |
| Testing & Polish     | 30 mins        |
| **Total**            | **~3 hours**   |

---

### 11. Acceptance Criteria

- [ ] Tab view shows "Active" and "Archived" tabs
- [ ] Active tab shows non-archived customers with Archive action
- [ ] Archived tab shows archived customers with Restore action
- [ ] Archiving a customer moves them to Archived tab
- [ ] Restoring a customer moves them to Active tab
- [ ] Search works correctly within each tab
- [ ] Pagination works correctly within each tab
- [ ] Empty states are displayed appropriately
- [ ] Tab counts update after archive/restore actions

# Competitor Feature Analysis

Features from 17 competitors mapped to Nava. ✅ = we have it. 🔲 = gap.

## Life Admin (Tidee, Doqit, Pebbles, Realworld, Mial)

| Feature | Competitors | Nava |
|---------|-------------|------------|
| Renewal/deadline reminders | All | ✅ Push, in-app |
| Document vault | Tidee, Doqit, Realworld | ✅ Encrypted |
| Document scanning | Doqit, Realworld | ✅ AI extraction |
| Calendar sync/export | Tidee, RemindCal | ✅ Export to .ics |
| **Snooze reminders** | Pebbles | ✅ Snooze per item |
| **Life moments** (I'm moving, pregnant) | Realworld | ✅ WelcomeGuide onboarding |
| **Top 3 priorities** | Mial | ✅ FocusOnThree component |
| **Document attached to item** | Tidee, Doqit | ✅ Setup wizard links docs |
| **Recurring tasks** (every 6 mo, every 5k mi) | Pebbles | ✅ Renewal cycle |
| **Task completion history** | Pebbles | ✅ Mark done |
| **Family/household sharing** | Tidee, Doqit | 🔲 |
| **Assign owners to tasks** | Tidee | 🔲 |
| **Weekly digest email** | Tidee | ✅ send-digest Edge Function + Settings toggle |

## Business Compliance (RemindCal, Expiration Reminder, Avalara)

| Feature | Competitors | Nava |
|---------|-------------|------------|
| License/contract tracking | All | ✅ |
| **Bulk edit** | Avalara | ✅ BulkEditModal |
| **Entity/location management** | Avalara | ✅ Business/Estate pages, migration 018 |
| **Audit trail** | RemindCal, Avalara | ✅ AuditModal |
| Multi-recipient alerts | RemindCal | ✅ alert_emails on items + send-reminders |

## Estate/Trust (Trust & Will, LifeFile, Trusty)

| Feature | Competitors | Nava |
|---------|-------------|------------|
| Trust/will tracking | All | ✅ Trusts category |
| **Executor/nominee management** | LifeFile | ✅ estate_executors table |
| **Create documents** (will, trust) | Trust & Will | 🔲 (we track, not create) |
| **Asset inventory with photos** | Trust & Will, LifeFile | ✅ Assets page with photo upload |
| **Secure sharing with beneficiaries** | LifeFile | 🔲 |

## Parking (Parking Ticket Pal)

| Feature | Competitors | Nava |
|---------|-------------|------------|
| Pay ticket links | Both | ✅ City portals |
| Dispute links | Both | ✅ |
| **Searchable history** | Ticket Pal | ✅ (items list) |
| **Auto-dispute** | Ticket Pal | 🔲 (no API) |

## Implementation Priority

**Phase 1 (implemented):**
- ✅ Recurring items (every X months/years)
- ✅ Snooze / remind later
- ✅ Document linked to compliance item
- ✅ Top 3 focus priorities on dashboard
- ✅ Life moments in onboarding (WelcomeGuide)
- ✅ Bulk edit
- ✅ Entity/location management
- ✅ Executor/nominee management
- ✅ Audit trail
- ✅ Task completion (mark done)

**Phase 2 (implemented):**
- ✅ Weekly digest email (send-digest Edge Function + Settings toggle)
- ✅ Multi-recipient alerts (alert_emails + send-reminders emails)
- ✅ Asset inventory with photos (Assets page + photo upload)

**Phase 3 (future):**
- Family sharing
- Assign task owners
- Secure sharing with beneficiaries
- Document creation (wills, trusts)

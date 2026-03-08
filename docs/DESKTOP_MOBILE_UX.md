# Desktop vs Mobile UX — Every Screen in Nava

Best practices for each part of the app. Use this when building or refining platform-specific UI.

---

## Global / Shell

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Navigation** | Top nav bar, sidebar for secondary sections | Bottom tab bar (4–5 items: Dashboard, Add, Documents, Settings, etc.) |
| **Back** | In-app back button or breadcrumb | Hardware back (Android) or in-app back |
| **Chat bubble** | Floating bottom-right | Same, or integrate into bottom nav |
| **Header** | Compact, can show more labels | Minimal; icons + short labels or icons only |

---

## Landing

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Hero** | Multi-column, side-by-side CTA | Single column, stacked, CTA in thumb zone |
| **Features** | Grid (2–3 columns) | Single column, one feature per card |
| **CTAs** | Inline, multiple | Sticky bottom bar for primary CTA |
| **Nav** | Full links | Hamburger or condensed |

---

## Auth (Sign in / Sign up)

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Layout** | Centered card, max-width | Full-width form, single column |
| **Inputs** | Standard size | Min 44px height, `inputmode` / `type` for correct keyboard (email, tel) |
| **Social buttons** | Side-by-side | Stacked, full-width |
| **Links** | Inline | Stacked, larger tap targets |
| **Keyboard** | Tab order logical | Avoid keyboard covering submit; sticky submit at bottom |

---

## Dashboard

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Item list** | Dense list or grid, hover states | Cards, one per row, swipe actions (snooze, done) |
| **Focus on 3** | Inline or sidebar | Collapsible or single card |
| **Health score** | Compact badge or inline | Full-width card or compact |
| **Add item** | Button + modal | FAB or bottom nav item; modal → full-screen on mobile |
| **Filters** | Dropdowns, inline | Bottom sheet or full-screen filter |
| **Empty state** | Centered, compact | Full-width, CTA in thumb zone |
| **Suggested for you** | Sidebar or inline | Horizontal scroll or stacked cards |

---

## Item Card (list item)

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Layout** | Compact row, multiple actions visible | Card with primary action prominent |
| **Actions** | Hover reveal, right-click menu | Swipe left/right (snooze, done), or tap for menu |
| **Touch targets** | Smaller OK | Min 44px for snooze, done, expand |
| **Due date** | Inline | Emphasized, same or next line |
| **Category** | Badge or text | Badge, tappable |

---

## Add Item Modal / Setup Wizard

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Modal** | Centered overlay, max-width | Full-screen (not overlay) |
| **Steps** | Progress bar top, prev/next inline | Progress dots, sticky next at bottom |
| **Fields** | Multi-column where logical | Single column always |
| **Category picker** | Grid | Grid, larger tiles |
| **Date picker** | Inline or popover | Native date picker (better UX) |
| **Submit** | Bottom of form | Sticky bottom bar |

---

## Documents

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **List** | Table or grid, sortable columns | Cards, one per row |
| **Upload** | Drag-and-drop zone | Tap zone, min 44px |
| **Scan** | Button | Full-width button |
| **View modal** | Overlay | Full-screen viewer |
| **Actions** | Hover, context menu | Long-press or tap menu |

---

## Settings

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Layout** | Sidebar nav + content, or tabs | List of sections, tap → full-screen section |
| **Sections** | Grouped, some inline | Each section = screen or accordion |
| **Toggles** | Standard | Min 44px tap target |
| **Forms** | Inline, multi-column | Single column, full-width |
| **Danger zone** | Bottom of page | Separate section, full-width |
| **Advanced** | Collapsible | Hidden by default, expandable |

---

## Estate

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Executors list** | Table or cards | Cards, stacked |
| **Add executor** | Modal | Full-screen form |
| **Detail view** | Side panel or inline | Full-screen detail |
| **Actions** | Inline buttons | Bottom sheet or full-width buttons |

---

## Business

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Entities** | Table or cards | Cards, one per row |
| **Locations** | Inline or sidebar | Nested list or cards |
| **Add entity** | Modal | Full-screen |
| **Forms** | Multi-column | Single column |

---

## Assets

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Vehicle list** | Table or grid | Cards |
| **Trip list** | Inline or sidebar | Expandable cards |
| **Mileage** | Inline edit | Full-screen or bottom sheet |
| **Assign trip** | Modal | Full-screen modal |

---

## Wealth Learn

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Topic cards** | Grid (2–3 columns) | Single column or 2-column grid |
| **Article** | Side panel or inline | Full-screen |
| **Setup CTA** | Inline button | Full-width, thumb zone |
| **Drag to chat** | Mouse drag | Long-press + share or tap to copy prompt |

---

## Assistant / Chat

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Panel** | Slide-over, 400–500px | Full-screen or near full-screen |
| **Input** | Multi-line, resize | Fixed height, expand on focus |
| **Messages** | Scroll, hover actions | Scroll, tap for actions |
| **Context** | Sidebar or inline | Collapsible |
| **History** | Sidebar | Separate screen or drawer |

---

## Apply (Work permit, etc.)

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Steps** | Step indicator, prev/next | Progress dots, sticky next |
| **Form** | Multi-column where logical | Single column |
| **Guide content** | Sidebar or inline | Accordion or expandable |
| **Save draft** | Inline | Sticky or in menu |

---

## Tax Estimator

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Form** | Side-by-side with summary | Stacked, summary below or after |
| **Results** | Inline | Full-width cards |
| **Inputs** | Standard | Min 44px, `inputmode="numeric"` | 

---

## Modals (General)

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Small content** | Centered overlay | Bottom sheet or overlay |
| **Large content** | Centered, max-height scroll | Full-screen |
| **Forms** | Modal overlay | Full-screen |
| **Confirm** | Small modal | Alert or bottom sheet |
| **Backdrop** | Dismiss on click | Swipe down to dismiss (bottom sheet) |

---

## Shared Principles (All Screens)

| Principle | Both platforms |
|-----------|----------------|
| **Content first** | Same core content and hierarchy |
| **Branding** | Same logo, colors, typography |
| **Core flows** | Same tasks (add item, mark done, snooze) |
| **Progressive disclosure** | Essential first; advanced behind toggles/accordions |
| **Input types** | `type="email"`, `type="tel"`, `inputmode="numeric"` for correct keyboards |
| **Loading** | Skeleton or spinner; avoid layout shift |
| **Errors** | Inline validation; clear, actionable messages |

---

## Quick Reference

- **Desktop:** Denser layouts, hover states, right-click, keyboard shortcuts, modals, sidebars
- **Mobile:** Single column, 44px min touch targets, bottom nav, full-screen modals, swipe, thumb zone
- **Breakpoints:** 320, 480, 768, 1024px (content-based, not device names)

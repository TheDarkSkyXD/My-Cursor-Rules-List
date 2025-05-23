# Weight Tracking Feature: Schema Reference

## Relevant Prisma Models & Fields

### `cats`
- `id: String @id @default(uuid())`
- `weight: Decimal?` (current weight)
- `weight_logs: cat_weight_logs[]` (relation)
- `weight_goals: weight_goals[]` (relation)
- `feeding_logs: feeding_logs[]` (relation)

### `cat_weight_logs`
- `id: String @id @default(uuid())`
- `created_at: DateTime`
- `updated_at: DateTime`
- `weight: Decimal` (measured weight)
- `date: DateTime` (date of measurement)
- `cat_id: String` (relation to `cats`)
- `notes: String?`
- `measured_by: String?` (relation to `profiles`)

### `feeding_logs`
- `id: String @id @default(uuid())`
- `created_at: DateTime`
- `updated_at: DateTime`
- `cat_id: String` (relation to `cats`)
- `household_id: String` (relation to `households`)
- `meal_type: String`
- `amount: Decimal`
- `unit: String`
- `notes: String?`
- `fed_by: String?` (relation to `profiles`)
- `fed_at: DateTime`

### `weight_goals`
- `id: String @id @default(uuid())`
- `created_at: DateTime`
- `updated_at: DateTime`
- `cat_id: String` (relation to `cats`)
- `target_weight: Decimal`
- `target_date: DateTime?`
- `start_weight: Decimal?`
- `status: String` (default: "active")
- `notes: String?`
- `created_by: String` (relation to `profiles`)
- `milestones: weight_goal_milestones[]` (relation)

### `weight_goal_milestones`
- `id: String @id @default(uuid())`
- `created_at: DateTime`
- `goal_id: String` (relation to `weight_goals`)
- `weight: Decimal`
- `date: DateTime`
- `notes: String?`

---

*This file is for planning and documenting the new weight tracking feature. Add dev plans, API ideas, and UI sketches below as needed.*

---

## Development Checklist: Weight Tracking Dashboard (ShadCN)

### 1. Project Setup
- [x] Set up ShadCN/ui library and configure theme tokens in `components.json`.
- [x] Typography component available in `components/ui/typography.tsx`.

### 2. Dashboard Structure & Components
#### A. Current Status Card
- [x] Create `CurrentStatusCard` component using ShadCN `Card`, `CardContent`, `Progress`, and `Typography`.
- [x] Display current weight, target weight, and progress bar.
- [ ] Add a circular indicator for progress (optional).
- [x] Render a health tip in a `Callout` with a vet icon.
- [x] Style using theme tokens for consistency.

#### B. Weight Trend Chart
<<<<<<< HEAD
- [x] Create `WeightTrendChart` component with timeline, toggle buttons, and feeding density overlay.
- [x] Add popover/tooltips for weight entries.
- [x] Support swipe gestures for range selection (mobile/desktop).
- [ ] Integrate a chart library (e.g., Recharts) for timeline visualization.
- [x] Overlay feeding log density using `Badge`.
- [x] Implement tooltips with `Popover` for detailed data.
=======
- [x] Create `WeightTrendChart` component.
- [x] Integrate a chart library (e.g., Recharts) for timeline visualization.
- [x] Add toggle buttons (30/60/90 days) using ShadCN `Button` (outline variant).
- [x] Overlay feeding log density using `Badge`.
<<<<<<< HEAD
- [ ] Implement tooltips with `Popover` for detailed data.
>>>>>>> 05f022c (feat(weight): implement WeightTrendChart with Recharts and time toggles)
=======
- [x] Implement tooltips with `Popover` for detailed data.
<<<<<<< HEAD
>>>>>>> 213b60b (feat(weight): add Popover tooltips to WeightTrendChart data points)
- [ ] Enable swipe gestures for mobile navigation.
=======
- [x] Enable swipe gestures for mobile navigation.
>>>>>>> 65d397f (feat(weight): enable horizontal scroll for WeightTrendChart on mobile)

#### C. Quick Log Panel
- [x] Add a floating action button (FAB) using ShadCN `Button` with `Tooltip`.
- [x] Open a modal (`Dialog`) with a form for logging weight.
- [x] Use `Input` and `Label` for form fields, pre-fill date, and use form hooks.
- [x] Validate input and show errors with `FormMessage`.
- [x] On submit, call backend API and show result with Toast.

#### D. Recent History List
- [x] Create `RecentHistoryList` component.
- [x] Render logs in a `Table` (desktop) or `Accordion` (mobile).
- [x] Add trend icons (ArrowUp/ArrowDown) for weight changes.
- [ ] Implement swipe-to-edit/delete with `ButtonGroup`.
- [ ] Add export option in a `DropdownMenu` (PDF via react-pdf).

#### E. Milestone Progress Section
- [x] Create `MilestoneProgress` component.
<<<<<<< HEAD
- [x] Show milestones as a progress circle.
- [x] Show animated `Alert` on milestone completion.
- [x] Link milestones to feeding adjustments (open in `Sheet` modal).
- [x] Show conflicts with a destructive `Badge`.
=======
- [ ] Show milestones as a progress circle.
- [ ] Show animated `Alert` on milestone completion.
- [ ] Link milestones to feeding adjustments (open in `Sheet` modal).
- [ ] Show conflicts with a destructive `Badge`.
>>>>>>> e13f30a (feat(weight): add MilestoneProgress component and integrate into dashboard)

#### F. Cat Avatar Stack
- [x] Implement `CatAvatarStack` component at the top of the dashboard for cat selection:
    - [x] Display all cats as avatars in a horizontal stack.
    - [x] Each avatar acts as a button to select a cat.
    - [x] Highlight the selected cat (border, ring, or scale effect).
    - [x] Add ARIA labels and tooltips for accessibility.
    - [x] Ensure keyboard navigation and mobile scrollability.
    - [x] On selection, update dashboard data for the chosen cat.

### 3. Backend & Data Integrity
- [x] Ensure all UI elements use theme tokens from `components.json`.
- [x] Use ShadCN CLI to generate/update theme-matched components.
- [x] Surface backend errors in the UI using ShadCN `Toast` notifications.

### 4. Edge Case Handling
- [x] Build onboarding flow with ShadCN `Carousel` and `Tooltip` for first-time users.
- [x] Use `Skeleton` components for loading states.
- [x] Use EmptyState illustrations for missing data.
- [x] Toggle archived goals with ShadCN `Switch` and `Accordion`.

### 5. Metrics & Analytics
- [x] Implement basic weight change velocity calculation (kg/week, lbs/week).
- [ ] Implement PDF export using react-pdf, styled with ShadCN `Typography` and `Card`.
- [ ] A/B test milestone animations using ShadCN's `AnimatePresence`.

### 6. General Best Practices
- [ ] Ensure accessibility (keyboard navigation, ARIA labels).
- [ ] Test all components for responsiveness (mobile/desktop).
- [ ] Break down features into small, reusable components.
- [x] Use clear, descriptive names for files and components.
- [ ] Document all new components and update this checklist as you go.

### 7. Next Steps for Junior Dev
- [ ] Work through the checklist section by section.
- [ ] Ask for help if you have questions or need code examples.
- [ ] Review your work with a senior dev or designer before merging.

### 8. Conflicts & Goal Management (Section 2.F)
- [ ] If a new weight log makes a future milestone's target weight invalid (e.g., current weight surpasses a future loss milestone), highlight.

# PulsePoint Frontend Redesign Specification

## Purpose

This document defines the replacement frontend for PulsePoint before application code changes begin. The new product will retain the current API, data model, and core capabilities while replacing the visual language, information architecture, layouts, and interaction patterns.

The direction is a calm, trustworthy personal health companion. It takes practical cues from the clarity of Apple Health and Fitness, the focused daily review patterns used by Oura and WHOOP, and familiar mobile navigation conventions. It does not copy another product’s interface or branding.

The main outcome is simple: a person can understand their day in seconds, log a meal or activity in a few taps, and inspect trends without being overwhelmed by a dense analytics dashboard.

## Current Product Assessment

PulsePoint currently supports authentication, demo mode, activity and sleep logging, meal logging, goals, insights, milestones, CSV and PDF exports, and data summaries. These capabilities should remain available.

The existing frontend has several experience problems that the redesign will address:

| Current condition | Effect on the user | Redesign response |
| --- | --- | --- |
| Neon glassmorphism, gradients, and large visual effects compete with health data | The interface feels more like a technical demo than a dependable health record | Use a restrained light-first system with optional dark mode, solid surfaces, generous whitespace, and one primary accent |
| Several labels use technical language such as telemetry and biometric matrix | Everyday tasks become harder to scan | Use direct language: Today, Activity, Meals, Trends, Goals, and Progress |
| The main dashboard puts multiple large visualizations above practical actions | Logging and understanding the next useful action take too long | Put the daily summary and a persistent quick-add action first; move deeper analytics to Trends |
| All logged activities are aggregated across dates for the daily rings and summary | A user cannot trust a screen labeled as a daily view | Scope daily UI to the selected day; retain period totals only in trend/report views |
| The Schedule screen presents logged activities as planned workouts | The user is shown an incorrect mental model | Rename and rebuild this view as History; do not claim planning until planning data exists |
| The desktop sidebar is the primary navigation model | It does not translate naturally to phone use, where health tracking frequently happens | Use a bottom navigation bar on mobile and a compact left rail on larger screens |
| Controls, cards, and data rows are largely inline-styled and inconsistent | The UI is difficult to evolve consistently | Build a shared component and token system before rebuilding screens |

## Product Principles

1. Make today obvious. The selected date and the day’s progress are visible before any analytics.
2. Make logging effortless. A person should be able to begin logging from every primary screen and finish common entries quickly.
3. Explain data in plain language. Use understandable labels and only show technical detail when it changes a decision.
4. Show one clear next step. Insight cards should recommend a concrete action, not simulate medical diagnosis.
5. Keep progress honest. Empty, partial, and unavailable data must be clearly distinguished from completed goals.
6. Let data breathe. Prefer a few purposeful visuals over an all-at-once command center.
7. Treat health data with care. Use accessible contrast, plain-language safety notes, and avoid diagnostic or medical claims.

## Information Architecture

The replacement product has five primary destinations. The current backend can supply all required content except future workout planning, which is intentionally out of scope for the first redesign.

| Destination | Purpose | Current capability reused |
| --- | --- | --- |
| Today | Daily snapshot, progress, insight, and recent entries | Metrics, activities, nutrition, goals, insight engine |
| Activity | Activity and sleep history, filters, and logging | Activities endpoints |
| Meals | Daily nutrition, macro balance, meal history, and logging | Nutrition endpoints, metrics, goals |
| Trends | Selectable time-range charts, summaries, exports | Metrics endpoint, existing export utilities |
| Profile | Goals, achievements, account session, appearance, and data export | Goals, milestone logic, authentication, exports |

### Navigation model

On mobile, the app uses a persistent five-item bottom navigation: Today, Activity, Add, Meals, and Trends. The centered Add action opens a quick-add sheet and is visually distinct from navigation. Profile is reached from the avatar in the top bar.

On tablet and desktop, the same destinations appear in a slim left rail with icon and label. The global Add button lives in the top bar. This preserves location and vocabulary across layouts without forcing a desktop sidebar onto small screens.

## Visual Direction

### Tone and layout

The UI should feel warm, clear, and quietly confident. Use a light default canvas with slightly tinted grouped sections, white cards, and subtle borders. Support dark mode using equivalent contrast and hierarchy, not inverted gradients.

Use a single-column rhythm on phones and a two-column content layout only where the supporting panel remains useful. Content should have a readable maximum width rather than expand endlessly on wide screens.

### Design tokens

| Token | Light mode | Use |
| --- | --- | --- |
| Canvas | `#F7F8F5` | App background |
| Surface | `#FFFFFF` | Cards, sheets, inputs |
| Surface muted | `#EEF1EA` | Grouping and inactive controls |
| Ink | `#1D2A22` | Primary text |
| Ink secondary | `#617066` | Supporting text |
| Border | `#DCE2DA` | Dividers and controls |
| Primary green | `#287A52` | Main actions and successful progress |
| Activity coral | `#D85C4A` | Activity movement progress |
| Nutrition amber | `#B56A15` | Meal and protein emphasis |
| Sleep indigo | `#5E67B1` | Sleep and recovery indicators |
| Alert amber | `#A95D00` | Non-critical attention states |

The visual system should use 8-point spacing, 12px and 16px corner radii, a 44px minimum interactive target, and short motion (150–200ms) that confirms state changes. Do not use glassmorphism, glows, decorative gradients, all-caps section headings, or hover animations that shift content.

### Typography and iconography

Use a native-system-first type stack for fast rendering and familiar reading: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`. Set body copy at 16px with at least 1.5 line height. Use a display size only for the key daily metric, not every card. Continue using Lucide icons, always paired with text for primary actions and never as the sole meaning carrier for status.

## Shared Interaction Patterns

### Selected date

Every data screen is driven by a visible selected date. Today is the default. A compact date control provides Previous day, Today, and Next day actions; a calendar opens for direct selection. Only data for that day feeds Today, Meals, and the daily Activity summary. Trend ranges are independent and explicitly labeled.

### Quick add sheet

The universal Add action opens a bottom sheet on mobile and a compact modal on desktop. It contains two large choices: Log activity and Log meal. Choosing one opens the relevant form with today preselected. The form remembers the last selected activity type and meal time locally to reduce repeated effort.

Saving shows an inline success state, closes the form, refreshes only the affected data, and returns the user to the place they started. Deletion requires a confirm dialog that names the entry being removed and offers Cancel and Delete.

### States

Each screen must have designed loading, empty, error, and populated states. Loading uses skeleton rows and chart placeholders; it must not show invented numbers. Empty states include a short explanation and a single relevant action. Errors offer Retry and preserve any data already displayed. Buttons expose disabled and in-progress states.

## Screen Specifications

### Today

**Goal:** Answer “How is today going, and what should I do next?” in under ten seconds.

1. Top bar: avatar, selected-date control, and Add action.
2. Welcome line: `Good morning, Alex` plus the full date. Do not repeat a generic product slogan.
3. Daily progress: three equal, compact progress cards for Movement, Steps, and Sleep. Each shows the actual number, the goal, a labeled progress bar, and status such as `On track` or `450 steps to go`.
4. Readiness: one calm card that shows a score, a plain-language label, the factors used, and a non-medical suggestion. The current readiness calculation can remain initially, but the screen calls it `Daily readiness` and provides `Based on sleep, activity, and goal progress`.
5. Today’s insight: show at most one primary insight, with an action that takes the user to the relevant logging or goal task. Extra insights live behind `See all insights`.
6. Recent entries: the three most recent entries for the selected date, combining activity and meals in chronological order. `View all` opens the related history screen.

On desktop, Daily progress and Readiness may sit side by side. On mobile, the order above is strictly vertical.

### Activity

**Goal:** Make a workout or sleep log easy to record and easy to review later.

The header includes the selected date, an `Add activity` button, and a segmented filter: All, Workouts, Sleep. Under it, show a daily summary strip with active minutes, calories burned, steps, and sleep duration. Entries use a clear time or date, activity title, duration, and one secondary metric. Tapping an entry opens a detail sheet with its values and a delete action.

The first release is a history view, not a schedule. Do not display planned dates or call saved records planned sessions. If workout planning is later added, it needs a separate `planned_activities` data model and a dedicated Plan tab.

### Meals

**Goal:** Help the person see their day’s nutrition without turning every meal into a spreadsheet.

The header includes the selected date and `Add meal`. The hero shows energy consumed against its daily target. A macro card shows protein, carbohydrates, and fat as three horizontal progress rows with grams, not a donut as the default. The meal list is grouped by time of day when a meal-time field exists; until then, it is ordered by creation time and presented as `Meals logged` without inventing breakfast/lunch labels.

Each meal row shows the meal name, calories, and compact macro chips. A log form asks for name, calories, protein, carbohydrate, fat, and date. It validates numeric fields locally and preserves the entry when the request fails.

### Trends

**Goal:** Turn accumulated data into understandable patterns.

The header offers a range picker: 7 days, 30 days, 90 days, and Custom. A metric switcher controls a single clear chart: Activity, Steps, Sleep, or Nutrition. Each chart has a title that says what is being measured and uses one scale per chart. Do not overlay steps and calories on a shared visual by default; this makes the chart harder to interpret.

Below the chart, show three summary values appropriate to the selected metric, then an export area with `Download activity CSV`, `Download meals CSV`, and `Create summary PDF`. Exports should identify their date range in the filename and the PDF heading.

The present API returns a seven-day aggregate and month summary. The 7-day version can be implemented immediately. The 30-day, 90-day, and Custom controls require a future API range parameter or dedicated reporting endpoint; their controls must be disabled with explanatory copy until that capability exists.

### Profile and goals

**Goal:** Give users one predictable home for personal settings and account actions.

Profile is accessed through the avatar, not a fifth visible mobile destination. It contains:

- Account section: name, email, sign out.
- Daily goals: steps, activity calories, food calories, protein, and sleep target. The sleep target is display-only until the API supports persisting it.
- Achievements: current streak, unlocked badges, and a simple progress indicator for the next badge.
- Preferences: theme (System, Light, Dark) stored locally.
- Data: export actions.

Saving goals updates only the changed values, confirms success inline, and avoids browser alert dialogs.

## Data and Calculation Rules

The redesign must keep the labels aligned with actual data:

| UI metric | Source | Rule |
| --- | --- | --- |
| Daily calories burned | Activities for selected date | Sum `calories_burned` excluding sleep unless the stored data explicitly counts sleep calories |
| Daily steps | Activities for selected date | Sum `steps` |
| Daily active minutes | Activities for selected date | Sum `duration_minutes` excluding sleep |
| Daily sleep | Sleep activities for selected date | Sum sleep duration divided by 60 |
| Daily calories consumed | Nutrition for selected date | Sum `calories` |
| Daily macros | Nutrition for selected date | Sum grams by macro |
| Streak | Activity or meal logging dates | Count only consecutive calendar days ending on the selected date or today; do not use number of unique dates |
| Achievements | Entire retained history | Keep all-time totals clearly labeled as all time |
| Readiness | Selected-day sleep, activity, and progress | Explain the calculation inputs; never imply clinical accuracy |

The current application aggregates many values over the full loaded history. The frontend rebuild must introduce date-scoped selectors before showing the new daily UI. No change to the current database tables is required for this correction.

## Accessibility and Quality Requirements

- Meet WCAG 2.2 AA contrast for text and actionable controls; color is never the only progress or status cue.
- Support keyboard navigation, visible focus rings, Escape to close sheets/modals, focus trapping in dialogs, and focus return to the triggering control.
- Use semantic landmarks, actual buttons for actions, associated form labels, descriptive chart summaries, and text alternatives for SVG progress visuals.
- Respect `prefers-reduced-motion`; no essential information depends on animation.
- Keep mobile actions reachable by thumb: persistent navigation and primary actions remain above device safe areas.
- Build responsive layouts from 360px upward; test 360px, 768px, 1024px, and 1440px widths.
- Avoid medical language such as diagnosis, physiological diagnostic engine, or claims that a score is clinically meaningful.

## Implementation Architecture

The redesign should be built as a new frontend layer, not as an incremental set of inline style edits.

| Layer | Responsibility |
| --- | --- |
| `src/design/tokens.css` | Color, type, spacing, radius, elevation, motion, and theme variables |
| `src/components/ui` | Buttons, icon buttons, cards, sheets, dialogs, progress bars, empty states, date control, and form fields |
| `src/features/today` | Daily selectors, readiness, progress, and insight presentation |
| `src/features/activity` | Activity history, filters, activity log flow |
| `src/features/meals` | Nutrition summary, meal history, meal log flow |
| `src/features/trends` | Range controls, charts, summaries, export panel |
| `src/features/profile` | Goals, account, achievements, theme preferences |
| `src/lib/api` | Typed API client and request/error handling |
| `src/lib/health` | Date-scoped selectors, units, streak logic, readiness calculation |

Use TypeScript interfaces instead of `any` for activity, meal, metrics, goals, user, and API errors. Keep the existing API endpoints at first. Add a small query/cache layer only if it reduces duplicated fetching and supports targeted refresh after saves.

## Delivery Sequence

1. Establish the design tokens, typography, global reset, light/dark themes, and reusable UI primitives.
2. Define typed domain models and date-scoped calculation selectors. Add tests for totals and streaks.
3. Replace shell navigation and create the responsive Today screen with its loading, empty, and error states.
4. Rebuild activity and meal logging as reusable sheet-based flows; then rebuild Activity and Meals screens.
5. Rebuild Trends using the current seven-day data and export utilities; clearly defer unavailable ranges.
6. Rebuild Profile, goals, achievements, and authentication with the shared system.
7. Complete responsive, keyboard, screen-reader, and visual regression checks before removing the old frontend.

## Acceptance Criteria

The frontend redesign is complete when:

- The legacy glassmorphism dashboard, technical naming, desktop-only sidebar, and misleading Schedule screen are removed.
- A user can log an activity or meal from every primary screen in no more than two decisions before the form.
- Today, Activity, and Meals use the selected date and never display all-time totals as daily totals.
- Navigation works at phone, tablet, and desktop sizes using the same destination names.
- Every primary screen has loading, empty, and error states.
- No user-facing health claim suggests diagnosis or clinical measurement.
- Core flows are keyboard usable and meet the stated accessibility requirements.
- Existing authentication, demo mode, logging, goals, milestones, and exports still work against the current backend.

## Deliberate Non Goals for First Release

- Connecting Apple Health, wearables, or external food databases.
- True workout scheduling or calendar planning without a separate planned-session model.
- Editing existing activity or meal records; the current API only supports creation and deletion.
- Clinical advice, medical diagnosis, or physiological claims beyond transparent wellbeing-oriented summaries.
- New backend endpoints except where later needed for full trend ranges or new planning features.

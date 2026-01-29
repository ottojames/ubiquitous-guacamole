# Visual Design System
## Complete Design Token Specification

[← Back to Index](./00-INDEX.md) | [Previous: Admin Pages](./07-pages-admin.md) | [Next: User Flows →](./09-user-flows.md)

---

## Overview

All interfaces follow the Pricing Page design system for visual consistency. This document defines all design tokens, component patterns, and styling guidelines.

---

## 8.1 Typography

### Font Families
- **Sans**: `font-sans` → System UI stack (`ui-sans-serif, system-ui, -apple-system, ...`)
- **Mono**: `font-mono` → For code/reference numbers

### Heading Sizes
- **H1**: `text-3xl font-bold` (30px, 700 weight)
- **H2**: `text-2xl font-semibold` (24px, 600 weight)
- **H3**: `text-xl font-semibold` (20px, 600 weight)
- **H4**: `text-lg font-medium` (18px, 500 weight)

### Body Text
- **Default**: `text-base` (16px, 400 weight)
- **Small**: `text-sm` (14px)
- **Tiny**: `text-xs` (12px)

### Line Heights
- **Tight**: `leading-tight` (headings)
- **Normal**: `leading-normal` (body)
- **Relaxed**: `leading-relaxed` (long-form)

---

## 8.2 Color Palette (Tailwind)

### Primary (Blue)
- **50**: `#eff6ff` (light backgrounds)
- **100**: `#dbeafe`
- **500**: `#3b82f6` (primary actions)
- **600**: `#2563eb` (hover states)
- **700**: `#1d4ed8` (active states)

### Success (Green)
- **50**: `#f0fdf4`
- **500**: `#22c55e` (success states, publish buttons)
- **600**: `#16a34a` (hover)

### Warning (Amber)
- **50**: `#fffbeb`
- **500**: `#f59e0b` (warnings, pending states)
- **600**: `#d97706` (hover)

### Danger (Red)
- **50**: `#fef2f2`
- **500**: `#ef4444` (errors, delete buttons)
- **600**: `#dc2626` (hover)

### Purple (Org-wide Context)
- **50**: `#faf5ff`
- **500**: `#a855f7` (org admin features)
- **600**: `#9333ea` (hover)

### Neutrals (Gray/Slate)
- **50**: `#f8fafc` (page backgrounds)
- **100**: `#f1f5f9`
- **200**: `#e2e8f0` (borders)
- **300**: `#cbd5e1`
- **600**: `#475569` (secondary text)
- **700**: `#334155` (primary text)
- **900**: `#0f172a` (headings, strong emphasis)

---

## 8.3 Spacing Scale

Standard Tailwind scale (0.25rem = 4px increments):
- **0.5** → 2px
- **1** → 4px
- **2** → 8px
- **3** → 12px
- **4** → 16px
- **6** → 24px
- **8** → 32px
- **12** → 48px
- **16** → 64px

**Common Uses**:
- Component padding: `p-6` (24px)
- Card padding: `p-8` or `p-12`
- Section gaps: `gap-6` or `gap-8`
- Margin between sections: `mb-8` or `mb-12`

---

## 8.4 Border Radius

**Standard Radii**:
- **xl**: `rounded-xl` → 12px (inputs, small cards)
- **2xl**: `rounded-2xl` → 16px (medium cards, modals)
- **3xl**: `rounded-3xl` → 24px (large cards, matching Pricing Page)
- **full**: `rounded-full` → Pills, badges, avatars

**Usage**:
- **Buttons**: `rounded-xl`
- **Input fields**: `rounded-xl`
- **Cards** (small): `rounded-2xl`
- **Cards** (large/primary): `rounded-3xl`
- **Badges**: `rounded-full`

---

## 8.5 Shadows

**Card Shadows** (matching Pricing Page):
- **Default**: `shadow-[0_2px_12px_rgba(0,0,0,0.04)]`
- **Hover**: `shadow-lg` or `shadow-xl`
- **Sticky elements**: `shadow-sm`

**Example**:
```css
/* Default card */
.card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
```

---

## 8.6 Component Library

### Buttons

**Primary Button**:
```
bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold
hover:bg-blue-700 transition-colors
```

**Success Button** (Publish, Accept):
```
bg-green-600 text-white px-6 py-3 rounded-xl font-semibold
hover:bg-green-700
```

**Danger Button** (Delete, Reject):
```
bg-red-600 text-white px-6 py-3 rounded-xl font-semibold
hover:bg-red-700
```

**Outline Button**:
```
border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold
hover:bg-gray-50
```

**Icon Button** (small):
```
p-2 rounded-lg hover:bg-gray-100
```

---

### Cards

**Standard Card**:
```
bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8
hover:shadow-lg transition-shadow duration-200
```

**Section Card** (smaller):
```
bg-white rounded-2xl border border-gray-200 p-6
```

**Stat Card**:
```
bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6
hover:shadow-lg transition-all
```

---

### Form Elements

**Text Input**:
```
w-full px-4 py-3 border border-gray-300 rounded-xl
focus:ring-2 focus:ring-blue-500 focus:border-transparent
```

**Select Dropdown**:
```
w-full px-4 py-3 border border-gray-300 rounded-xl
bg-white focus:ring-2 focus:ring-blue-500
```

**Textarea**:
```
w-full px-4 py-3 border border-gray-300 rounded-xl
focus:ring-2 focus:ring-blue-500 resize-none
```

**Checkbox**:
```
w-5 h-5 text-blue-600 border-gray-300 rounded
focus:ring-blue-500
```

---

### Badges

**Status Badge**:
```
px-3 py-1 rounded-full text-xs font-semibold
```

**Colors by Status**:
- **Published/Active**: `bg-green-100 text-green-800`
- **Draft**: `bg-gray-100 text-gray-800`
- **Pending**: `bg-amber-100 text-amber-800`
- **Rejected**: `bg-red-100 text-red-800`

**Role Badge**:
- **Admin**: `bg-blue-100 text-blue-800`
- **Editor**: `bg-green-100 text-green-800`
- **Viewer**: `bg-gray-100 text-gray-800`
- **Owner**: `bg-purple-100 text-purple-800`

---

### Modals

**Modal Overlay**:
```
fixed inset-0 bg-black bg-opacity-50 z-50
flex items-center justify-center
```

**Modal Container**:
```
bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh]
overflow-y-auto
```

**Modal Header**:
```
px-8 py-6 border-b border-gray-200
flex items-center justify-between
```

**Modal Footer** (sticky):
```
px-8 py-6 bg-white border-t border-gray-200
flex justify-between items-center sticky bottom-0
```

---

### Tables

**Table Container**:
```
bg-white rounded-2xl border border-gray-200 overflow-hidden
```

**Table Header**:
```
bg-gray-50 border-b border-gray-200
px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase
```

**Table Row**:
```
border-b border-gray-100
hover:bg-slate-50 transition-colors
```

**Table Cell**:
```
px-6 py-4 text-sm text-gray-900
```

---

## 8.7 Animation & Transitions

### Standard Transitions
```
transition-all duration-200 ease-in-out
```

**Common Uses**:
- Button hover states
- Card hover lifts
- Dropdown animations

### Hover Effects

**Card Lift**:
```
hover:shadow-xl hover:scale-[1.02] transition-all duration-200
```

**Button Hover**:
```
hover:bg-blue-700 transition-colors duration-150
```

---

## 8.8 Responsive Breakpoints

**Tailwind Defaults**:
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

**Usage Patterns**:
- **Mobile**: Default (no prefix)
- **Tablet**: `md:` prefix
- **Desktop**: `lg:` prefix
- **Large Desktop**: `xl:` prefix

**Example**:
```
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

---

## 8.9 Gradient Backgrounds

**Auth Pages Gradient**:
```
bg-gradient-to-br from-blue-50 via-white to-purple-50
```

**Card Accent Gradients** (subtle):
```
bg-gradient-to-br from-blue-50 to-white
```

---

## 8.10 Icon System

**Icon Library**: Lucide React or Heroicons

**Icon Sizes**:
- **Small**: 16px (w-4 h-4)
- **Medium**: 20px (w-5 h-5) - default
- **Large**: 24px (w-6 h-6)
- **Extra Large**: 32px (w-8 h-8) - headers, empty states

**Icon Colors**:
- Match parent text color by default
- Explicit colors for status: `text-blue-500`, `text-green-500`, etc.

---

## 8.11 Loading States

**Spinner**:
```
animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600
```

**Skeleton Loader**:
```
animate-pulse bg-gray-200 rounded
```

---

## 8.12 Empty States

**Container**:
```
flex flex-col items-center justify-center py-12
text-center
```

**Icon**:
```
w-16 h-16 text-gray-400 mb-4
```

**Heading**:
```
text-xl font-semibold text-gray-900 mb-2
```

**Text**:
```
text-gray-600 mb-6
```

**CTA Button**:
Primary button with relevant action

---

[← Back to Index](./00-INDEX.md) | [Previous: Admin Pages](./07-pages-admin.md) | [Next: User Flows →](./09-user-flows.md)

# Mobile-First Development Checklist
**Delt Pay MCA Platform**

Use this checklist for every new feature, component, or screen you build.

---

## ✅ Pre-Development

### Planning
- [ ] Sketch mobile layout first (320px width)
- [ ] Identify core user action (what should be easiest?)
- [ ] Plan progressive enhancement (what to add at larger sizes?)
- [ ] Check if shared component exists before building custom

### Design Tokens
- [ ] Use existing color variants from shared components
- [ ] Use standardized spacing (4px, 8px, 12px, 16px, 24px, 32px)
- [ ] Follow typography scale (see below)

---

## 📱 Layout & Responsive Design

### Mobile First (320px - 639px)
- [ ] Single column layout
- [ ] Full-width elements
- [ ] Stack all content vertically
- [ ] No horizontal scroll at 320px
- [ ] Test on iPhone SE (375px)

### Tablet (640px - 1023px)
- [ ] Consider 2-column grid where appropriate
- [ ] Optimize spacing (not too cramped, not too spacious)
- [ ] Test on iPad (768px)

### Desktop (1024px+)
- [ ] Multi-column layouts okay
- [ ] Max-width container (prefer 1280px, not 1536px)
- [ ] Don't waste horizontal space

### Testing Breakpoints
- [ ] 320px - iPhone SE
- [ ] 375px - iPhone 13/14
- [ ] 414px - iPhone 14 Plus
- [ ] 768px - iPad
- [ ] 1024px - Desktop minimum
- [ ] 1440px - Desktop standard

---

## 🎨 Typography

### Text Sizes (Use these, never smaller)
```tsx
// Minimum sizes
Body text:     text-base    (16px)   ✅
Small text:    text-sm      (14px)   ✅ (use sparingly)
Labels:        text-base    (16px)   ✅
Captions:      text-sm      (14px)   ✅

// NEVER USE
text-xs        (12px)   ❌ Too small for mobile
```

### Headings (Use responsive variants)
```tsx
// ✅ Good - Scales with viewport
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
<h2 className="text-xl sm:text-2xl lg:text-3xl">
<h3 className="text-lg sm:text-xl lg:text-2xl">

// ❌ Bad - Fixed size
<h1 className="text-3xl">
```

### Checklist
- [ ] No text smaller than 14px (text-sm)
- [ ] Body text is 16px (text-base)
- [ ] Headings use responsive classes (e.g., text-xl sm:text-2xl)
- [ ] Line height adequate (1.5 minimum for body)
- [ ] Text color has 4.5:1 contrast ratio minimum

---

## 👆 Touch Targets & Interactions

### Minimum Sizes
- [ ] All buttons: min-h-[44px] minimum (iOS standard)
- [ ] Prefer: min-h-[48px] (Android Material Design)
- [ ] Icon-only buttons: min-h-[44px] min-w-[44px]
- [ ] Form inputs: min-h-[48px]

### Spacing
- [ ] 8px minimum between adjacent touch targets
- [ ] 16px between primary and secondary actions
- [ ] 24px between destructive and primary actions
- [ ] Comfortable padding inside buttons (px-4 py-2 minimum)

### Visual Feedback
- [ ] :hover states for desktop
- [ ] :active states for mobile (tap feedback)
- [ ] Disabled state clearly visible
- [ ] Loading state when processing

### Checklist Examples
```tsx
// ✅ Good - Proper touch target
<button className="px-4 py-2 min-h-[44px] bg-emerald-600 text-white rounded-lg">
  Save
</button>

// ✅ Good - Icon button with proper size
<button 
  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
  aria-label="Delete"
>
  <Trash2 className="w-5 h-5" />
</button>

// ❌ Bad - Too small
<button className="px-2 py-1 text-xs">Save</button>

// ❌ Bad - No minimum height
<button className="p-1"><Trash2 /></button>
```

---

## 📝 Forms

### Input Fields
- [ ] Use FormField component from /components/shared/FormField.tsx
- [ ] Label text is 16px (text-base)
- [ ] Input height is 48px minimum
- [ ] Use appropriate input type (email, tel, number, date, etc.)
- [ ] Add inputMode for mobile keyboards:
  - `inputMode="email"` for email
  - `inputMode="tel"` for phone
  - `inputMode="numeric"` for numbers
  - `inputMode="decimal"` for decimals

### Form Layout
- [ ] Single column on mobile (<768px)
- [ ] Group related fields
- [ ] Use accordion or multi-step for long forms (>10 fields)
- [ ] Required fields clearly marked
- [ ] Error messages visible and descriptive

### Validation
- [ ] Validate on blur, not on every keystroke
- [ ] Show clear error messages
- [ ] Use aria-invalid and aria-describedby
- [ ] Error text is 14px minimum (text-sm)
- [ ] Error color has sufficient contrast

### Example
```tsx
// ✅ Good - Using FormField component
<FormField
  label="Email Address"
  id="email"
  type="email"
  inputMode="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  required
/>

// ❌ Bad - Custom implementation without standards
<div>
  <label className="text-xs">Email</label>
  <input type="text" className="py-1" />
</div>
```

---

## 📊 Tables & Data Display

### Mobile Strategy (Choose One)
- [ ] **Option 1:** Card view on mobile (<768px)
- [ ] **Option 2:** Horizontal scroll with shadow indicators
- [ ] **Option 3:** Expandable rows (show key data, expand for details)
- [ ] **Never:** Fixed-width columns that cause overflow

### Desktop
- [ ] Proper table headers (th elements)
- [ ] Table caption for screen readers
- [ ] Sortable columns clearly indicated
- [ ] Hover state on rows

### Examples
```tsx
// ✅ Good - Card view on mobile
<div className="block md:hidden">
  {/* Card layout */}
</div>
<div className="hidden md:block">
  <table>...</table>
</div>

// ❌ Bad - Table always
<table className="w-full">...</table>
```

---

## 🎭 Modals & Overlays

### Mobile (<768px)
- [ ] Full-screen modal OR
- [ ] Bottom sheet (slides up from bottom)
- [ ] Close button in easy-to-reach spot (top-right or bottom)
- [ ] Content scrolls, header/footer sticky
- [ ] Focus trap implemented

### Desktop
- [ ] Centered modal with max-width
- [ ] Backdrop blur/dimming
- [ ] Click outside to close (optional)
- [ ] ESC key to close

### Example
```tsx
// ✅ Good - Responsive modal
<div className="
  fixed inset-0 z-50
  md:flex md:items-center md:justify-center md:p-4
">
  <div className="
    bg-white 
    h-full md:h-auto 
    w-full md:max-w-2xl md:rounded-2xl 
    overflow-y-auto
  ">
    {/* Content */}
  </div>
</div>

// ❌ Bad - Fixed size
<div className="fixed top-1/2 left-1/2 w-[600px]">
```

---

## 🎨 Shared Components (Use These!)

### Always Check First
Before building custom UI, check if these exist:

- [ ] **StatCard** - For displaying metrics
- [ ] **StatusBadge** - For status indicators
- [ ] **FormField** - For form inputs
- [ ] **ActionButton** - For buttons with icons
- [ ] **EmptyState** - For empty states

### Usage Examples
```tsx
// Stat Card
<StatCard 
  label="Total Revenue" 
  value={`$${revenue}`} 
  variant="emerald"
  icon={<DollarSign className="w-5 h-5" />}
/>

// Status Badge
<StatusBadge status="Funded" size="md" />

// Form Field
<FormField
  label="Loan Amount"
  id="loanAmount"
  type="number"
  inputMode="numeric"
  value={amount}
  onChange={handleChange}
  required
/>

// Action Button
<ActionButton
  onClick={handleEdit}
  icon={<Edit2 />}
  label="Edit"
  variant="ghost"
  showLabel="desktop"
/>

// Empty State
<EmptyState
  icon={<FileText className="w-12 h-12" />}
  title="No deals yet"
  description="Create your first deal to get started"
  action={{ label: "New Deal", onClick: handleNewDeal }}
/>
```

---

## ♿ Accessibility

### ARIA Labels
- [ ] Icon-only buttons have aria-label
- [ ] Form inputs have associated labels (for/id)
- [ ] Error messages use aria-describedby
- [ ] Invalid inputs have aria-invalid="true"
- [ ] Status updates use role="status" or aria-live

### Keyboard Navigation
- [ ] All interactive elements reachable by Tab
- [ ] Logical tab order (matches visual flow)
- [ ] Focus visible (outline or ring)
- [ ] ESC closes modals/dropdowns
- [ ] Enter/Space activates buttons

### Color & Contrast
- [ ] Text contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Don't rely on color alone to convey information
- [ ] Link text distinguishable from body text
- [ ] Focus indicators have 3:1 contrast

### Screen Readers
- [ ] Test with VoiceOver (Mac) or TalkBack (Android)
- [ ] Headings in logical order (h1, h2, h3)
- [ ] Lists use proper markup (ul, ol, li)
- [ ] Tables have proper structure (thead, tbody, th, td)

### Example
```tsx
// ✅ Good - Accessible button
<button
  onClick={handleDelete}
  aria-label="Delete this deal"
  className="p-2 min-h-[44px] hover:bg-red-50"
>
  <Trash2 className="w-5 h-5 text-red-600" aria-hidden="true" />
</button>

// ❌ Bad - No label
<button onClick={handleDelete}>
  <Trash2 />
</button>
```

---

## ⚡ Performance

### Component Optimization
- [ ] Use shared components (reduces bundle size)
- [ ] Lazy load heavy components
- [ ] Memoize expensive calculations
- [ ] Debounce search inputs
- [ ] Virtualize long lists (>100 items)

### Images
- [ ] Use appropriate formats (WebP for photos)
- [ ] Responsive images (srcset)
- [ ] Lazy load off-screen images
- [ ] Optimize file size (<200KB per image)

### Fonts & Icons
- [ ] Use system fonts when possible
- [ ] Subset custom fonts (only needed characters)
- [ ] Use SVG icons, not icon fonts

---

## 🧪 Testing Checklist

### Before Committing
- [ ] Test on Chrome DevTools mobile emulator
- [ ] Test at 320px, 375px, 768px, 1024px widths
- [ ] No horizontal scroll at any breakpoint
- [ ] All text readable (zoom to 200% and check)
- [ ] All touch targets ≥ 44px
- [ ] Keyboard navigation works
- [ ] Test with screen reader (basic check)

### Before Deploying
- [ ] Test on real iPhone (Safari)
- [ ] Test on real Android (Chrome)
- [ ] Test on iPad
- [ ] Test slow 3G network speed
- [ ] Check Lighthouse score (aim for >90)

---

## 📋 Quick Reference

### Spacing Scale
```
4px    - gap-1, p-1
8px    - gap-2, p-2
12px   - gap-3, p-3
16px   - gap-4, p-4
24px   - gap-6, p-6
32px   - gap-8, p-8
```

### Common Breakpoints
```
sm:  640px  - Large phones, small tablets
md:  768px  - Tablets
lg:  1024px - Laptops
xl:  1280px - Desktops
2xl: 1536px - Large screens
```

### Touch Target Sizes
```
Minimum:    44x44px (iOS)
Recommended: 48x48px (Android)
Comfortable: 56x56px or larger
```

### Typography Scale
```
text-sm:   14px  - Captions, small text
text-base: 16px  - Body, labels, buttons
text-lg:   18px  - Subheadings
text-xl:   20px  - H3
text-2xl:  24px  - H2
text-3xl:  30px  - H1
text-4xl:  36px  - Hero text, large stats
```

---

## 🚀 Example: Building a New Feature

Let's say you're building a "Payment History" component:

### Step 1: Plan Mobile First
- Mobile: Show last 5 payments in cards
- Tablet: Show table with key columns
- Desktop: Show full table with all columns

### Step 2: Use Shared Components
```tsx
// Use EmptyState if no payments
{payments.length === 0 && (
  <EmptyState
    icon={<FileText className="w-12 h-12" />}
    title="No payments yet"
    description="Payments will appear here once received"
  />
)}

// Use StatusBadge for payment status
<StatusBadge status={payment.status} size="sm" />

// Use ActionButton for actions
<ActionButton
  onClick={() => handleEdit(payment.id)}
  icon={<Edit2 />}
  label="Edit Payment"
  variant="ghost"
  showLabel="desktop"
/>
```

### Step 3: Responsive Layout
```tsx
<div className="space-y-4">
  {/* Mobile: Card View */}
  <div className="block md:hidden">
    {payments.map(payment => (
      <div key={payment.id} className="bg-white rounded-lg p-4 border">
        {/* Card content */}
      </div>
    ))}
  </div>

  {/* Desktop: Table View */}
  <div className="hidden md:block">
    <table className="w-full">
      {/* Table content */}
    </table>
  </div>
</div>
```

### Step 4: Test
- [ ] Works at 320px
- [ ] Touch targets ≥ 44px
- [ ] Text ≥ 14px
- [ ] Keyboard accessible
- [ ] Screen reader friendly

---

## 💡 Pro Tips

1. **Start Small**: Begin with 320px width, then scale up
2. **Touch First**: Assume every user is on a phone
3. **Content First**: What's the core action? Make it obvious
4. **Reuse**: Check shared components before building custom
5. **Test Real**: Emulators are good, real devices are better
6. **Ask Users**: When in doubt, user test on actual mobile devices

---

## ✅ Final Checklist Before PR

- [ ] Tested on mobile (320px, 375px, 414px)
- [ ] Tested on tablet (768px)
- [ ] Tested on desktop (1024px+)
- [ ] No horizontal scroll
- [ ] All text ≥ 14px
- [ ] All touch targets ≥ 44px
- [ ] Used shared components where possible
- [ ] Proper ARIA labels
- [ ] Keyboard navigation works
- [ ] Responsive typography (text-xl sm:text-2xl pattern)
- [ ] Follows spacing standards
- [ ] Tested with screen reader (basic check)

---

**Remember:** Mobile users are your primary audience. Design for them first, then enhance for larger screens.

Print this checklist or bookmark it. Use it for every feature you build!

# Dropdown Testing Guide

Quick reference for testing the new Headless UI dropdown implementation.

## Setup

```bash
# 1. Checkout the branch
git checkout fix/headless-ui-dropdown

# 2. Install dependencies (includes @headlessui/react)
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:3000
```

## Quick Test Checklist

### ✅ Mouse Interactions

| Test | Dashboard | French | German | Pass? |
|------|-----------|--------|--------|-------|
| Click button opens dropdown | ☐ | ☐ | ☐ | |
| Click item navigates | ☐ | ☐ | ☐ | |
| Click outside closes | ☐ | ☐ | ☐ | |
| Click another button switches | ☐ | ☐ | ☐ | |
| Hover highlights items | ☐ | ☐ | ☐ | |

### ✅ Keyboard Interactions

| Test | Dashboard | French | German | Pass? |
|------|-----------|--------|--------|-------|
| Tab focuses button | ☐ | ☐ | ☐ | |
| Enter/Space opens | ☐ | ☐ | ☐ | |
| Arrow keys navigate | ☐ | ☐ | ☐ | |
| Enter activates item | ☐ | ☐ | ☐ | |
| Escape closes | ☐ | ☐ | ☐ | |
| Focus returns to button | ☐ | ☐ | ☐ | |

### ✅ Visual States

| Test | Light Mode | Dark Mode | Pass? |
|------|------------|-----------|-------|
| Active route highlighted | ☐ | ☐ | |
| Hover state visible | ☐ | ☐ | |
| ChevronDown rotates | ☐ | ☐ | |
| Checkmark shows on current page | ☐ | ☐ | |
| Dropdown animation smooth | ☐ | ☐ | |

### ✅ Responsive Design

| Test | Mobile (< 640px) | Tablet (640-1024px) | Desktop (> 1024px) | Pass? |
|------|------------------|---------------------|---------------------|-------|
| Dropdowns open correctly | ☐ | ☐ | ☐ | |
| Touch interactions work | ☐ | ☐ | N/A | |
| Text doesn't overflow | ☐ | ☐ | ☐ | |
| Emojis display | ☐ | ☐ | ☐ | |

### ✅ Accessibility

| Test | Tool/Method | Pass? |
|------|-------------|-------|
| ARIA attributes present | Browser DevTools | ☐ |
| Screen reader announces correctly | NVDA/JAWS/VoiceOver | ☐ |
| Focus visible | Tab through UI | ☐ |
| No keyboard traps | Navigate entire menu | ☐ |

## Detailed Test Scenarios

### Scenario 1: Basic Navigation
1. Click **Dashboard** button
2. Dropdown opens showing: Overview, French Dashboard, German Dashboard
3. Click **French Dashboard**
4. Navigate to /dashboard/french
5. Dropdown closes
6. French Dashboard menu item shows checkmark ✓

**Expected**: Smooth navigation, no console errors

### Scenario 2: Multiple Dropdown Switching
1. Click **Dashboard** button (opens)
2. Click **French** button
3. Dashboard closes, French opens
4. Click **German** button
5. French closes, German opens

**Expected**: Only one dropdown open at a time, smooth transitions

### Scenario 3: Click Outside
1. Click **Dashboard** button (opens)
2. Click on the page background (not on any menu)
3. Dropdown closes

**Expected**: Dropdown closes, no residual state issues

### Scenario 4: Escape Key
1. Click **French** button (opens)
2. Press **Escape** key
3. Dropdown closes
4. Focus returns to French button

**Expected**: Clean close with focus management

### Scenario 5: Keyboard Navigation
1. Tab to **German** button
2. Press **Enter** (opens dropdown)
3. Press **Arrow Down** (highlights first item)
4. Press **Arrow Down** again (highlights second item)
5. Press **Enter** (navigates to item)

**Expected**: Smooth keyboard-only navigation

### Scenario 6: Mobile Touch
1. Open on mobile viewport (< 640px)
2. Tap **Dashboard** button
3. Dropdown opens
4. Tap **Overview** item
5. Navigate to /dashboard

**Expected**: Touch interactions work like clicks

## Browser Testing Matrix

| Browser | Version | Desktop | Mobile | Pass? |
|---------|---------|---------|--------|-------|
| Chrome | Latest | ☐ | ☐ | |
| Firefox | Latest | ☐ | ☐ | |
| Safari | Latest | ☐ | ☐ | |
| Edge | Latest | ☐ | N/A | |

## Performance Checks

- [ ] No console errors
- [ ] No console warnings
- [ ] Dropdown opens < 100ms
- [ ] No layout shifts
- [ ] Animations smooth (60fps)
- [ ] No memory leaks (check DevTools)

## Comparison with Previous Implementation

Test the same scenarios to ensure:
- [ ] All previous functionality works
- [ ] New implementation is more reliable
- [ ] No regressions in behavior
- [ ] Accessibility improved

## Known Issues to Watch For

### ⚠️ Previous Implementation Issues (Should be fixed)

1. **Dropdown doesn't close properly**
   - Test: Click outside, verify it closes
   - Was: Sometimes stayed open due to event listener conflicts

2. **Multiple dropdowns open simultaneously**
   - Test: Open two dropdowns in sequence
   - Was: Both could be open due to state management bugs

3. **Escape key not working**
   - Test: Press Escape when dropdown is open
   - Was: Sometimes didn't work due to event listener timing

### ✅ Expected Improvements

1. **Consistent closing behavior**
   - Should always close when clicking outside
   - Should always close on Escape
   - Should always close when opening another dropdown

2. **Better keyboard navigation**
   - Arrow keys should work reliably
   - Focus should return to button after closing
   - No keyboard traps

3. **Improved accessibility**
   - Better ARIA attributes
   - Screen reader announcements
   - Clear focus indicators

## Reporting Issues

If you find any issues, report with:

1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser/OS/viewport**
5. **Screenshots/video if possible**

Example:
```
Issue: Dropdown doesn't close on Escape

Steps:
1. Click Dashboard button
2. Press Escape key

Expected: Dropdown closes
Actual: Dropdown stays open

Environment: Chrome 120, macOS, 1920x1080
```

## Success Criteria

All tests should pass ✅ before merging:

- [ ] All mouse interactions work correctly
- [ ] All keyboard interactions work correctly
- [ ] Visual states are correct in both themes
- [ ] Responsive design works on all viewports
- [ ] Accessibility requirements met
- [ ] No console errors or warnings
- [ ] Performance is acceptable
- [ ] No regressions from previous version

## Next Steps After Testing

1. ✅ All tests pass → **Approve and merge PR**
2. ⚠️ Minor issues → **Fix issues and retest**
3. ❌ Major issues → **Discuss with team, consider rollback**

## Reference Links

- Pull Request: #48
- Documentation: [HEADLESS_UI_MIGRATION.md](./HEADLESS_UI_MIGRATION.md)
- Headless UI Docs: https://headlessui.com/react/menu

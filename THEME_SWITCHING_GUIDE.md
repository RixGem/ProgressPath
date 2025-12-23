# Enhanced Theme Switching Guide

This document explains the new enhanced theme switching features implemented in the ProgressPath application.

## Overview

The ThemeToggle component has been enhanced with three intelligent theme modes to provide a better user experience across different preferences and scenarios.

## Features

### 1. System Theme Detection
- **How it works**: Uses `window.matchMedia('(prefers-color-scheme: dark)')` to detect the operating system's theme preference
- **Updates automatically**: Listens for system theme changes and updates the app theme in real-time
- **Best for**: Users who want consistency across all their applications

### 2. Time-Based Theme Switching
- **How it works**: Automatically switches to dark mode between 6PM (18:00) and 6AM (6:00)
- **Timezone aware**: Uses the device's local timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`
- **Automatic updates**: Checks every minute to ensure the theme matches the time of day
- **Best for**: Users who prefer dark mode at night to reduce eye strain

### 3. Manual Theme Control
- **How it works**: Traditional toggle button that lets you manually switch between light and dark themes
- **Persistent**: Saves your choice in localStorage
- **Full control**: You decide when to switch themes
- **Best for**: Users who have specific theme preferences regardless of time or system settings

## User Interface

### Theme Toggle Button
- **Sun icon**: Displayed when in dark mode (click to switch to light)
- **Moon icon**: Displayed when in light mode (click to switch to dark)
- Shows a tooltip indicating current theme and mode

### Settings Button (⚙️)
- Opens a dropdown menu with three preference options
- Click outside the menu to close it
- Highlights the currently active preference

### Dropdown Menu Options

1. **Follow System** (Default)
   - Description: "Use device theme preference"
   - Automatically syncs with your operating system's theme

2. **Time-based**
   - Description: "Dark mode 6PM - 6AM"
   - Switches themes based on the time of day

3. **Manual**
   - Description: "Toggle theme manually"
   - Gives you complete control over theme switching

## Technical Implementation

### localStorage Keys
- `themePreference`: Stores the selected preference mode ('system', 'time-based', or 'manual')
- `theme`: Stores the manual theme choice ('dark' or 'light') when in manual mode

### API Usage

#### System Theme Detection
```javascript
window.matchMedia('(prefers-color-scheme: dark)').matches
```

#### Time Detection
```javascript
const hour = new Date().getHours()
const isNightTime = hour >= 18 || hour < 6
```

#### Timezone Detection
```javascript
Intl.DateTimeFormat().resolvedOptions().timeZone
```

### Event Listeners

1. **System Theme Change Listener**
   - Monitors `prefers-color-scheme` media query
   - Updates theme automatically when system preference changes
   - Only active when "Follow System" is selected

2. **Time Check Interval**
   - Runs every 60 seconds (60,000ms)
   - Checks if theme should update based on current time
   - Only active when "Time-based" is selected

## Default Behavior

The component defaults to **"Follow System"** mode, which provides:
- Zero configuration needed
- Automatic synchronization with user's OS preference
- Respects accessibility settings
- Seamless experience across different applications

## User Preferences Persistence

All preferences are saved to `localStorage`, ensuring:
- Settings persist across browser sessions
- No server-side storage required
- Instant loading on page refresh
- Privacy-friendly (stored locally only)

## Benefits

### For Users
- **Flexibility**: Choose the mode that best fits your workflow
- **Comfort**: Automatic dark mode at night reduces eye strain
- **Consistency**: System mode keeps all apps looking uniform
- **Control**: Manual mode for specific preferences

### For Developers
- **Clean code**: Well-structured component with clear separation of concerns
- **Maintainable**: Easy to understand and modify
- **Performant**: Efficient event listeners with proper cleanup
- **Accessible**: Proper ARIA labels and semantic HTML

## Browser Compatibility

The features use modern web APIs that are supported in:
- Chrome 76+
- Firefox 67+
- Safari 12.1+
- Edge 79+

All features degrade gracefully in older browsers.

## Future Enhancements

Potential additions for future versions:
- Custom time ranges for time-based switching
- Transition animations between themes
- Multiple theme color schemes
- Per-page theme preferences
- Scheduled theme switching (e.g., weekdays vs. weekends)

## Testing

To test the implementation:

1. **System Mode**: Change your OS theme and watch the app update
2. **Time-based Mode**: Change your system time to test the 6PM-6AM switching
3. **Manual Mode**: Click the theme toggle to verify immediate switching
4. **Persistence**: Refresh the page and ensure your preference is remembered
5. **Settings Menu**: Click outside to verify it closes properly

## Support

If you encounter any issues or have suggestions for improvements, please open an issue on the GitHub repository.

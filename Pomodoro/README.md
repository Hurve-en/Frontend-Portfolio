# ⏲ Pomodoro Timer - Focus & Productivity

A professional, minimalist Pomodoro timer web application designed to boost productivity with focus sessions, break management, and comprehensive analytics.

## ✨ Features

### Core Timer Functionality

- **Focus Sessions** (Default: 25 minutes) - Dedicated work periods
- **Short Breaks** (Default: 5 minutes) - Quick recovery periods
- **Long Breaks** (Default: 15 minutes) - Extended rest periods
- **Circular Progress Ring** - Visual timer display with smooth progress animation
- **Auto-Advance** - Automatically cycle through session types

### Task Management

- Add, complete, and delete daily tasks
- Track task completion percentage
- Clear completed tasks with one click
- Responsive task list with smooth animations

### Statistics & Analytics

- **Daily Session Tracking** - Monitor sessions completed today
- **Focus Time Tracking** - Total minutes spent focusing
- **Multi-Period Analytics** - View stats for Today, This Week, or All Time
- **Streak Calculation** - Best consecutive days with sessions
- **Activity Chart** - Visual 7-day activity breakdown
- **Data Export** - Download your productivity data as JSON

### Advanced Features

- **Focus Mode** - Minimalist full-screen timer display (Press F)
- **Keyboard Shortcuts** - Quick access to all major functions
- **Dark/Light Theme** - Toggle between themes for comfortable viewing
- **Customizable Settings** - Adjust session durations to your preference
- **Sound Notifications** - Audio alert when sessions complete
- **Tab Pause** - Auto-pauses timer when browser tab loses focus
- **Persistent Data** - All data saved to localStorage

### Accessibility

- Full keyboard navigation support
- ARIA labels for screen readers
- High contrast color scheme
- Reduced motion support
- Semantic HTML structure

## 🎮 Keyboard Shortcuts

| Key      | Action            |
| -------- | ----------------- |
| `Space`  | Start/Pause timer |
| `R`      | Reset timer       |
| `F`      | Toggle Focus Mode |
| `Ctrl+,` | Open Settings     |

## 🎨 Theme & Customization

### Settings Panel

Access via the ⚙️ gear icon to customize:

- Focus duration (1-180 minutes)
- Short break duration (1-60 minutes)
- Long break duration (1-180 minutes)
- Auto-advance toggle
- Sound notifications toggle

### Theme Modes

- **Dark Mode** (Default) - Reduces eye strain during extended use
- **Light Mode** - Traditional light theme for bright environments

## 📊 Statistics

The app tracks:

- Total sessions completed
- Total focus time accumulated
- Best streak (consecutive days)
- Average session duration
- Daily activity history

Export your data anytime for personal record-keeping or analysis.

## 💾 Data Management

### Local Storage

- All data is stored locally in your browser
- No data sent to external servers
- Data persists across browser sessions
- Export data as JSON for backup

### Data Structure

```
{
  settings: { focus, short, long, autoReset, soundEnabled, theme },
  tasks: [{ id, text, completed, createdAt }],
  sessions: [{ id, date, timestamp, duration, completed }],
  daily: { date, sessionsCompleted, focusMinutes }
}
```

## 🚀 Getting Started

1. Open `Pomodoro.html` in your web browser
2. Set your desired session durations in Settings
3. Create your tasks for the day
4. Click "Start" or press Space to begin a focus session
5. Take breaks when the session completes
6. View your progress in the Statistics panel

## 🔧 Technical Details

### Technologies Used

- **HTML5** - Semantic markup with accessibility
- **CSS3** - Modern design with animations and responsive layouts
- **Vanilla JavaScript** - No external dependencies
- **SVG** - Circular progress ring visualization
- **Web Audio API** - Custom notification sounds
- **localStorage API** - Client-side data persistence

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

### File Structure

```
Pomodoro/
├── Pomodoro.html    # Semantic HTML structure
├── Pomodoro.css     # Responsive design system
├── Pomodoro.js      # State management & interactions
└── README.md        # This documentation
```

## 🎯 Best Practices for Using Pomodoro

1. **Set Clear Goals** - Define what you'll accomplish in each focus session
2. **Minimize Distractions** - Use Focus Mode to reduce notifications
3. **Take Real Breaks** - Step away from your desk during breaks
4. **Adjust Duration** - Customize durations based on your needs
5. **Review Analytics** - Monitor patterns to optimize productivity
6. **Consistent Schedule** - Use the timer at the same time daily for best results

## 🐛 Error Handling

The app includes comprehensive error handling:

- DOM element validation on startup
- localStorage availability checking
- Safe JSON parsing with fallbacks
- Try-catch blocks in all critical functions
- Console logging for debugging

## ♿ Accessibility Features

- **ARIA Labels** - Descriptive labels for all interactive elements
- **Focus Management** - Proper focus ring styling
- **Keyboard Only** - Full functionality without mouse
- **Color Contrast** - WCAG AA compliant colors
- **Reduced Motion** - Respects prefers-reduced-motion preference
- **Semantic HTML** - Proper heading hierarchy and structure

## 📝 Notes

- Daily stats reset at midnight (local time)
- Closing the tab automatically saves your state
- Timer pauses if your browser tab becomes hidden
- All calculations are timezone-aware
- Data is only stored in your browser (no cloud sync)

## 🎓 Educational Value

This project demonstrates:

- Responsive web design principles
- State management patterns
- localStorage API usage
- SVG manipulation
- Web Audio API integration
- Accessibility best practices
- Error handling strategies
- Performance optimization

---

**Made with ❤️ for productive developers**

_Last updated: 2024_

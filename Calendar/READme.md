# 📅 Minimalist Planner - Modern Calendar Web App

A beautiful, feature-rich calendar and event planning application with a modern minimalist design. Built with vanilla HTML, CSS, and JavaScript.

## ✨ Features

### Core Calendar Functionality

- **Month View**: Navigate through months with smooth transitions
- **Today Highlight**: Current date is clearly highlighted
- **Day Selection**: Click any day to view and manage events
- **Keyboard Navigation**: Use arrow keys to switch months

### Event Management

- **Create Events**: Add events with title, time, description, and category
- **Edit Events**: Modify existing events by clicking on them
- **Delete Events**: Remove events you no longer need
- **Event Categories**: Organize events by Work, Personal, Health, or Other
- **Time Support**: Add specific times or create all-day events
- **Local Storage**: All data automatically saved in your browser

### Visual Design

- **Modern UI**: Contemporary design with smooth animations
- **Color Categories**:
  - 🔵 **Blue** - Work events
  - 💗 **Pink** - Personal events
  - 💚 **Green** - Health events
  - 🟣 **Purple** - Other events
- **Dark Mode**: Automatic dark theme support based on system preferences
- **Responsive**: Works perfectly on desktop, tablet, and mobile
- **Smooth Animations**: Delightful transitions and hover effects

---

## 🚀 Getting Started

### Quick Start

1. Open `Calendar.html` in your web browser
2. You're ready to go! No installation required

### Creating an Event

1. Click on any date in the calendar
2. Click the **+ Add** button in the sidebar
3. Fill in the event details:
   - **Title** (required): Name of your event
   - **Category**: Choose Work, Personal, Health, or Other
   - **Time**: Optional specific time for the event
   - **Description**: Optional notes about the event
4. Click **Save**

### Managing Events

- **View Event**: Click on a date to see all events for that day
- **Edit Event**: Click on any event in the sidebar to edit it
- **Delete Event**: Open an event and click the **Delete** button
- **Move Event**: Edit an event and change its date

---

## ⌨️ Keyboard Shortcuts

| Shortcut          | Action               |
| ----------------- | -------------------- |
| `←`               | Previous month       |
| `→`               | Next month           |
| `Enter` / `Space` | Select a day         |
| `Escape`          | Close event modal    |
| `Tab`             | Navigate form fields |

---

## 🎨 Design Features

### Modern Aesthetics

- **Gradient Backgrounds**: Subtle gradients for depth
- **Glassmorphism**: Frosted glass effect on cards
- **Smooth Shadows**: Layered shadows for visual hierarchy
- **Icon Buttons**: Intuitive navigation controls
- **Color Accents**: Modern cyan accent throughout

### Responsive Breakpoints

- **Desktop**: Full 2-column layout (calendar + sidebar)
- **Tablet** (≤900px): Single column with reordered sections
- **Mobile** (≤640px): Optimized touch interface

### Accessibility

- **Semantic HTML**: Proper structure for screen readers
- **ARIA Labels**: Accessible descriptions
- **Focus States**: Clear keyboard navigation
- **Color Contrast**: Readable text on all backgrounds
- **Keyboard Support**: Full keyboard navigation

---

## 💾 Data Storage

- **Browser Storage**: All events stored locally using `localStorage`
- **No Account Needed**: Your data stays on your device
- **Auto-Saving**: Changes saved automatically
- **Data Persistence**: Events remain even after closing the browser
- **Multiple Browsers**: Each browser has its own calendar data

---

## 🌙 Dark Mode

The app automatically adapts to your system's dark mode preference:

- Light mode on light-themed systems
- Dark mode on dark-themed systems
- All colors optimized for both themes

---

## 📱 Browser Support

- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🎯 Event Categories

Choose the right category for your events:

### 🔵 Work

- Team meetings
- Deadlines
- Project work
- Conferences
- Client calls

### 💗 Personal

- Social events
- Shopping
- Appointments
- Entertainment
- Hobbies

### 💚 Health

- Gym sessions
- Doctor appointments
- Meditation
- Sports
- Wellness activities

### 🟣 Other

- Miscellaneous
- Uncategorized
- Future planning

---

## 🔧 Technical Details

### File Structure

```
Calendar/
├── Calendar.html      # Main application markup
├── Calendar.css       # Modern styling with dark mode
├── Calendar.js        # Application logic
└── README.md         # This file
```

### Key Technologies

- **HTML5**: Semantic markup
- **CSS3**: Modern features (Grid, Flexbox, Variables, Media Queries)
- **JavaScript**: Vanilla (no frameworks)
- **localStorage API**: For data persistence
- **CSS Variables**: Dynamic theming

### Performance

- **Lightweight**: Single page application
- **Fast Loading**: No external dependencies
- **Smooth Animations**: GPU-accelerated transforms
- **Efficient Rendering**: Optimized DOM updates

---

## 📝 Event Data Format

Events are stored with the following structure:

```javascript
{
  id: "e_timestamp",      // Unique identifier
  title: "Event Name",    // Event title (required)
  category: "work",       // Category: work, personal, health, other
  time: "14:30",          // Time (optional) in HH:MM format
  desc: "Details"         // Description (optional)
}
```

---

## 🚀 Future Ideas

- Week view toggle
- Recurring events
- Event reminders/notifications
- Search functionality
- Export to iCal format
- Recurring event patterns
- Event time reminders
- Cloud synchronization
- Multi-calendar support

---

**Built with ❤️ as a modern minimalist planner**

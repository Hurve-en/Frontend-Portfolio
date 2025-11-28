# 📝 Modern Microblog App  
*A clean, minimalist microblogging web app built with HTML, CSS, and JavaScript.*

This project is a fully client-side **microblogging app** inspired by Twitter/Threads design principles — modern, minimal, smooth, and responsive.  
All data is stored locally using **localStorage**, making it fast and private with no backend required.

---

## ✨ UI / UX Features

### 🎨 Modern Aesthetic
- Clean, minimalist layout  
- Card-style posts with soft shadows  
- Rounded corners (12–16px)  
- Calm typography (Inter, Poppins, or DM Sans)  
- Mobile-first responsive design  
- Smooth, polished spacing  

### 🌈 Animations & Micro-interactions
- Slide-down animation for Compose Post  
- Hover highlight on posts & buttons  
- Fade-in animation for new posts  
- Like button pop animation  
- Smooth color transitions  
- Modal fade for delete confirmation  

### 🌙 Theming System
Light, Dark, and optional Pastel themes using CSS variables:


Theme preference is saved using:
--bg-color
--card-bg
--text-color
--accent-color
--shadow



---

## 📌 Core Features

### 1. ✍️ Compose Post
A top "Compose" area containing:
- Textarea (auto-resizing)  
- Remaining character counter (0–300)  
- Optional emoji/mood picker  
- “Post” button  
- Validation for empty posts  

Counter colors:
- Normal: gray  
- Near limit: orange  
- At limit: red  

---

## 📌 Core Features

### 1. ✍️ Compose Post
A top "Compose" area containing:
- Textarea (auto-resizing)  
- Remaining character counter (0–300)  
- Optional emoji/mood picker  
- “Post” button  
- Validation for empty posts  

Counter colors:
- Normal: gray  
- Near limit: orange  
- At limit: red  

### 2. 📰 Post Feed
Posts display newest → oldest and include:
- Username  
- Timestamp (“5 minutes ago”)  
- Optional mood emoji  
- Post message text  
- Like button + counter  
- Edit button  
- Delete button  

Animations:
- Fade-in on new post  
- Pop animation for likes  
- Fade-out on delete  

### 3. ✏️ Edit & Delete
- Edit reopens the post in the compose box  
- Smooth slide-open animation for editing  
- Delete uses a confirmation modal  
- Cancel option in modal  

### 4. 💾 Persistent Storage
All posts are saved to **localStorage** using key:




### 2. 📰 Post Feed
Posts display newest → oldest and include:
- Username  
- Timestamp (“5 minutes ago”)  
- Optional mood emoji  
- Post message text  
- Like button + counter  
- Edit button  
- Delete button  

Animations:
- Fade-in on new post  
- Pop animation for likes  
- Fade-out on delete  

### 3. ✏️ Edit & Delete
- Edit reopens the post in the compose box  
- Smooth slide-open animation for editing  
- Delete uses a confirmation modal  
- Cancel option in modal  

### 4. 💾 Persistent Storage
All posts are saved to **localStorage** using key:

/
│── index.html # UI skeleton
│── styles.css # Themes + layout + animations
│── app.js # Core logic + rendering + storage
│── /assets/ # Icons, images
│── README.md


🌟 Optional Enhancements (Ideas)

These features are optional but recommended if you want to expand:

Pin posts to the top

Hashtag detection → auto-filter

Floating “scroll to top” button

Post analytics (like count history)

Username editing

Custom mood/emoji sets

Offline mode badge

Import/export posts to JSON

🛠️ Tech Stack

HTML5

CSS3

Vanilla JavaScript

localStorage API

Optional: emoji picker library
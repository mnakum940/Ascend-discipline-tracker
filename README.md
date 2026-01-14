# Ascend - Elevate Your Daily Standards

**Ascend** is a modern, high-performance habit execution system designed to help you build discipline through visual progress, immersive audio feedback, and a stunning "Glassmorphism" interface.

![Project Preview](preview.png)
*(Note: Add a screenshot of the app here)*

## ✨ Features

### 🎨 Immersive Design
- **Glassmorphism UI**: Beautiful frosted glass cards, subtle borders, and vibrant animated backgrounds.
- **Dynamic Time-Based Themes**: The application changes its color palette in real-time to match the time of day:
  - 🌅 **Morning**: Energetic Sunrise (Pink/Gold)
  - ☀️ **Noon**: Bright & Focused (Blue/Yellow)
  - 🌇 **Afternoon**: Warm Ambience (Amber/Orange)
  - 🌆 **Evening**: Sunset Hues (Purple/Red)
  - 🌌 **Night**: Deep Focus (Indigo/Violet)

### 🚀 Dynamic Functionality
- **Zero-Friction Management**: Easily add and remove habits.
- **Visual History**: 7-Day performance chart to track your consistency.
- **Evolving Logo**: The brand logo evolves as you complete tasks:
  - **< 50%**: Singular Focus (1 Triangle)
  - **50-85%**: Building Momentum (2 Triangles)
  - **100%**: Peak Performance (3 Triangles + Shiver/Shine Animation)

### 🔊 Interactive Feedback
- **Synthesized Sound Effects**: Custom-engineered audio using the Web Audio API (no external files needed).
  - *Click*: Satisfying tactile pop.
  - *Delete*: Quick futuristic whoosh.
  - *Success*: Triumphant chime at 100% completion.

### 📱 Responsive & Private
- **Adaptive Layout**: Optimized for both mobile (vertical stack) and desktop (2-column grid).
- **Privacy First**: All data is stored locally in your browser (`localStorage`). No servers, no sign-ups.

## 🛠️ Installation & Usage

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/ascend-habit-tracker.git
    ```
2.  **Open the Application**
    Simply open `index.html` in any modern web browser. No build steps or servers required.

## 📂 Project Structure

```
/
├── index.html      # Main application structure
├── style.css       # Glassmorphism styles & animations
├── script.js       # Core logic, audio engine, & storage
├── manifest.json   # PWA Metadata
└── README.md       # Project documentation
```

## 🤝 Contributing

This project is designed to be simple and hackable. Feel free to fork it and add:
- Cloud sync integration
- More gamification features
- Custom sound themes

## 📄 License

This project is open-source and available under the **MIT License**.

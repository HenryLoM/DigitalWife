# 💍 DigitalWife
> ❗️ Also known as Nicole or Object-10

## 📑 Table of Contents
- [✨ Overview](#-overview)
- [🎬 Launching Process](#-launching-process)
- [📂 Project Structure](#-project-structure)
- [🖥️ HTML Pages](#️-html-pages)
- [⚙️ Core Scripts](#️-core-scripts)
    - [ai.js](#aijs)
    - [emotion-ai.js](#emotion-aijs)
    - [customization-popup.js](#customization-popupjs)
- [🎨 Assets](#-assets)
- [💾 Memory System](#-memory-system)
- [🛠️ Settings & Customization](#️-settings--customization)
- [📜 Notes](#-notes)

---

## ✨ Overview
DigitalWife is a **browser-based virtual companion** built around:
- Local LLM (via Ollama API).
- Chat system with memory and logs.
- A layered sprite system (character, clothes, expressions, places).
- Popup-driven customization for character appearance and technical settings.

---

## 🎬 Launching Process

1. **Install Ollama**
    - **macOS**
        ```bash
        brew install ollama
        ```
    - **Linux (Debian-based)**
        ```bash
        curl -fsSL https://ollama.com/install.sh | sh
        ```
    - **Windows**

        [Download installer](https://ollama.com/download/windows)

2. **Start Ollama service**
    ```bash
    ollama serve
    ```
3. **Download a local LLM model**
    ```
    ollama pull <model-name>
    ```
4. Open the project
    - Run a localhost server and open `homepage.html`
5. **Set up your model**
    - In `chat.html` press **Settings** button.
    - Enter the name of the pulled model.
    - Save and feel free to use.

---

## 📂 Project Structure
```
Wife/
├── homepage.html             # Landing page
├── chat.html                 # Main chat interface
├── log.html                  # Logs / update notes
├── chat.css                  # Styling
├── favicon.ico
│
├── code/
│ ├── ai.js                   # Core AI logic
│ ├── customization-popup.js  # Appearance customization popup
│ ├── mixer.js                # Extra AI/logic features
│ ├── vader-sentiment.js      # Sentiment analyzer
│ └── files/
│   ├── instructions.txt      # System prompt / lore
│   ├── avatar.txt            # User data
│   ├── recollection.txt      # AI memory
│   └── touching-phrases.txt  # Prewritten lines
│
├── media/
│ ├── screenshots/...         # Demo screenshots
│ ├── places/...              # Backgrounds (street, park, etc.)
│ ├── frame/...               # Decorative chat frame
│ ├── mini-frame/...          # Smaller frame
│ └── nicole/                 # Character sprites
│   ├── bodies/...            # Skin tones
│   ├── clothes/...           # Clothes & uniforms
│   ├── expressions/...       # Neutral, happy, angry, sad, etc.
│   └── additional/...        # Accessories (headphones, ribbons, blush)
```

---

## 🖥️ HTML Pages
### **chat.html**
- Main interface:
    - Left: Chat window (messages).
    - Right: Wife sprite (layered images).
- Controls:
    - Send message.
    - Save / Load / Restart chat.
    - Edit instructions, avatar, and memo.
    - Customize appearance (popup).
    - Technical settings (model, port, overlays).

### **homepage.html**
- Introduction and navigation to **Chat** and **Logs**.

### **log.html**
- Notes on updates / last modified date.

---

## ⚙️ Core Scripts

### **ai.js**
Handles all **AI interactions and memory**.
- 🔌 **Ollama integration** (`chatWithOllama`)
    - Connects to local Ollama instance.
    - Streams responses with abort support.

- 💬 **Chat workflow** (`handleAiResponse`)
    - Builds message payload (instructions, avatar, memory, context).
    - Appends user + AI messages to DOM and memory.

- 🧠 **Memory management**
    - Add / update / delete / rewind / refresh messages.
    - Save & load chat logs (`.txt`).
    - Trim memory to avoid overload.

- 🛠️ **Popup editing**
    - Edit `instructions`, `avatar`, `recollection`.
    - Character counter (700 limit).

- ⚡ **Tech Details Editor (Settings)**
    - Edit AI name, model, port.
    - Export/import JSON setups (appearance, overlays, settings).

- 🎛️ **Appearance state**  
    - Save/restore sprite layers (body, hair, clothes, background).  
    - Auto-update `appearanceContext` for AI input.

- ✏️ **Message controls**
    - Refresh ↻, Delete ♻, Edit ✎, Copy ⧉ per message.

---

### **emotion-ai.js**
Handles **emotion inference** based on chat text. This script directly affects which **expression sprite** is displayed and whether the **blush overlay** is active.
- ✍️ Uses a rewritten **local version of VADER sentiment analysis** (`vader-sentiment.js`).
- 🍅 Detects **blush state** if certain keywords appear (e.g. “blush”, “awkward”, “embarrassed”, etc).
- ↩️ Returns both:
    - **Emotion label** (happy, smile, annoyed, angry, sad, neutral).
    - **Blush flag** (true/false).
- 📊 Sentiment thresholds:
    - `≥ 0.8` → happy 2
    - `≥ 0.6` → happy 1
    - `≥ 0.5` → smile 2
    - `≥ 0.3` → smile 1
    - `≥ 0.1` → neutral
    - `≥ -0.2` → annoyed
    - `≥ -0.4` → angry
    - `≥ -0.6` → sad

---

### **customization-popup.js**
Manages **character customization popup**.
- 👇 Opens with `Customize` button.
- 📑 Two-page navigation:
    - **Page 0**: Clothes, Places, Additional.
    - **Page 1**: Skin Tone, Hairstyles.

- 🎨 **Assets defined in lists**:  
    - `bodiesList` → skin tones.
    - `hairList` → multiple styles (lob, long, bob, hime, twin).
    - `clothesList` → casual, uniforms, swimwear, intimate.
    - `placesList` → home, city, misc.
    - `additionalList` → flowers, ribbons, headphones, blush.

- ⚙️ Each selection:
    - Updates corresponding DOM overlay (`clothes-overlay`, `background`, etc.).
    - Updates `selected*` globals + `appearanceContext`.
    - Saves to localStorage.

- 🫷 Includes **close button** and smooth transitions.

---

## 🎨 Assets
- **Nicole**: Body + hair + clothes + expression layers.
- **Backgrounds**: Living room, park, cafe, cinema, etc.
- **UI Frames**: Retro decorative frame images.

---

## 💾 Memory System
- Chat stored in array of `{ index, role, content }`.
- Index ensures **sync between DOM and memory**.
- Supports:
    - Save to `.txt`.
    - Load from `.txt`.
    - Export/import full setup (`.json`).
- Trimmed to avoid overload (`trimLimit`).
- AI gets the whole context each message, so every change affects the chatting.

---

## 🛠️ Settings & Customization
- **Instructions editor** – edit AI personality/system prompt.
- **Avatar editor** – edit user description.
- **Memo editor** – edit AI recollection memory.
- **Tech Editor** – manage AI name, Ollama model, port, overlays.
- **Appearance popup** – select clothes, hair, place, accessories.

---

## 📜 Notes
- Requires **Ollama** running locally (`default port 11434`).
- Default model: `"NicoleShelterV1"`.
- Uses **localStorage** to persist appearance, avatar, and AI memory across sessions.
- Chat controls include refresh, edit, delete, copy for fine-grained conversation control.

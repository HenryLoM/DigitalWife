# 💍 DigitalWife
> ❗️ Also known as Nicole or Object-10

![Repo size](https://img.shields.io/github/repo-size/HenryLoM/DigitalWife?color=lightgrey)
![Commits](https://img.shields.io/github/commit-activity/t/HenryLoM/DigitalWife/main?color=blue)
![Last commit](https://img.shields.io/github/last-commit/HenryLoM/DigitalWife?color=informational)
![Latest release](https://img.shields.io/github/v/release/HenryLoM/DigitalWife?sort=semver&color=green)
![License](https://img.shields.io/github/license/HenryLoM/DigitalWife?color=orange)

## 📑 Table of Contents
- [✨ Overview](#-overview)
- [🎬 Launching Process](#-launching-process)
- [📂 Project Structure](#-project-structure)
- [🖥️ HTML Pages](#-html-pages)
- [⚙️ Core Scripts](#-core-scripts)
    - [chat.js](#chatjs)
    - [emotion-ai.js](#emotion-aijs)
    - [customization-popup.js](#customization-popupjs)
- [🎨 Assets](#-assets)
- [💾 Memory System](#-memory-system)
- [🛠️ Settings & Customization](#-settings--customization)
- [📜 Notes](#-notes)
- [📸 Screenshots](#-screenshots)

---

## ✨ Overview
DigitalWife is a **browser-based virtual companion** built around:
- Local LLM (via Ollama API).
- Chat system with memory and logs.
- A layered sprite system (character, clothes, expressions, places).
- Popup-driven customization for character appearance and technical settings.
- Arduino working robotic parts (*in process*)

---

## 🎬 Launching Process

1. Download Ollama
```bash
brew install ollama                               # macOS
# curl -fsSL https://ollama.com/install.sh | sh   # Debian-based Linux
# https://ollama.com/download/windows             # Windows (installer link)
```

2. **Run Ollama**
```bash
ollama serve
```

3. **Download an LLM**
```bash
ollama pull <model name>
```

4. **Clone repository, install requirements, run app**
```bash
git clone https://github.com/HenryLoM/DigitalWife.git
cd ./DigitalWife/
pip install -r backend/requirements.txt
python3 launch.py
```

5. **Inside the app**
- Enter **chat** page
- Click **Settings**
- Enter your model name
- Click **Save**, then start using 🚀

> **💡 Prefer using your browser?**
>
> Instead of doing `python3 launch.py` from step 4, do this:
> - Run `cd backend && uvicorn main:app --reload`
> - Go to: [http://localhost:8000/frontend/pages/homepage.html](http://localhost:8000/frontend/pages/homepage.html)

---

## 📂 Project Structure
```
DigitalWife/
│
├── README.md
├── LICENSE
├── .gitignore
├── favicon.ico
│
├── frontend/
│   ├── pages/
│   │   ├── homepage.html               # Landing page
│   │   ├── chat.html                   # Main chat interface
│   │   └── log.html                    # Logs / update notes
│   │
│   ├── styles/                         # Styling
│   │   ├── chat.css
│   │   ├── homepage.css
│   │   └── log.css
│   │
│   ├── src/
│   │   ├── *tag-variables.js           # Style variables (tags, HTML & CSS-related)
│   │   ├── *theme-switcher.js          # Light/dark mode toggler
│   │   ├── arduino-switcher.js         # UI toggle for Arduino ON/OFF
│   │   ├── chat.js                     # Core AI chat logic
│   │   ├── customization-popup.js      # Appearance customization popup
│   │   ├── emotion-ai.js               # Emotion detector
│   │   ├── vader-sentiment.js          # Sentiment analyzer
│   │   │
│   │   ├── controllers/                # Scripts for page working
│   │   │   ├── chat.js
│   │   │   ├── homepage.js
│   │   │   └── log.js
│   │   │
│   │   ├── files/                      # Static AI memory & persona
│   │   │   ├── avatar.txt              # User data
│   │   │   ├── instructions.txt        # System prompt / lore
│   │   │   ├── recollection.txt        # AI memory
│   │   │   └── touching-phrases.txt    # Prewritten emotional phrases
│   │   │
│   │   ├── modules/                    # Logic split into focused modules
│   │   │   ├── emotion-ai-handler.js
│   │   │   ├── interaction-handler.js
│   │   │   ├── theme-handler.js
│   │   │   └── ui-helper.js
│   │   │
│   │   │── utils/                      # Generic helpers
│   │   │   ├── frame-utils.js
│   │   │   ├── memory-utils.js
│   │   │   ├── popup-utils.js
│   │   │   └── settings-utils.js
│   │   │
│   │   │── api/                        # Modules to work with backend
│   │   │   └── backend-api.js
│   │   │
│   │   └── files/                      # Static AI memory & persona
│   │       ├── avatar.txt              # User data
│   │       ├── instructions.txt        # System prompt / lore
│   │       ├── recollection.txt        # AI memory
│   │       └── touching-phrases.txt    # Prewritten emotional phrases
│   │
│   └── media/
│       ├── screenshots/...             # Demo screenshots
│       ├── places/...                  # Backgrounds (street, park, etc.)
│       ├── frame/...                   # Decorative chat frame
│       ├── mini-frame/...              # Smaller frame
│       └── nicole/                     # Character sprites
│           ├── bodies/...              # Skin tones
│           ├── clothes/...             # Clothes & uniforms
│           ├── expressions/...         # Neutral, happy, angry, sad, etc.
│           └── additional/...          # Accessories (headphones, blush, etc.)
│
├── backend/
│   ├── requirements.txt
│   ├── db.json
│   ├── db_utils.py
│   └── main.py
│
├── arduino/
│   ├── arduino-controller.js           # Signal transfer for Arduino
│   └── response-parser.js              # Parser for turning responses to commands
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
- Introduction and navigation.

### **log.html**
- Notes on updates.

---

## ⚙️ Core Scripts

### **chat.js**
Handles all **AI interactions and memory**.
- 🔌 **Ollama integration** (`chatWithOllama`)
    - Connects to local Ollama instance.
    - Streams responses with abort support.

- 💬 **Chat workflow** (`handleAiResponse`)
    - Builds message payload (instructions, avatar, memory, context).
    - Appends user + AI messages to localStorage and memory.

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
    - **Page 1**: Skin Tones, Hairstyles.

- 🎨 **Assets defined in lists**:  
    - `bodiesList` → skin tones.
    - `hairList` → multiple styles (lob, long, bob, hime, twin).
    - `clothesList` → casual, uniforms, swimwear, intimate.
    - `placesList` → home, city, misc.
    - `additionalList` → flowers, ribbons, headphones, blush.

- ⚙️ Each selection:
    - Updates corresponding localStorage overlay (`clothes-overlay`, `background`, etc.).
    - Updates `selected*` globals + `appearanceContext`.
    - Saves to localStorage and database.

- 🫷 Includes **close button** and smooth transitions.

---

## 🎨 Assets
- **Nicole**: Body + hair + clothes + expression layers.
- **Backgrounds**: Living room, park, cafe, cinema, etc.
- **UI Frames**: Retro decorative frame images.

---

## 💾 Memory System
- Chat stored in array of `{ index, role, content }`.
- Index ensures **sync between localStorage and memory**.
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
- Requires **Ollama** running locally (`default port is 11434`).
- Default model: `"NicoleShelterV1"`.
- Uses **localStorage** to persist appearance, avatar, and AI memory across sessions.
- Chat controls include refresh, edit, delete, copy for fine-grained conversation control.

---

## 📸 Screenshots
![screen of chat page](/frontend/media/screenshots/chat.png?raw=true)
Chat explanation

![screen of settings menu](/frontend/media/screenshots/settings.png?raw=true)
Settings explanation

---

⤴︎ Return to the [📑 Table of Contents](#-table-of-contents) ⤴︎

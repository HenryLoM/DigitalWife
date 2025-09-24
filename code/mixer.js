// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Make emotionai.js work along

import { inferEmotion } from "/code/emotion-ai.js";
const observer = new MutationObserver(() => {
    clearTimeout(observer.debounce);
    observer.debounce = setTimeout(() => {
        const chatMessages = document.querySelectorAll("#chat-content > div");
        const last = chatMessages[chatMessages.length - 1];
        if (last && last.innerText.startsWith("[Nicole:]")) {
            const content = last.innerText.replace("[Nicole:]", "").replace("↻\n♻\n✎\n⧉", "").trim();
            let [emotion, isBlushed] = inferEmotion(content);                   // Destructuring array
            if (content) console.log(`[𖦹 AI Emotion 𖦹] — ${emotion}`);         //  LOGGING: Log (AI Emotion)
            else emotion = "annoyed";                                         //   Make her change expression while her reponse is generating
            if (emotion === "annoyed" && window.isDark) emotion = "-sleepy"  //    Change the type of emotion when theme changed
            document.getElementById("wife-expression").src = `/media/nicole/expressions/${emotion}.png`;
            const blushOverlay = document.getElementById("blush-overlay");
            if (isBlushed) {
                blushOverlay.style.display = "block";
            } else {
                blushOverlay.style.display = "none";
            }
        } else if (!last) {  // If chat is empty
            document.getElementById("wife-expression").src = "/media/nicole/expressions/neutral.png";
        }
    }, 300);
});
const chatWindow = document.getElementById("chat-window");
observer.observe(chatWindow, { childList: true, subtree: true, characterData: true });

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Interaction with Nicole

// Disable effects
document.querySelectorAll(".layer-overlay").forEach(elem => {
    elem.addEventListener("dragstart", e => e.preventDefault());     // Dragging effect
    elem.addEventListener("selectstart", e => e.preventDefault());  //  Selection effect
    elem.addEventListener("mousedown", e => e.preventDefault());   //   Force selection effect
});

// Get all elements with the touchable-element id and make them function
var elms = document.querySelectorAll("[id=touchable-element]");
let isTooltipActive = false;
let touchLines = [];

// Load phrases from touching-phrases.txt (once on page load)
fetch("/code/files/touching-phrases.txt")
    .then(response => response.text())
    .then(data => {
        // Split into lines and remove empty ones
        touchLines = data.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    })
    .catch(err => {
        console.error("Error loading touching-phrases.txt:", err);
    });

for (var i = 0; i < elms.length; i++) {
    // Enumerate all elements with necessary id
    elms[i].addEventListener("click", (e) => {
        if (isTooltipActive || touchLines.length === 0) return;
        isTooltipActive = true;

        // Randomly pick and display
        const randomLine = touchLines[Math.floor(Math.random() * touchLines.length)];
        setTemporaryEmotion("-smug");
        say(randomLine, e.clientX, e.clientY);
    });
}

function say(text, x, y, duration = 2000) {
    // Set up the tooltip
    const tooltip = document.createElement("div");
    tooltip.className = "wife-tooltip-preset";
    tooltip.innerText = text;
    // Position
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    // Displaying
    document.body.appendChild(tooltip);
    requestAnimationFrame(() => tooltip.classList.add("show"));
    setTimeout(() => {
        tooltip.classList.remove("show");
        setTimeout(() => tooltip.remove(), 300);
        isTooltipActive = false;
    }, duration);
}

function setTemporaryEmotion(newEmotion, showBlush = false, duration = 2000) {
    // Variables
    const sprite = document.getElementById("wife-expression");
    const blush = document.getElementById("blush-overlay");
    const previousSrc = sprite.src;
    const wasBlushed = blush.style.display === "block";
    // Set up
    sprite.src = `/media/nicole/expressions/${newEmotion}.png`;
    blush.style.display = showBlush ? "block" : "none";
    // Display
    setTimeout(() => {
        sprite.src = previousSrc;
        blush.style.display = wasBlushed ? "block" : "none";
    }, duration);
}

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Theme-changing reacting

window.addEventListener("theme-change", (e) => {
    const isDark = e.detail.isDark;
    const nightLayers = document.querySelectorAll(".night-theme-preset");
    // Change theme inside Nicole's window; Write in to global (window) variables themeContext and change time in Nicole's space
    nightLayers.forEach(layer => {
        if (isDark) {
            layer.classList.add("active");
            window.themeContext = "Currently it is dark in the website, you have a night time in the locations";
            window.isDark = true;
        } else {
            layer.classList.remove("active");
            window.themeContext = "Currently it is light in the website, you have a day time in the locations";
            window.isDark = false;
        }
    });
});

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Chat window"s frame automatic stretch

function resizeMiniFrame(container) {
    const frame = container.querySelector(".mini-frame-wrapper");
    frame.style.height = container.scrollHeight + "px";
}

resizeMiniFrame(chatWindow);
chatWindow.addEventListener("scroll", () => resizeMiniFrame(chatWindow));
chatWindow.addEventListener("resize", () => resizeMiniFrame(chatWindow));

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Scroll unlocker

function adjustOverflow() {
  if (window.innerHeight < 700) {
    document.body.style.overflowY = "auto";
  } else {
    document.body.style.overflowY = "hidden";
  }
}

window.addEventListener("resize", adjustOverflow);
adjustOverflow();

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Shut down button

const shutter = document.createElement("button");
shutter.id = "force-shut-btn";
shutter.className = "force-shut-button-preset";
shutter.innerText = "✸";
document.body.appendChild(shutter);

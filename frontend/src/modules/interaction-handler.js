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
fetch("/frontend/src/files/touching-phrases.txt")
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
    sprite.src = `/frontend/media/nicole/expressions/${newEmotion}.png`;
    blush.style.display = showBlush ? "block" : "none";
    // Display
    setTimeout(() => {
        sprite.src = previousSrc;
        blush.style.display = wasBlushed ? "block" : "none";
    }, duration);
}

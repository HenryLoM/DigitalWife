/**
 * Creates an Arduino switcher UI that allows toggling Arduino ON/OFF.
 * 
 * @returns {void}
 */
function createArduinoSwitcher() {
    // Create container for Arduino switcher
    const switcher = document.createElement("div");
    switcher.id = "arduino-switcher";

    // Create button
    const button = document.createElement("div");
    button.className = "arduino-toggle";

    // Inner circle with status icon/text
    const circle = document.createElement("div");
    circle.className = "arduino-toggle-circle";

    // Build DOM structure
    button.appendChild(circle);
    switcher.appendChild(button);
    document.body.appendChild(switcher);

    // Load saved state
    let saved = localStorage.getItem("arduino");
    window.isArduino = saved === "on";

    // Prevent transitions during initial render
    document.documentElement.classList.add("no-transition");

    applyArduinoState(window.isArduino);
    updateSwitcherUI(window.isArduino);

    requestAnimationFrame(() => {
        document.documentElement.classList.remove("no-transition");
    });

    // Toggle on click
    button.addEventListener("click", () => {
        window.isArduino = !window.isArduino;
        applyArduinoState(window.isArduino);
        updateSwitcherUI(window.isArduino);
        console.log(`[☂ LOG ☂ ARDUINO ☂] — Arduino ${window.isArduino ? "on" : "off"}.`);  // LOGGING: Log
    });

    /**
     * Update the UI to reflect current Arduino state
     * 
     * @param {boolean} on - True if Arduino is ON
     */
    function updateSwitcherUI(on) {
        button.classList.toggle("on", on);
        circle.innerText = on ? "⚡" : "⏻";
        switcher.setAttribute("data-arduino", on ? "on" : "off");
    }
}

/**
 * Apply Arduino state, save to storage, and dispatch event
 * 
 * @param {boolean} on - True if Arduino is ON
 * @returns {void}
 */
function applyArduinoState(on) {
    if (on) {
        // Do something when Arduino turns ON
        window.dispatchEvent(new CustomEvent("arduino-change", { detail: { isOn: true } }));
        localStorage.setItem("arduino", "on");
    } else {
        // Do something when Arduino turns OFF
        window.dispatchEvent(new CustomEvent("arduino-change", { detail: { isOn: false } }));
        localStorage.setItem("arduino", "off");
    }
}

// Run when DOM is ready
document.addEventListener("DOMContentLoaded", createArduinoSwitcher);

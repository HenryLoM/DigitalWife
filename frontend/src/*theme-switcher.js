// Make the page visible after initial hidden state to avoid flicker
window.addEventListener("load", () => {
    document.documentElement.style.visibility = "visible";
    createThemeSwitcher();
});

/**
 * Creates a theme switcher UI that allows users to toggle between light and dark themes.
 * 
 * @returns {void}
 */
function createThemeSwitcher() {
    // Create a container div for the theme switcher UI
    const switcher = document.createElement("div");
    switcher.id = "theme-switcher";

    // Create the toggle button div
    const button = document.createElement("div");
    button.className = "theme-toggle";

    // Create the circle inside the button that shows the sun/moon icon
    const circle = document.createElement("div");
    circle.className = "theme-toggle-circle";
    circle.innerText = "☀";

    // Build the switcher structure
    button.appendChild(circle);
    switcher.appendChild(button);
    document.body.appendChild(switcher);

    // Read the saved theme from localStorage, set darkMode true if 'dark'
    let savedTheme = localStorage.getItem("theme");
    let darkMode = savedTheme === "dark";

    // Add a CSS class that disables all transitions to prevent flickering on theme apply
    document.documentElement.classList.add("no-transition");

    applyTheme(darkMode);         // Apply the saved theme colors immediately
    updateSwitcherUI(darkMode);  //  Update the switcher UI (icon and button class) to match the theme

    // Remove the no-transition class on the next animation frame to restore animations
    requestAnimationFrame(() => {
        document.documentElement.classList.remove("no-transition");
    });

    // Toggle theme when the button is clicked
    button.addEventListener("click", () => {
        darkMode = !darkMode;          // Switch the boolean
        applyTheme(darkMode);         //  Change the theme colors
        updateSwitcherUI(darkMode);  //   Update UI accordingly
        console.log(`[☂ LOG ☂ THEME ☂] — Theme turned ${darkMode ? "dark" : "light"}.`);  // LOGGING: Log
    });

    /**
     * Updates the toggle button UI based on current theme
     * 
     * @param {boolean} dark - True if dark theme, false for light theme
     * @returns {void}
     */
    function updateSwitcherUI(dark) {
        button.classList.toggle("dark", dark);
        circle.innerText = dark ? "⏾" : "☀︎";
    }
}

/**
 * Apply CSS variables based on theme, update localStorage, and notify via event
 * 
 * @param {boolean} dark - True for dark theme, false for light theme
 * @returns {void}
 */
function applyTheme(dark) {
    const root = document.documentElement;

    if (dark) {
        // Set CSS variables for dark theme colors
        root.style.setProperty("--main-color", "#5f512e");
        root.style.setProperty("--back-color", "#baa27f");
        root.style.setProperty("--in-color", "#fef3d6");
        window.dispatchEvent(new CustomEvent("theme-change", { detail: { isDark: true } }));  // Dispatch to notify other parts
        localStorage.setItem("theme", "dark");  // Save the current theme choice
    } else {
        // Set CSS variables for light theme colors
        root.style.setProperty("--main-color", "#fef3d6");
        root.style.setProperty("--back-color", "#604e34");
        root.style.setProperty("--in-color", "#604e34");
        window.dispatchEvent(new CustomEvent("theme-change", { detail: { isDark: false } }));  // Dispatch to notify other parts
        localStorage.setItem("theme", "light");  // Save the current theme choice
    }
}

// Run createThemeSwitcher when DOM is loaded (redundant if inside first listener, can remove this if desired)
document.addEventListener("DOMContentLoaded", createThemeSwitcher);

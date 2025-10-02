/**
 * Restores all appearance layers from localStorage.
 *
 * @returns {void}
 */
export function restoreAppearanceLayers() {
    const layers = [
        "wife-hair-back",
        "bodies-overlay",
        "clothes-overlay",
        "wife-hair-front",
        "blush-overlay",
        "additional-overlay",
        "background"
    ];
    layers.forEach(id => {
        const elem = document.getElementById(id);
        if (!elem) return;
        const src = localStorage.getItem(`layer_${id}_src`);
        if (src) elem.src = src;
        const display = localStorage.getItem(`layer_${id}_display`);
        if (display !== null) elem.style.display = display;
    });
    window.appearanceContext = localStorage.getItem("appearanceContext") || window.appearanceContext;
}

/**
 * Saves the current state of all appearance layers into localStorage.
 *
 * @returns {void}
 */
export function saveAppearanceLayers() {
    const layers = [
        "wife-hair-back",
        "bodies-overlay",
        "clothes-overlay",
        "wife-hair-front",
        "blush-overlay",
        "additional-overlay",
        "background"
    ];
    layers.forEach(id => {
        const elem = document.getElementById(id);
        if (!elem) return;
        localStorage.setItem(`layer_${id}_src`, elem.src);
        localStorage.setItem(`layer_${id}_display`, elem.style.display);
    });
    localStorage.setItem("appearanceContext", window.appearanceContext);
}

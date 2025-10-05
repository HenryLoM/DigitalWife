import * as BackendAPI from "/frontend/src/api/backend-api.js";

/**
 * Opens the Settings popup for AI technical and appearance configuration.
 *
 * @param {Object}   state  - Current state object with keys: { aiName, model, port, arduinoDevice, baudRate }
 * @param {Function} onSave - Callback triggered when settings are saved.
 * @returns ?
 */
export function openSettings(state, onSave) {
    let popup = document.getElementById("settings-popup");

    // Toggle off if already visible
    if (popup && popup.style.display === "block") {
        popup.style.display = "none";
        return;
    }

    // Create popup if not present
    if (!popup) {
        popup = document.createElement("div");
        popup.id = "settings-popup";
        popup.style.position = "fixed";
        popup.style.top = "50%";
        popup.style.left = "50%";
        popup.style.transform = "translate(-50%, -50%)";
        popup.style.padding = "20px";
        popup.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
        popup.style.zIndex = "9999";
        document.body.appendChild(popup);
    }

    // Fill popup content
    popup.innerHTML = `
        <label for="settings-aiName-input">ChatBot's name:</label><br>
        <input id="settings-aiName-input" type="text" value="${localStorage.getItem("ai-name") || state.aiName}" style="width:100%;margin-bottom:12px;" placeholder="name that will be used everywhere"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><br>
        <label for="settings-model-input">Ollama model name:</label><br>
        <input id="settings-model-input" type="text" value="${localStorage.getItem("ollama-model") || state.model}" style="width:100%;margin-bottom:12px;" placeholder="check via 'ollama list'"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><br>
        <label for="settings-port-input">Ollama port:</label><br>
        <input id="settings-port-input" type="text" value="${localStorage.getItem("ollama-port") || state.port}" style="width:100%;margin-bottom:12px;" placeholder="default is 11434"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><br>
        <label for="settings-arduino-input">Arduino Path:</label><br>
        <input id="settings-arduino-input" type="text" value="${localStorage.getItem("arduino-device") || state.arduinoDevice}" style="width:100%;margin-bottom:12px;" placeholder="no need to change if you do not use Arduino"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><br>
        <label for="settings-baud-input">Arduino Baud Rate:</label><br>
        <input id="settings-baud-input" type="text" value="${localStorage.getItem("arduino-baud") || state.baudRate}" style="width:100%;margin-bottom:12px;" placeholder="baud rate of your arduino, 9600 for most"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><br>
        <button id="settings-save-btn">Save</button>
        <button id="settings-cancel-btn">Cancel</button>
        <button id="settings-export-btn">Export setup</button>
        <button id="settings-import-btn">Import setup</button>
    `;

    popup.style.display = "block";

    // Save logic
    document.getElementById("settings-save-btn").onclick = () => saveSettings(state, onSave);
    // Cancel logic
    document.getElementById("settings-cancel-btn").onclick = () => closeSettings();
    // Export setup logic
    document.getElementById("settings-export-btn").onclick = exportSetup;
    // Import setup logic
    document.getElementById("settings-import-btn").onclick = importSetup;
}

/**
 * Saves the settings from the popup to localStorage and updates the state.
 * 
 * @param {Object}   state  - Current state object to be updated.
 * @param {Function} onSave - Callback triggered after saving settings.
 * @returns {void}
 */
function saveSettings(state, onSave) {
    const newState = {
        aiName:        document.getElementById("settings-aiName-input").value,
        model:         document.getElementById("settings-model-input").value,
        port:          document.getElementById("settings-port-input").value,
        arduinoDevice: document.getElementById("settings-arduino-input").value,
        baudRate:      document.getElementById("settings-baud-input").value
    };

    // Persist in localStorage
    localStorage.setItem("ai-name",        newState.aiName);
    localStorage.setItem("ollama-model",   newState.model);
    localStorage.setItem("ollama-port",    newState.port);
    localStorage.setItem("arduino-device", newState.arduinoDevice);
    localStorage.setItem("arduino-baud",   newState.baudRate);

    // Callback for syncing external state
    Object.assign(state, newState);
    if (onSave) onSave(newState);

    // Persist to database
    BackendAPI.updateField("settings", newState).catch(() => {});
    BackendAPI.updateField("ai-name", newState.aiName).catch(() => {});
    BackendAPI.updateField("ollama-model", newState.model).catch(() => {});
    BackendAPI.updateField("ollama-port", newState.port).catch(() => {});
    closeSettings();

    // Update UI
    document.getElementById(HTML_TAG.titleInputField).placeholder = `${newState.aiName}'s room`;

    console.log("[☂ LOG ☂ SETTINGS ☂] — Technical settings updated.");  // LOGGING: Log
}

/**
 * Closes the Settings popup.
 *
 * @returns {void}
 */
function closeSettings() {
    const popup = document.getElementById("settings-popup");
    if (popup) popup.style.display = "none";
}

/**
 * Exports the current setup as a JSON file.
 * 
 * @returns {void}
 */
function exportSetup() {
    // Define label mapping based on order of appearanceData
    const labelMap = {
        body:       window.appearanceData[0],
        hair:       window.appearanceData[2],
        clothes:    window.appearanceData[3],
        place:      window.appearanceData[4],
        extra:      window.appearanceData[5],
        eyes:       window.appearanceData[1] || "Purple",
        blush:      null  // always null
    };
    // Map overlay IDs to appearanceData keys
    const idToLabelKey = {
        "bodies-overlay":     "body",
        "wife-hair-back":     "hair",
        "wife-hair-front":    "hair",
        "clothes-overlay":    "clothes",
        "background":         "place",
        "additional-overlay": "extra",
        "blush-overlay":      "blush"
    };

    // Collect overlays (images + divs) from the localStorage
    let overlays = Array.from(document.querySelectorAll(".lo-to-save")).map(el => {
        const key = idToLabelKey[el.id];
        const label = key ? labelMap[key] : null;

        return {
            id: el.id,
            src: el.tagName.toLowerCase() === "img" ? el.getAttribute("src") : null,
            style: el.getAttribute("style") || null,
            class: el.getAttribute("class") || null,
            label: label
        };
    });

    // Base setup (original fields)
    const setup = {
        aiName:         localStorage.getItem("ai-name")        || "",
        model:          localStorage.getItem("ollama-model")   || "",
        port:           localStorage.getItem("ollama-port")    || "",
        arduinoDevice:  localStorage.getItem("arduino-device") || "",
        baudRate:       localStorage.getItem("arduino-baud")   || "",
        instructions:   localStorage.getItem("instructions")   || "",
        avatar:         localStorage.getItem("avatar")         || "",
        recollection:   localStorage.getItem("recollection")   || "",
        appearanceData: window.appearanceData                  || [],
        overlays:       overlays
    };

    // Export JSON
    const json = JSON.stringify(setup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${setup.aiName || "AI"}'s setup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`[☂ LOG ☂ EXPORT ☂] — Setup exported as ${a.download}.`);  // LOGGING: Log
}

/**
 * Imports the setup from a JSON file.
 * 
 * @returns {void}
 */
function importSetup() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const setup = JSON.parse(text);

            // Restore basic settings
            if (setup.aiName)        localStorage.setItem("ai-name",        setup.aiName);
            if (setup.model)         localStorage.setItem("ollama-model",   setup.model);
            if (setup.port)          localStorage.setItem("ollama-port",    setup.port);
            if (setup.arduinoDevice) localStorage.setItem("arduino-device", setup.arduinoDevice);
            if (setup.baudRate)      localStorage.setItem("arduino-baud",   setup.baudRate);
            if (setup.instructions)  localStorage.setItem("instructions",   setup.instructions);
            if (setup.avatar)        localStorage.setItem("avatar",         setup.avatar);
            if (setup.recollection)  localStorage.setItem("recollection",   setup.recollection);

            // Restore overlays
            if (setup.overlays && Array.isArray(setup.overlays)) {
                setup.overlays.forEach(layer => {
                    const el = document.getElementById(layer.id);
                    if (el) {
                        if (layer.src && el.tagName.toLowerCase() === "img") {
                            el.setAttribute("src", layer.src);
                        }
                        if (layer.style) {
                            el.setAttribute("style", layer.style);
                        }
                        if (layer.class) {
                            el.setAttribute("class", layer.class);
                        }
                    }
                });
            }

            // Restore appearanceData
            if (setup.appearanceData && Array.isArray(setup.appearanceData)) {
                window.appearanceData = setup.appearanceData;

                // Update selected* globals
                selectedBody    = setup.appearanceData[0] || null;
                selectedEyes    = setup.appearanceData[1] || null;
                selectedHair    = setup.appearanceData[2] || null;
                selectedClothes = setup.appearanceData[3] || null;
                selectedPlace   = setup.appearanceData[4] || null;
                selectedExtra   = setup.appearanceData[5] || null;

                // Rebuild appearanceContext properly
                window.updateAppearanceContext();
            }

            // Build appearanceContext
            if (window.appearanceData) {
                const [body, eyes, hair, clothes, place, extra] = window.appearanceData;

                let contextLines = [];
                if (body) contextLines.push(`You have ${body} skin`);
                if (eyes) contextLines.push(`You have ${eyes} eyes`);
                if (hair) contextLines.push(`You have ${hair} hair`);
                if (clothes) contextLines.push(`You wear ${clothes}`);
                if (place) contextLines.push(`You are in ${place}`);
                if (extra) contextLines.push(`Extra: ${extra}`);

                window.appearanceContext = contextLines.join("\n");
            }

            // Update UI title
            document.getElementById(HTML_TAG.titleInputField).placeholder = `${localStorage.getItem("ai-name")}'s room`;
            // Persist full imported setup to backend
            try {
                BackendAPI.saveToBackend(setup).catch(() => {});
            } catch (err) {}
            console.log(`[☂ LOG ☂ IMPORT ☂] — Setup imported from ${file.name}.`);  // LOGGING: Log
            closeSettings();
        } catch (err) {
            console.error("[⚙ ERROR ⚙] — Failed to import setup:", err);  // LOGGING: Error
        }
    };
    input.click();
}

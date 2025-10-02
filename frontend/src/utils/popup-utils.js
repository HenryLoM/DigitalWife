/**
 * Opens a popup editor for editing the selected object.
 *
 * @param {string} editingObject     - The object being edited ("instructions", "avatar", "recollection").
 * @param {string} lastEditingObject - The last edited object (to hide the popup on repeated click).
 * @param {Object} editingData       - Data { instructions, avatar, recollection }.
 * @param {number} popupLimit        - Character limit for textarea.
 * @returns {string} New lastEditingObject (for external synchronization).
 */
export function openEditor(editingObject, lastEditingObject, editingData, popupLimit) {
    const popup = document.getElementById(HTML_TAG.popupWindow);

    // If popup is open and the same object is being edited — close it
    if (popup && popup.style.display === "block" && lastEditingObject === editingObject) {
        popup.style.display = "none";
        return lastEditingObject;
    }

    lastEditingObject = editingObject;
    const textarea = document.getElementById(HTML_TAG.popupInputField);
    if (textarea) {
        textarea.value = localStorage.getItem(editingObject) || editingData[editingObject] || "";
        popup.style.display = "block";
        setupEditorLimit(popupLimit);
        // Update character counter immediately
        const counter = document.getElementById(HTML_TAG.popupCharCounter);
        const length = textarea.value.length;
        counter.textContent = `${length}/${popupLimit}`;
    }
    return lastEditingObject;
}

/**
 * Closes the popup.
 *
 * @returns {void}
 */
export function closeEditor() {
    const popup = document.getElementById(HTML_TAG.popupWindow);
    if (popup) popup.style.display = "none";
}

/**
 * Saves changes of the selected object and closes the popup.
 *
 * @param {string} lastEditingObject - The object being edited ("avatar", "recollection", "instructions").
 * @returns {string|null} The new value saved, or null if failed.
 */
export function saveEditor(lastEditingObject) {
    const value = document.getElementById(HTML_TAG.popupInputField).value;
    if (["avatar", "recollection", "instructions"].includes(lastEditingObject)) {
        localStorage.setItem(lastEditingObject, value);
        closeEditor();
        console.log(`[☂ LOG ☂ EDITING ☂] — ${lastEditingObject} saved.`);  // LOGGING: Log
        return value;
    } else {
        console.error("[⚙ ERROR ⚙] — Unknown object for editing.");  // LOGGING: Error
        return null;
    }
}


/**
 * Shows a hint for the selected file type.
 *
 * @param {string} type - "instructions" | "avatar" | "recollection"
 * @returns {void}
 */
export function showEditorInfo(type) {
    let message = "";
    switch (type) {
        case "instructions":
            message = "AI Instructions:\n\nDescribe the AI's character and behavior rules. The more detailed, the better AI will roleplay.";
            break;
        case "avatar":
            message = "User Avatar:\n\nDescribe yourself — AI will perceive this as your appearance.";
            break;
        case "recollection":
            message = "Memory/Notes:\n\nSave important notes that AI should remember for a long time.";
            break;
        default:
            message = "Unknown file type.";
    }
    alert(message);
}

/**
 * Sets a character limit for textarea.
 *
 * @param {number} popupLimit - Character limit.
 * @returns {void}
 */
export function setupEditorLimit(popupLimit) {
    const textarea = document.getElementById(HTML_TAG.popupInputField);
    const counter = document.getElementById(HTML_TAG.popupCharCounter);
    if (!textarea || !counter) return;
    textarea.addEventListener("input", () => {
        const length = textarea.value.length;
        counter.textContent = `${length}/${popupLimit}`;
        if (length >= popupLimit) {
            textarea.value = textarea.value.slice(0, popupLimit);
        }
    });
}

import * as BackendAPI from "/frontend/src/api/backend-api.js";

/**
 * Saves the entire chat memory into localStorage & database.
 *
 * @param {Array} memory - The chat memory array to save.
 * @returns {void}
 */
export function saveMemoryToLocalStorage(memory) {
    localStorage.setItem("chatMemory", JSON.stringify(memory));     // Persist to localStorage
    BackendAPI.updateField("chatMemory", memory).catch(() => {});  //  Persist to database
}

/**
 * Loads the chat memory from localStorage.
 *
 * @returns {Array} The loaded memory array, or an empty array if none found.
 */
export function loadMemoryFromLocalStorage() {
    const saved = localStorage.getItem("chatMemory");
    if (!saved) return [];
    return JSON.parse(saved);
}

/**
 * Saves the memory as the txt file.
 *
 * @param {Array}  memory     - Current memory array.
 * @param {string} userName   - Name of the user.
 * @param {string} aiName     - Name of the AI.
 * @param {string} memoryName - File name to save.
 * @returns {void}
 */
export function saveMemoryToFile(memory, userName, aiName, memoryName) {
    let text = "";
    memory.forEach(msg => {
        const prefix = msg.role === "user" ? `[${userName}:]` : `[${aiName}:]`;
        text += `${prefix} ${msg.content}\n`;
    });

    if (window.pywebview) {
        // Running in webview, send file data to backend
        fetch("/save-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fileName: `${memoryName}.txt`,
                content: text
            })
        }).then(() => {
            console.log(`[☂ LOG ☂ EXPORT ☂] — Memory saved as ${memoryName}.txt via backend.`);
        }).catch(err => {
            console.error("[☂ ERROR ☂ EXPORT ☂] — Failed to save memory via backend:", err);
        });
    } else {
        // Running in browser, use Blob and URL.createObjectURL
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${memoryName}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`[☂ LOG ☂ EXPORT ☂] — Memory saved as ${memoryName}.txt.`);
    }
}

/**
 * Loads the memory from a .txt file and reconstructs the chat history.
 *
 * @param {string} userName        - Name of the user.
 * @param {string} aiName          - Name of the AI.
 * @param {Function} appendMessage - Function to render messages back into localStorage.
 * @returns {Promise<[Array, number, string]>} Updated memory, new currentIndex, and memoryName.
 */
export async function loadMemoryFromFile(userName, aiName, appendMessage) {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".txt";

        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return resolve([[], 0, ""]);

            // Read file
            const text = await file.text();
            const lines = text.split("\n").filter(Boolean);

            // Start fresh
            const [newMemory, newIndex] = clearMemory();
            let memory = newMemory;
            let currentIndex = newIndex;

            // Parse lines into memory
            lines.forEach(line => {
                let role, content;
                // User message detection (strict by userName)
                if (line.startsWith(`[${userName}:]`)) {
                    role = "user";
                    content = line.replace(`[${userName}:]`, "").trim();
                } 
                // AI message detection (any other prefix in square brackets)
                else if (/^\[.*?:\]/.test(line)) {
                    role = "assistant";
                    content = line.replace(/^\[.*?:\]/, "").trim();
                } 
                // Skip unknown / malformed lines
                else {
                    return;
                }
                // Push to memory and render
                memory.push({ index: currentIndex, role, content });
                appendMessage(role === "user" ? userName : aiName, content, currentIndex);
                currentIndex++;
            });
            const memoryName = file.name.replace(/\.txt$/i, "");
            document.getElementById(HTML_TAG.titleInputField).value = memoryName;
            saveMemoryToLocalStorage(memory);
            resolve([memory, currentIndex, memoryName]);
            console.log(`[☂ LOG ☂ IMPORT ☂] — Memory ${memoryName}.txt loaded.`);
        };

        input.click();
    });
}

/**
 * Adds required messages into the memory creating and pushing hash table.
 *
 * @param {Array}  memory  - Current memory array.
 * @param {string} role    - The role of the sender.
 * @param {string} content - The message the sender transfers.
 * @param {number} index   - The index of the new message.
 * @returns {Array} Updated memory array and next index.
 */
export function addToMemory(memory, role, content, index) {
    if (!Array.isArray(memory)) memory = [];
    memory.push({
        index: index,
        role: role,
        content: content
    });
    index++
    saveMemoryToLocalStorage(memory);
    return [memory, index];
}

/**
 * Updates the content of a message in memory by its index.
 *
 * @param {Array}  memory  - Current memory array.
 * @param {number} index   - The index of the message to update.
 * @param {string} content - The new content to assign to the message.
 * @returns {Array} Updated memory array.
 */
export function updateMemory(memory, index, content) {
    const msg = memory.find(m => m.index === index);
    if (msg) msg.content = content;
    saveMemoryToLocalStorage(memory);
    return memory;
}

/**
 * Deletes the memory without reloading the page.
 *
 * @returns {Array} An empty memory array and reset index.
 */
export function clearMemory() {
    const chatContent = document.getElementById(HTML_TAG.chattingContent);                // Search the div element with all the messages
    chatContent.innerHTML = "";                                                //  Clear the div element
    document.getElementById(HTML_TAG.titleInputField).value = "";                        //   Reset the memory name
    localStorage.removeItem("chatMemory");                                   //    Remove saved memory from localStorage
    saveMemoryToLocalStorage([]);                                           //     Sync localStorage
    console.log("[☂ LOG ☂ MEMORY ☂] — Memory cleared.");                   //      LOGGING: Log
    // Return previous scroll height
    const chatWindow = document.getElementById(HTML_TAG.chattingWindow);
    chatWindow.scrollTop = 0;
    return [[], 0];
}

/**
 * Trims the memory array so it will not get too heavy for the AI.
 *
 * @param {Array}  memory    - Current memory array.
 * @param {number} trimLimit - Maximum amount of messages allowed.
 * @returns {Array} Trimmed memory array.
 */
export function trimMemory(memory, trimLimit) {
    if (memory.length > trimLimit) {
        memory = memory.slice(-10);
        saveMemoryToLocalStorage(memory);
        console.log("[☂ LOG ☂ MEMORY ☂] — Memory trimmed.");  // LOGGING: Log
    }
    return memory;
}

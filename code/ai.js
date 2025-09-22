// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Variables

// Custom
let model            = localStorage.getItem("ollama_model") || "NicoleShelterV1";  // Using LLM
let port             = localStorage.getItem("ollama_port")  || "11434";           //  Port for streaming AI messaging
let aiName           = localStorage.getItem("aiName")       || "Nicole";         //   Name of the AI character
let instructionsPath = "code/files/instructions.txt";                           //    Path to instructions.txt from the chatting HTML page
let avatarPath       = "code/files/avatar.txt";                                //     Path to avatar.txt from the chatting HTML page
let recollectionPath = "code/files/recollection.txt";                         //      Path to recollection.txt from the chatting HTML page
let userName         = "You"                                                 //       Name of user
let errorMessage     = "(Spouse can't be heard...)"                         //        Eroor messsage to save in memory and display to user
let trimLimit        = 20;                                                 //         Maximum amount of messages in the AI memory
let popupLimit       = 700;                                               //          Maximum amount of characters in the popup textarea

// Constant
let ollamaAbortController = null;                                           // Abortion control via the variable
let instructions          = localStorage.getItem("instructions") || "";    //  instructions.txt contents in the variable
let avatar                = localStorage.getItem("avatar")       || "";   //   avatar.txt contents in the variable
let recollection          = localStorage.getItem("recollection") || "";  //    recollection.txt contents in the variable
let memory                = [];                                         //     AI memory in an array
let memoryName            = "";                                        //      Title that uses when memory gets saved
let lastEditingObject     = "";                                       //       Which file was changing at last
let currentIndex          = 0;                                       //        Index we use to refer to the message we need

// HTML id tagging
const titleInputField    = "title-input";         // Name of the chat
const chattingWindow     = "chat-window";        //  Block with the other div "chat-content" and mini-frame
const chattingContent    = "chat-content";      //   All messages
const chattingInputField = "user-input";       //    Textarea where user texts the prompt
const popupWindow        = "editor-popup";    //     Popup window with the input field, two buttons, and character counter
const popupInputField    = "editing-text";   //      Popup's input field
const popupCharCounter   = "char-counter";  //       Popup's character counter

// CSS id tagging
const messageFramePreset = "message-frame-preset";
const tooltipPreset      = "tooltip-preset";
const frameButtonRow     = "frame-button-row-preset";
const editButtonRow      = "edit-button-row-preset";

// Global (window)
window.appearanceContext = localStorage.getItem("appearanceContext") || "You have White skin\nYou have Purple eyes\nYou have Brown Lob hair\nYou wear Green hoodie\nYou are in Digital program window";
window.timeContext       = `Current time in the real world is ${new Date().toLocaleTimeString()}`
window.themeContext      = "Currently it is light in the website, you have a day time in the locations"

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Chat working

/**
 * Is the main function to chat with the AI.
 * 
 * @param {Array}    messages - Array of message objects (role + content).
 * @param {Function} callback - Function to handle streaming response chunks.
 * @returns {void}
 */
async function chatWithOllama(messages, callback) {
    // Abort previous if running
    if (ollamaAbortController) {
        ollamaAbortController.abort();
        await fetch(`http://localhost:${port}/api/shutdown`, { method: 'POST' });  // Force stop AI message generating
        console.warn("[⚠︎ WARNING ⚠︎] — Previous request was aborted");
    }
    ollamaAbortController = new AbortController();  // Create new controller for this request

    let response;
    // Try to connect to the local Ollama serviices
    try {
        response = await fetch(`http://localhost:${port}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({model: model, stream: true, messages: messages,}),
            signal: ollamaAbortController.signal
        });
    } catch (err) {
        if (err.name === 'AbortError') return;                               // Quit generating new response if the error is abort
        ollamaAbortController = null;                                       //  Prevent abortion control from bugging error displaying
        callback(`${errorMessage}`);                                       //   Show to user prepared error message for displaying
        console.error("[⚙ ALARMING ERROR ⚙] — Connection failed:", err);  //    LOGGING: Error
        return;
    }
    // Some settings
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    // Collect message in one streaming variable
    let buffer = "";
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;  // Finish "while" cycle
        // Streaming settings
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop();
        // Streaming itself
        for (let line of parts) {
            if (!line.trim()) continue;
            try {
                const json = JSON.parse(line);
                if (json.done) break;  // Finish "for" cycle
                const content = json.message.content;
                if (content) callback(content);
            } catch (err) {
                console.error("[⚙ ALARMING ERROR ⚙] — JSON parse error:", err);  // LOGGING: Error
            }
        }
    }
    ollamaAbortController = null;
}

/** 
 * Sends the user message to AI and returns AI response.
 * 
 * @param {string}   userInput              - The raw text string entered by the user.
 * @param {boolean} [allowPartialSave=true] - Allows the saving cut AI response for work if true.
 * @returns {void}
 */
async function handleAiResponse(userInput, allowPartialSave = true) {
    let aiMessage = "";  // Collect AI response streaming here
    //  Create log message with the time at the moment
    let logMessage = [
        window.timeContext,         // Time
        window.appearanceContext,  //  Appearance
        window.themeContext       //   Theme
    ];
    // Create chat history block for AI input
    const chatHistory = memory.map(({ role, content }) => { return `${role}: ${content}`; }).join("\n");
    // Full payload to send to Ollama
    const fullMessagePayload = [
        { role: "system", content: `::YOUR NAME IS::\n${aiName}\n\n`         +
                                   `::INFO ABOUT YOU::\n${instructions}\n\n` +
                                   `::INFO ABOUT USER::\n${avatar}\n\n`      +
                                   `::YOUR MEMORY::\n${recollection}\n\n`    +         
                                   `::CONTEXT OF THE MOMENT::\n${logMessage}`  },
        { role: "system", content: `::PREVIOUS MESSAGES::\n${chatHistory}`     },
        { role: "user",   content: userInput                                   }
    ];
    // Add user data into HTML div element and memory, synching the indexes
    appendMessage(userName, userInput, currentIndex);
    addToMemory("user", userInput);
    // Do preparations for dynamic updation both HTML div element and memory AI messages, to synch indexes
    const aiIndex = currentIndex;  // To prevent index mixing during abortion
    const aiElem = appendMessage(aiName, "", aiIndex);
    addToMemory("assistant", "");
    // Case without abortion
    try {
        // Stream and recieve AI response
        await chatWithOllama(fullMessagePayload, (chunk) => {
            aiMessage += chunk;
            aiElem.innerHTML = `<b>[${aiName}:]</b> ${aiMessage.replace(/\n/g, '<br>')}`;
            // Scroll down automatically
            const chatContent = document.getElementById(chattingContent);
            chatContent.scrollTop = chatContent.scrollHeight;
        });
    // Update already existed prepared AI message in memory
    updateMemory(aiIndex, aiMessage);
    // Case with abortion
    } catch (err) {
        if (err.name === 'AbortError' && allowPartialSave) updateMemory(aiIndex, aiMessage);
    }
    // Do some settings
    trimMemory();
    console.log("[☂ LOG ☂ MEMORY ☂] — Memory updated.");  // LOGGING: Log
}

/**
 * Deletes one given message by its index.
 * 
 * @param {number} indexToDelete - The index of the message to delete.
 * @returns {void}
 */
function deleteMessageByIndex(indexToDelete) {
    memory = memory.filter(msg => msg.index !== indexToDelete);                              // Remove the message with the exact index from memory
    const chatContent = document.getElementById(chattingContent);
    const messages = [...chatContent.getElementsByClassName("message-frame-preset")];      //   Remove DOM element with matching dataset index
    messages.find(elem => parseInt(elem.dataset.index) === indexToDelete)?.remove();      //    Remove message from HTML page
    saveMemoryToLocalStorage();
    console.log(`[☂ LOG ☂ DELETION ☂] — Message with index ${indexToDelete} deleted.`); //      LOGGING: Log
}

/**
 * Deletes all messages from memory and DOM up to and including the specified index.
 * 
 * @param {number} targetIndex - The highest index to delete (inclusive).
 * @returns {void}
 */
function rewindMessages(targetIndex) {
    // Filter memory to keep only messages with index greater than targetIndex
    memory = memory.filter(msg => msg.index < targetIndex);
    // Remove corresponding DOM elements
    const chatContent = document.getElementById(chattingContent);
    const messages = [...chatContent.getElementsByClassName("message-frame-preset")];
    // Remove messages from HTML page
    messages.forEach(elem => {
        const msgIndex = parseInt(elem.dataset.index);
        if (msgIndex >= targetIndex) {
            chatContent.removeChild(elem);
        }
    });
    saveMemoryToLocalStorage();
    console.log(`[☂ LOG ☂ REFRESH ☂] — All messages up to index ${targetIndex} (including) deleted.`);  // LOGGING: Log
}

/**
 * Refreshes the AI response for a given user message index.
 * 
 * Stops any ongoing AI response streaming, deletes previous user+assistant messages, and resends the original user input to regenerate AI response.
 * 
 * @param {number} index - The index of the user message to refresh.
 * @returns {void}
 */
function refreshFromIndex(index) {
    const targetUserIndex = index - 1;  // Focus on user message that follows AI response, which has the refresh button
    // First attempt: search in memory
    let userMessage = memory.find(msg => msg.index === targetUserIndex && msg.role === "user");
    // If not found, fallback to HTML
    if (!userMessage) {
        const chatContent = document.getElementById(chattingContent);
        const messageElems = [...chatContent.getElementsByClassName("message-frame-preset")];
        // Find user message elements before current AI index
        const possibleUserElems = messageElems.filter(el => {
            const elIndex = parseInt(el.dataset.index);
            return elIndex < index && el.querySelector(".message-text").innerText.startsWith(`[${userName}:]`);
        });
        if (possibleUserElems.length > 0) {
            const closestUserElem = possibleUserElems[possibleUserElems.length - 1];
            const recoveredIndex = parseInt(closestUserElem.dataset.index);
            // Try to find message content from memory or extract from HTML directly
            const recoveredMemoryMsg = memory.find(msg => msg.index === recoveredIndex && msg.role === "user");
            if (recoveredMemoryMsg) {
                userMessage = recoveredMemoryMsg;
            } else {
                // Extract content from HTML as backup
                const textWrapper = closestUserElem.querySelector(".message-text");
                const rawText = textWrapper.innerText.replace(new RegExp(`^\\[${userName}:\\]\\s*`), "");
                userMessage = { index: recoveredIndex, role: "user", content: rawText };
            }
            console.warn(`[⚠︎ WARNING ⚠︎] — Memory recovery used for refresh: index ${recoveredIndex}`);
        }
    }
    // If still nothing — stop refresh
    if (!userMessage) {
        console.error(`[⚙ ERROR ⚙] — No user message found to refresh near index ${index}.`);
        return;
    }
    // Delete old messages and re-send user message
    rewindMessages(targetUserIndex)
    handleAiResponse(userMessage.content, false);                                    // Recreate new AI message and forget ongoing one
    console.log(`[☂ LOG ☂ REFRESH ☂] — Message with index ${userMessage.index} refreshed.`);  //  LOGGING: Log
}

/**
 * Copies the message by its index and role from the memory array to the clipboard, and displays the tooltip.
 * 
 * @param {number} index - The index of the message to copy.
 * @returns {void}
 */
function copyText(index) {
    const msg = memory.find(m => m.index === index);
    if (!msg) {
        console.error("[⚙ ERROR ⚙] — Message not found for copying.");  // LOGGING: Error
        return;
    }
    navigator.clipboard.writeText(msg.content);
    summonTooltip("Copied!", 2000)
    console.log("Message copied.");  // LOGGING: Log
}

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Memory working

/**
 * Saves the entire chat memory into localStorage.
 *
 * @returns {void}
 */
function saveMemoryToLocalStorage() {
    localStorage.setItem("chatMemory", JSON.stringify(memory));
}

/**
 * Loads the chat memory from localStorage and rebuilds the chat DOM.
 *
 * @returns {void}
 */
function loadMemoryFromLocalStorage() {
    const saved = localStorage.getItem("chatMemory");
    if (!saved) return;
    memory = JSON.parse(saved);
    currentIndex = memory.length > 0 ? memory[memory.length - 1].index + 1 : 0;
    // Rebuild chat DOM
    memory.forEach(msg => {
        appendMessage(msg.role === "user" ? userName : aiName, msg.content, msg.index);
    });
}

/**
 * Adds required messages into the memory creating and pushing hash table.
 * 
 * @param {string} role    - The role of the sender.
 * @param {string} content - The message the sender transfers.
 * @returns {void}
 */
function addToMemory(role, content) {
    memory.push({
        index: currentIndex,
        role: role,
        content: content
    });
    currentIndex++;
    saveMemoryToLocalStorage();
}

/**
 * Updates the content of a message in memory by its index.
 *
 * @param {number} index - The index of the message to update.
 * @param {string} content - The new content to assign to the message.
 * @returns {void}
 */
function updateMemory(index, content) {
    const msg = memory.find(m => m.index === index);
    if (msg) msg.content = content;
    saveMemoryToLocalStorage();
}

/**
 * Deletes the memory without reloading the page.
 * 
 * @returns {void}
 */
function clearMemory() {
    memory = [];
    const chatContent = document.getElementById(chattingContent);               // Search the div element with all the messages
    chatContent.innerHTML = "";                                                //  Clear the div element
    currentIndex = 0;                                                         //   Reset index system
    document.getElementById(titleInputField).value = "";                     //    Reset the memory name
    localStorage.removeItem("chatMemory");                                  //     Remove saved memory from localStorage
    saveMemoryToLocalStorage();                                            //      Sync localStorage
    console.log("[☂ LOG ☂ MEMORY ☂] — Memory cleared.");                  //       LOGGING: Log
    // Return previous scroll height
    const chatWindow = document.getElementById(chattingWindow);
    chatWindow.scrollTop = 0;
}

/**
 * Trims the memory array so it will not get too heavy for the AI.
 * 
 * @returns {void}
 */
function trimMemory() {
    if (memory.length > trimLimit) {
        memory = memory.slice(-10);
        console.log("[☂ LOG ☂ MEMORY ☂] — Memory trimmed.");  // LOGGING: Log
    }
}

/**
 * Saves the memory as the txt file.
 * 
 * @returns {void}
 */
function saveMemoryToFile() {
    let text = "";
    memory.forEach(msg => {
        const prefix = msg.role === "user" ? `[${userName}:]` : `[${aiName}:]`;
        text += `${prefix} ${msg.content}\n`;
    });
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${memoryName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`[☂ LOG ☂ EXPORT ☂] — Memory saved as ${memoryName}.txt.`);  // LOGGING: Log
}

/**
 * Loads the memory from the txt file and reconstructs the chat history.
 * 
 * @returns {void}
 */
function loadMemoryFromFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt";
    // Load file
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        // Create and fill up variables
        const text = await file.text();
        const lines = text.split("\n").filter(Boolean);
        clearMemory();  // Clear memory
        // Import chat history, basing on file's contents
        lines.forEach((line, idx) => {
            let role, content;
            // Search messages of user and AI
            if (line.startsWith(`[${userName}:]`)) {
                role = "user";
                content = line.replace(`[${userName}:]`, "").trim();
            } else if (line.startsWith(`[${aiName}:]`)) {
                role = "ai";  // Use exactly "ai" to match your memory role
                content = line.replace(`[${aiName}:]`, "").trim();
            } else {
                return;  // Skip/handle unknown lines
            }
            // Add messages like normal blocks of messages
            memory.push({ index: currentIndex, role, content });
            appendMessage(role === "user" ? userName : aiName, content, currentIndex);
            currentIndex++;
        });
        // Edit chat name
        memoryName = file.name.replace(/\.txt$/i, "");
        document.getElementById(titleInputField).value = memoryName;
        console.log(`[☂ LOG ☂ IMPORT ☂] — Memory ${memoryName}.txt loaded.`);  // LOGGING: Log
    };

    input.click();  //  Focus pointer
}

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Button working

/** Wrapper for handleAiResponse. */
async function sendMessageButton() {
    const userInput = document.getElementById(chattingInputField);
    const userMessage = userInput.value.trim();
    if (!userMessage) return;
    userInput.value = "";  // Clear the field
    handleAiResponse(userMessage);
}

/** Wrapper for shut-down system. */
async function forceShut() {
    if (ollamaAbortController) ollamaAbortController.abort();
    try {
        await fetch('http://localhost:11434/api/shutdown', { method: 'POST' });
    } catch (e) {
        // Silent fail if shutdown not available
    }
    ollamaAbortController = new AbortController();
    console.warn("[⚠︎ WARNING ⚠︎] — ChatBot forced shut up");
}

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Popup working

/**
 * Opens rewrites the choosen file.
 * 
 * @param {string} editingObject - Object that gets rewrited.
 * @returns {void}
 */
function openEditor(editingObject) {
    const popup = document.getElementById(popupWindow);  // Popup window element
    // Hide pupup if it is already visible
    if (popup && popup.style.display === "block" && lastEditingObject === editingObject) {
        popup.style.display = "none";
        return;
    }
    // Show it normally otherwise
    const editingData = {instructions, avatar, recollection};               // For editing functions
    lastEditingObject = editingObject;                                     //  Sync the current editing object and last one
    const textarea = document.getElementById(popupInputField);            //   Get textarea element
    if (textarea) {
        textarea.value = editingData[editingObject];                    //     Fill up the popup textarea if exists
        document.getElementById(popupWindow).style.display = 'block';  //      Displays the invisible popup 
        setupEditorLimit();                                           //       Activate character limit tracking
        // Immediately update character count when the popup opens
        const counter = document.getElementById(popupCharCounter);
        const length = textarea.value.length;
        counter.textContent = `${length}/${popupLimit}`;
    } else {
        // If textarea is missing, restore popup HTML and retry
        if (popup && popup.dataset.originalHtml) {
            popup.innerHTML = popup.dataset.originalHtml;
            setTimeout(() => openEditor(editingObject), 0);
        }
    }
}

/**
 * Closes the popup.
 * 
 * @returns {void}
 */
function closeEditor() {
    document.getElementById(popupWindow).style.display = 'none';
}

/**
 * Saves the changes in the chosen file and closes the popup.
 * 
 * @returns {void}
 */
function saveEditor() {
    if (lastEditingObject === "avatar") {
        avatar = document.getElementById(popupInputField).value;
        localStorage.setItem("avatar", avatar);
    } else if (lastEditingObject === "recollection") {
        recollection = document.getElementById(popupInputField).value;
        localStorage.setItem("recollection", recollection);
    } else if (lastEditingObject === "instructions") {
        instructions = document.getElementById(popupInputField).value;
        localStorage.setItem("instructions", instructions);
    } else {
        console.error("[⚙ ERROR ⚙] — Unknown editing object.");  // LOGGING: Error
        return;
    }
    closeEditor();
    console.log(`[☂ LOG ☂ EDITING ☂] — The ${lastEditingObject} edited.`)  // LOGGING: Log
}

/**
 * Shows contextual help text inside the editor popup.
 * 
 * @param {string} type - Which file is being edited ("instructions", "avatar", or "recollection").
 * @returns {void}
 */
function showEditorInfo(type) {
    let message = "";
    switch (type) {
        case "instructions":
            message = "AI instructions:\n\nWrite rules and behavior guidelines for the AI - its character and role.\nHighly recommend to describe how AI must respond for a better RP perfomance.";
            break;
        case "avatar":
            message = "User's avatar:\n\nDescribe yourself, AI will treat everything you describe as your image.";
            break;
        case "recollection":
            message = "Recollection/Memo:\n\nWrite notes or important memories to keep context long-term.\nEverything you describe here will be remembered by the AI.";
            break;
        default:
            message = "Popup is not openned, you are not supposed to see this message";
    }
    alert(message);
}

/**
 * Limits the available amount of characters when editing the chosen file
 * 
 * @returns {void}
 */
function setupEditorLimit() {
    const textarea = document.getElementById(popupInputField);
    const counter = document.getElementById(popupCharCounter);
    // Get values and make decision if locking is needed
    textarea.addEventListener('input', () => {
        const length = textarea.value.length;
        counter.textContent = `${length}/${popupLimit}`;
        if (length >= popupLimit) textarea.value = textarea.value.slice(0, popupLimit); // Lock adding new characters but allow deleting
    });
}

/**
 * Opens and rewrites the important DOM variables.
 * 
 * @returns {void}
 */
function TechEditor() {
    let popup = document.getElementById("tech-editor-popup");

    // Hide pupup if it is already visible
    if (popup && popup.style.display === "block") {
        popup.style.display = "none";
        return;
    }

    // If popup doesn't exist, create it
    if (!popup) {
        popup = document.createElement("div");
        popup.id = "tech-editor-popup";
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
        <label for="tech-aiName-input">ChatBot's name:</label><br>
        <input id="tech-aiName-input" type="text" value="${aiName}" style="width:100%;margin-bottom:12px;" placeholder="name that will be used everywhere"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><br>
        <label for="tech-model-input">Ollama model name:</label><br>
        <input id="tech-model-input" type="text" value="${model}" style="width:100%;margin-bottom:12px;" placeholder="check via 'ollama list'"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><br>
        <label for="tech-port-input">Ollama port (don't recommend to edit):</label><br>
        <input id="tech-port-input" type="text" value="${port}" style="width:100%;margin-bottom:12px;" placeholder="default is 11434"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><br>
        <button id="tech-save-btn">Save</button>
        <button id="tech-cancel-btn">Cancel</button>
        <button id="tech-export-btn">Export setup</button>
        <button id="tech-import-btn">Import setup</button>
    `;

    // Show popup
    popup.style.display = "block";

    // Save logic
    document.getElementById("tech-save-btn").onclick = function() {
        const newName = document.getElementById("tech-aiName-input").value;
        const newModel = document.getElementById("tech-model-input").value;
        const newPort = document.getElementById("tech-port-input").value;
        localStorage.setItem("aiName", newName);
        localStorage.setItem("ollama_model", newModel);
        localStorage.setItem("ollama_port", newPort);
        aiName = newName;
        model = newModel;
        port = newPort;
        closeTechEditor();
        document.getElementById("title-input").placeholder = `${aiName}'s room`;  // Dynamically update placeholder's text
        console.log("[☂ LOG ☂ EDITING ☂] — The technical settings updated.");    // LOGGING: Log
    };

    // Cancel logic
    document.getElementById("tech-cancel-btn").onclick = function() {
        closeTechEditor();
    };
    // Export setup logic
    document.getElementById("tech-export-btn").onclick = exportPresetFile;
    // Import setup logic
    document.getElementById("tech-import-btn").onclick = importPresetFile;
}

/**
 * Closes TechEditor popup.
 * 
 * @returns {void}
 */
function closeTechEditor() {
    const popup = document.getElementById("tech-editor-popup");
    if (popup) {
        popup.style.display = "none";
    }
}

/**
 * Exports the current setup as a JSON file.
 * 
 * @returns {void}
 */
function exportPresetFile() {
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

    // Collect overlays (images + divs) from the DOM
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
        aiName:         localStorage.getItem("aiName")       || aiName,
        model:          localStorage.getItem("ollama_model") || model,
        port:           localStorage.getItem("ollama_port")  || port,
        instructions:   localStorage.getItem("instructions") || instructions,
        avatar:         localStorage.getItem("avatar")       || avatar,
        recollection:   localStorage.getItem("recollection") || recollection,
        appearanceData: window.appearanceData                || [],
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

    console.log(`[☂ LOG ☂ EXPORT ☂] — Setup exported as ${a.download}.`);
}

/**
 * Imports the setup from a JSON file.
 * 
 * @returns {void}
 */
export function importPresetFile() {
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
            if (setup.aiName) {
                localStorage.setItem("aiName", setup.aiName);
                aiName = setup.aiName;
            }
            if (setup.model) {
                localStorage.setItem("ollama_model", setup.model);
                model = setup.model;
            }
            if (setup.port) {
                localStorage.setItem("ollama_port", setup.port);
                port = setup.port;
            }
            if (setup.instructions) {
                localStorage.setItem("instructions", setup.instructions);
                instructions = setup.instructions;
            }
            if (setup.avatar) {
                localStorage.setItem("avatar", setup.avatar);
                avatar = setup.avatar;
            }
            if (setup.recollection) {
                localStorage.setItem("recollection", setup.recollection);
                recollection = setup.recollection;
            }

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
            document.getElementById("title-input").placeholder = `${aiName}'s room`;
            console.log(`[☂ LOG ☂ IMPORT ☂] — Setup imported from ${file.name}.`);
            closeTechEditor();
        } catch (err) {
            console.error("[⚙ ERROR ⚙] — Failed to import setup:", err);
        }
    };
    input.click();
}

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Editing message working

/**
 * Allows to edit the existed button and immediately get a new message from the AI.
 * 
 * @returns {void}
 */
function editMessage(index, sender) {
    const chatContent = document.getElementById(chattingContent);
    const targetElem = [...chatContent.getElementsByClassName("message-frame-preset")]
        .find(el => parseInt(el.dataset.index) === index);
    // In case if something happenes with indexing system
    if (!targetElem) {
        console.error("[⚙ ERROR ⚙] — User message not found for editing.");  // LOGGING: Error
        return;
    }
    // Set up variables
    const userTextWrapper = targetElem.querySelector(".message-text");
    const originalText = userTextWrapper.innerText.replace(new RegExp(`^\\[${sender}:\\]\\s*`), "");
    // Creating textarea inside the message
    const input = document.createElement("textarea");
    input.value = originalText;
    input.oninput = () => {
        input.style.height = "";
        input.style.height = (input.scrollHeight + 2) + "px";
    };
    // ☑ Apply button
    const applyBtn = document.createElement("button");
    applyBtn.innerText = "☑";
    applyBtn.onclick = () => applyEditingMessage(index, input.value.trim(), sender);
    // ☒ Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.innerText = "☒";
    cancelBtn.onclick = () => cancelEditingMessage(userTextWrapper, originalText, sender);
    // Bind Enter/Return to the apply button
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) applyBtn.click();
    });
    // Add buttons to the frame
    const btnRow = document.createElement("div");
    btnRow.className = editButtonRow;
    btnRow.appendChild(input);
    btnRow.appendChild(applyBtn);
    btnRow.appendChild(cancelBtn);
    // Focus cursor
    userTextWrapper.innerHTML = "";
    userTextWrapper.appendChild(btnRow);
    input.focus();
}

/**
 * Applies the new input value as the edited message.
 * 
 * @param {HTMLInputElement} input   - The input element containing the user's edited message.
 * @param {string}           newText - The text that is going to replace the previous version of the message.
 * @returns {void}
 */
function applyEditingMessage(index, newText, sender) {
    if (!newText) return;
    const chatContent = document.getElementById(chattingContent);
    // Find and update the message in memory
    const msg = memory.find(m => m.index === index);
    if (!msg) {
        console.error("[⚙ ERROR ⚙] — User message not found in memory.");  // LOGGING: Error
        return;
    }
    msg.content = newText;
    // Update the DOM text
    const targetElem = [...chatContent.getElementsByClassName("message-frame-preset")]
        .find(el => parseInt(el.dataset.index) === index);
    const messageText = targetElem?.querySelector(".message-text");
    if (messageText) {
        messageText.innerHTML = `<b>[${sender}:]</b> ${newText.replace(/\n/g, "<br>")}`;
    }
    // Update the message without harming anything else
    updateMemory(index, newText);
    saveMemoryToLocalStorage();
}

/**
 * Cancels the editing mode and restores the original message.
 * 
 * @param {HTMLElement} userMessageElem - The DOM element of the user's message being edited.
 * @param {string}      originalText    - The original unedited message to restore.
 * @returns {void}
 */
function cancelEditingMessage(wrapperElem, originalText, sender) {
    wrapperElem.innerHTML = `<b>[${sender}:]</b> ${originalText.replace(/\n/g, "<br>")}`;
}

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Misc working

/**
 * Appends a new message bubble to the chat window.
 * 
 * @param {string} sender - The name of the message sender
 * @param {string} text   - The message content to be displayed.
 * @returns {HTMLElement} The inner wrapper element for text, used for updating content live.
 */
function appendMessage(sender, text, index) {
    const chatContent = document.getElementById(chattingContent);
    // Frame for the message (container div)
    const messageElem = document.createElement("div");
    messageElem.className = messageFramePreset;
    messageElem.dataset.index = index;  // Store index in the frame DOM
    // Wrapper for the message text itself
    const wrapper = document.createElement("div");
    wrapper.className = "message-text";
    // Use aiName for AI responses
    const displayName = sender === aiName || sender === aiName ? aiName : sender;
    wrapper.innerHTML = `<b>[${displayName}:]</b> ${text.replace(/\n/g, '<br>')}`;
    messageElem.appendChild(wrapper);
    // Add wrapper with buttons itself
    const btnWrapper = addFrameButtons(sender, index);
    messageElem.appendChild(btnWrapper);
    // Add the full frame to the chat window
    chatContent.appendChild(messageElem);
    chatContent.scrollTop = chatContent.scrollHeight;  // Comment: Auto-scroll to latest
    return wrapper;                                   //  Return only the message text wrapper (so it can be streamed into)
}

/**
 * Creates a row of control buttons (refresh, delete, edit, copy) and returns it as a DOM element to be appended to a message frame.
 * 
 * @param {string} sender - The role of the message sender. Should match aiName for AI messages.
 * @returns {HTMLElement} btnWrapper - A <div> element containing the appropriate buttons for the message.
 */
function addFrameButtons(sender, index) {
    // ⧉ Copy button
    const copyBtn = document.createElement("button");
    copyBtn.innerText = "⧉";
    copyBtn.onclick = () => copyText(index);
    // ✎ Edit button
    const editBtn = document.createElement("button");
    editBtn.innerText = "✎";
    editBtn.onclick = () => editMessage(index, sender);
    // ♻ Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "♻";
    deleteBtn.onclick = () => deleteMessageByIndex(index);
    // ↻ Refresh button
    const refreshBtn = document.createElement("button");
    refreshBtn.innerText = "↻";
    refreshBtn.onclick = () => refreshFromIndex(index);
    // Create buttons below the message
    const btnWrapper = document.createElement("div");
    btnWrapper.className = frameButtonRow;  // Custom CSS class for styling the button row
        // Add AI-specific buttons to AI frame
    if (sender === aiName) {
        btnWrapper.appendChild(refreshBtn);
        btnWrapper.appendChild(deleteBtn);
        btnWrapper.appendChild(editBtn);
        btnWrapper.appendChild(copyBtn);
    }
        // Add user-specific buttons to user frame
    else {
        btnWrapper.appendChild(deleteBtn);
        btnWrapper.appendChild(editBtn);
        btnWrapper.appendChild(copyBtn);
    }
    // Return the result
    return btnWrapper;
}

/**
 * Creates a little bubble with the givrn text.
 * 
 * @param {string}  text                  - The text that shows up.
 * @param {string}  time                  - Quantity of miliseconds tooltip remains exciting.
 * @param {boolean} [isAbove=true]        - If true, tooltip shows above the button; if false, shows below.
 * @param {boolean} [isLeftAlligned=true] - If true, tooltip alligns to the left; if false, alligns to right.
 * @returns {void}
 */
function summonTooltip(text, time, isAbove = true, isLeftAlligned = true) {
    // Create tooltip itself
    const tooltip = document.createElement("div");
    document.body.appendChild(tooltip);
    tooltip.className = tooltipPreset;
    tooltip.innerText = text;
    const button = event.target;
    const buttonRect = button.getBoundingClientRect();
    tooltip.style.position = "absolute";
    // Y position
    if (isAbove) tooltip.style.top = `${buttonRect.top - 25}px`;
    else tooltip.style.top = `${buttonRect.bottom + 5}px`;
    // X position
    if (isLeftAlligned) tooltip.style.left = `${buttonRect.left}px`;
    else tooltip.style.left = `${buttonRect.left - tooltip.offsetWidth}px`
    // Settings
    document.body.appendChild(tooltip);
    setTimeout(() => tooltip.remove(), time);
}

/**
 * Restores all appearance layers from localStorage.
 *
 * @returns {void}
 */
function restoreAppearanceLayers() {
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
function saveAppearanceLayers() {
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

/**
 * Inizializes the AI in the very beginning
 *
 * @returns {void}
 */
async function initializeContext() {
    // Load from localStorage if available, else from file
    loadMemoryFromLocalStorage();
    const loadFile = async (path, key) => {
        let value = localStorage.getItem(key);
        if (value !== null) return value;
        const response = await fetch(path);
        return await response.text();
    };
    instructions = await loadFile(instructionsPath, "instructions");
    avatar       = await loadFile(avatarPath, "avatar");
    recollection = await loadFile(recollectionPath, "recollection");
    memoryName   = document.getElementById(titleInputField).placeholder.trim()
    const input  = document.getElementById(chattingInputField);
    input.focus();
    document.getElementById("title-input").placeholder = `${aiName}'s room`;      // Update placeholder's text in advance
    window.updateAppearanceContext();                                            //  Update appearanceContext based on pre-loaded layers
    console.log("[☂ LOG ☂ INITIALIZATION ☂] — Chat initialized successfully.")  //   LOGGING: Log
}

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== The beginning

// Bind Enter/Return button key to the send button
document.getElementById(chattingInputField).addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessageButton();
    }
});
// Let use button functions as soon as DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    restoreAppearanceLayers();
    // Naming the chat
    document.getElementById(titleInputField).addEventListener('input', () => {
        const input = document.getElementById(titleInputField);
        memoryName = input.value.trim() || input.placeholder.trim();
    });
    // Message group
    document.getElementById("send-btn").addEventListener(               "click", sendMessageButton                         );
    document.getElementById("force-shut-btn").addEventListener(         "click", forceShut                                 );
    // Memory group
    document.getElementById("save-memory-btn").addEventListener(        "click", saveMemoryToFile                          );
    document.getElementById("load-memory-btn").addEventListener(        "click", loadMemoryFromFile                        );
    document.getElementById("delete-memory-btn").addEventListener(      "click", clearMemory                               );
    // File group
    document.getElementById("editor-save-btn").addEventListener(        "click", saveEditor                                );
    document.getElementById("editor-close-btn").addEventListener(       "click", closeEditor                               );
    document.getElementById("editor-info-btn").addEventListener(        "click", () => {showEditorInfo(lastEditingObject);});
    document.getElementById("instructions-editor-btn").addEventListener("click", () => {openEditor("instructions");}       );
    document.getElementById("avatar-editor-btn").addEventListener(      "click", () => {openEditor("avatar");}             );
    document.getElementById("memo-editor-btn").addEventListener(        "click", () => {openEditor("recollection");}       );
    // Full AI customization one-button-group
    document.getElementById("tech-details-btn").addEventListener(       "click", () => {TechEditor();}                     );
    // Setup auto-save for appearance layers when changed
    const layerIds = [
        "wife-hair-back",
        "bodies-overlay",
        "clothes-overlay",
        "wife-hair-front",
        "blush-overlay",
        "additional-overlay",
        "background"
    ];
    layerIds.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            const observer = new MutationObserver(() => saveAppearanceLayers());
            observer.observe(elem, { attributes: true, attributeFilter: ["src", "style"] });
        }
    });
    // Initialize context when the page loads
    initializeContext();
});

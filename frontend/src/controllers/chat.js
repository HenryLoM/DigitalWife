// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Imports

// API
import * as BackendAPI      from "/frontend/src/api/backend-api.js";
// Utils
import * as memoryUtils     from "/frontend/src/utils/memory-utils.js";
import * as popupUtils      from "/frontend/src/utils/popup-utils.js";
import * as settingsUtils   from "/frontend/src/utils/settings-utils.js";
import * as frameUtlis      from "/frontend/src/utils/frame-utils.js";
import * as appearanceUtils from "/frontend/src/utils/appearance-utils.js";

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Variables

// Custom
let model            = localStorage.getItem("ollama-model")   || "NicoleShelterV1";  // Using LLM
let port             = localStorage.getItem("ollama-port")    || "11434";           //  Port for streaming AI messaging
let aiName           = localStorage.getItem("ai-name")        || "Nicole";         //   Name of the AI character
let arduinoDevice    = localStorage.getItem("arduino-device") || "disabled";      //    Arduino device path
let baudRate         = localStorage.getItem("arduino-baud")   || 9600;           //     Baud rate for Arduino communication
let instructionsPath = "/frontend/src/files/instructions.txt";                  //      Path to instructions.txt from the chatting HTML page
let avatarPath       = "/frontend/src/files/avatar.txt";                       //       Path to avatar.txt from the chatting HTML page
let recollectionPath = "/frontend/src/files/recollection.txt";                //        Path to recollection.txt from the chatting HTML page
let userName         = "You"                                                 //         Name of user
let errorMessage     = "(Spouse can't be heard...)"                         //          Eroor messsage to save in memory and display to user
let trimLimit        = 20;                                                 //           Maximum amount of messages in the AI memory
let popupLimit       = 700;                                               //            Maximum amount of characters in the popup textarea

// Constant
let ollamaAbortController = null;                                           // Abortion control via the variable
let instructions          = localStorage.getItem("instructions") || "";    //  instructions.txt contents in the variable
let avatar                = localStorage.getItem("avatar")       || "";   //   avatar.txt contents in the variable
let recollection          = localStorage.getItem("recollection") || "";  //    recollection.txt contents in the variable
let memory                = [];                                         //     AI memory in an array
let memoryName            = "";                                        //      Title that uses when memory gets saved
let lastEditingObject     = "";                                       //       Which file was changing at last
let currentIndex          = 0;                                       //        Index we use to refer to the message we need

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
    [memory, currentIndex] = memoryUtils.addToMemory(memory, "user", userInput, currentIndex);
    // Do preparations for dynamic updation both HTML div element and memory AI messages, to synch indexes
    const aiIndex = currentIndex;  // To prevent index mixing during abortion
    const aiElem = appendMessage(aiName, "", aiIndex);
    [memory, currentIndex] = memoryUtils.addToMemory(memory, "assistant", "", aiIndex);
    // Case without abortion
    try {
        // Stream and recieve AI response
        await chatWithOllama(fullMessagePayload, (chunk) => {
            aiMessage += chunk;
            aiElem.innerHTML = `<b>[${aiName}:]</b> ${aiMessage.replace(/\n/g, '<br>')}`;
            // Scroll down automatically
            const chatContent = document.getElementById(HTML_TAG.chattingContent);
            chatContent.scrollTop = chatContent.scrollHeight;
        });
    // Update already existed prepared AI message in memory
    memory = memoryUtils.updateMemory(memory, aiIndex, aiMessage);
    // Case with abortion
    } catch (err) {
        if (err.name === 'AbortError' && allowPartialSave) {
            memory = memoryUtils.updateMemory(memory, aiIndex, aiMessage);
        }
    }
    // Finalize some settings
    memory = memoryUtils.trimMemory(memory, trimLimit);                                                        // Trim memory if it is too long
    if (window.isArduino) import("../arduino/response-parser.js").then(({ parse }) => { parse(aiMessage); })  //  Send to Arduino if enabled
    console.log("[☂ LOG ☂ MEMORY ☂] — Memory updated.");                                                     //   LOGGING: Log
}

/**
 * Appends a new message bubble to the chat window.
 * 
 * @param {string} sender - The name of the message sender
 * @param {string} text   - The message content to be displayed.
 * @returns {HTMLElement} The inner wrapper element for text, used for updating content live.
 */
function appendMessage(sender, text, index) {
    const chatContent = document.getElementById(HTML_TAG.chattingContent);
    // Frame for the message (container div)
    const messageElem = document.createElement("div");
    messageElem.className = CSS_TAG.messageFramePreset;
    messageElem.dataset.index = index;  // Store index in the frame localStorage
    // Wrapper for the message text itself
    const wrapper = document.createElement("div");
    wrapper.className = "message-text";
    // Use aiName for AI responses
    const displayName = sender === aiName || sender === aiName ? aiName : sender;
    wrapper.innerHTML = `<b>[${displayName}:]</b> ${text.replace(/\n/g, '<br>')}`;
    messageElem.appendChild(wrapper);
    // Add wrapper with buttons itself
    const btnWrapper = frameUtlis.addFrameButtons(sender, index, {
        aiName, userName, memory, handleAiResponse
    });
    messageElem.appendChild(btnWrapper);
    // Add the full frame to the chat window
    chatContent.appendChild(messageElem);
    chatContent.scrollTop = chatContent.scrollHeight;  // Comment: Auto-scroll to latest
    return wrapper;                                   //  Return only the message text wrapper (so it can be streamed into)
}

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Button working

/**
 * Wrapper for handleAiResponse.
 * 
 * @returns {void}
 */
async function sendMessageButton() {
    const userInput = document.getElementById(HTML_TAG.chattingInputField);
    const userMessage = userInput.value.trim();
    if (!userMessage) return;
    userInput.value = "";  // Clear the field
    handleAiResponse(userMessage);
}

/**
 * Forcefully stops the AI response generation and attempts to shut down the Ollama service.
 * 
 * @returns {void}
 */
async function forceShut() {
    if (ollamaAbortController) ollamaAbortController.abort();
    try {
        await fetch('http://localhost:11434/api/shutdown', { method: 'POST' });
    } catch (e) {
        // Silent fail if shutdown not available
    }
    ollamaAbortController = new AbortController();
    console.warn("[⚠︎ WARNING ⚠︎] — ChatBot forced shut up");  // LOGGING: Warning
}

/**
 * Restores the program to its initial state by resetting the backend and clearing local storage.
 * 
 * @returns {void}
 */
async function restoreProgram() {
    // Reset backend JSON
    await fetch("http://localhost:8000/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})  // Here may be default template instead of full-clearing {}
    });
    // Clear localStorageq
    let lastTheme = localStorage.getItem("theme")
    localStorage.clear();
    localStorage.setItem("theme", lastTheme);
    // Reload page
    location.reload();
}

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Misc

/**
 * Inizializes the AI in the very beginning.
 *
 * @returns {void}
 */
async function initializeContext() {
    // Load from localStorage if available, else from file
    memory = memoryUtils.loadMemoryFromLocalStorage();
    currentIndex = memory.length > 0 ? memory[memory.length - 1].index + 1 : 0;  // To avoid colliding with existing messages when reloading from localStorage
    memory.forEach(msg => {
        appendMessage(msg.role === "user" ? userName : aiName, msg.content, msg.index);
    });
    // Load files for AI context
    const loadFile = async (path, key) => {
        let value = localStorage.getItem(key);
        if (value !== null) return value;
        const response = await fetch(path);
        return await response.text();
    };
    instructions = await loadFile(instructionsPath, "instructions");
    avatar       = await loadFile(avatarPath, "avatar");
    recollection = await loadFile(recollectionPath, "recollection");
    memoryName   = document.getElementById(HTML_TAG.titleInputField).placeholder.trim()
    const input  = document.getElementById(HTML_TAG.chattingInputField);
    // Get to the database and merge into localStorage/state
    const remote = await BackendAPI.loadFromBackend();
    if (remote && typeof remote === 'object') {
        // Merge known fields
        if (remote['ai-name'])         { localStorage.setItem('ai-name', remote['ai-name']); aiName = remote['ai-name']; }
        if (remote['ollama-model'])    { localStorage.setItem('ollama-model', remote['ollama-model']); model = remote['ollama-model']; }
        if (remote['ollama-port'])     { localStorage.setItem('ollama-port', remote['ollama-port']); port = remote['ollama-port']; }
        if (remote['arduino-device'])  { localStorage.setItem('arduino-device', remote['arduino-device']); port = remote['arduino-device']; }
        if (remote['arduino-baud'])    { localStorage.setItem('arduino-baud', remote['arduino-baud']); port = remote['arduino-baud']; }
        if (remote.instructions) { localStorage.setItem('instructions', remote.instructions); instructions = remote.instructions; }
        if (remote.avatar)       { localStorage.setItem('avatar', remote.avatar); avatar = remote.avatar; }
        if (remote.recollection) { localStorage.setItem('recollection', remote.recollection); recollection = remote.recollection; }
        if (remote.chatMemory)        { 
            // If localStorage already has chatMemory we don't want to clobber it here.
            const localChat = JSON.parse(localStorage.getItem('chatMemory') || 'null');
            if (!localChat || !Array.isArray(localChat) || localChat.length === 0) {
                // Persist remote chatMemory into localStorage and use it as the in-memory messages
                localStorage.setItem('chatMemory', JSON.stringify(remote.chatMemory));
                memory = Array.isArray(remote.chatMemory) ? remote.chatMemory.slice() : [];
            } else {
                // Prefer local version if it exists
                memory = localChat;
            }
        }
        if (remote.appearanceContext) { localStorage.setItem('appearanceContext', remote.appearanceContext); window.appearanceContext = remote.appearanceContext; }
        if (remote.appearanceLayers)  {
            Object.entries(remote.appearanceLayers).forEach(([id, val]) => {
                const el = document.getElementById(id);
                if (el && val) {
                    if (val.src && el.tagName.toLowerCase() === 'img') el.src = val.src;
                    if (val.display !== undefined) el.style.display = val.display;
                }
            });
        }
    }
    // Ensure localStorage mirrors the finalized values
    localStorage.setItem("ai-name",        aiName);
    localStorage.setItem("ollama-model",   model);
    localStorage.setItem("ollama-port",    port);
    localStorage.setItem("arduino-device", arduinoDevice);
    localStorage.setItem("arduino-baud",   baudRate);
    localStorage.setItem("instructions",   instructions);
    localStorage.setItem("avatar",         avatar);
    localStorage.setItem("recollection",   recollection);
    // If memory was loaded from backend (and not yet rendered), render it now
    if (Array.isArray(memory) && memory.length > 0) {
        // Clear any existing UI messages first (in case we rendered earlier from localStorage)
        const chatContent = document.getElementById(HTML_TAG.chattingContent);
        chatContent.innerHTML = "";
        memory.forEach(msg => {
            appendMessage(msg.role === "user" ? userName : aiName, msg.content, msg.index);
        });
        // Ensure currentIndex follows last message index
        currentIndex = memory.length > 0 ? memory[memory.length - 1].index + 1 : 0;
    }
    // Get to the page
    input.focus();
    document.getElementById(HTML_TAG.titleInputField).placeholder = `${aiName}'s room`;  // Update placeholder's text in advance
    window.updateAppearanceContext();                                                   //  Update appearanceContext based on pre-loaded layers
    console.log("[☂ LOG ☂ INITIALIZATION ☂] — Chat initialized successfully.")         //   LOGGING: Log
}

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== The beginning

// Bind Enter/Return button key to the send button
document.getElementById(HTML_TAG.chattingInputField).addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessageButton();
    }
});
// Let use button functions as soon as localStorage is loaded
document.addEventListener("DOMContentLoaded", () => {
    appearanceUtils.restoreAppearanceLayers();
    // Naming the chat
    document.getElementById(HTML_TAG.titleInputField).addEventListener('input', () => {
        const input = document.getElementById(HTML_TAG.titleInputField);
        memoryName = input.value.trim() || input.placeholder.trim();
    });
    // Message group
    document.getElementById("send-btn").addEventListener("click", sendMessageButton);
    document.getElementById("force-shut-btn").addEventListener("click", forceShut);
    document.getElementById("restore-program-btn").addEventListener("click", restoreProgram);
    // Memory group
    document.getElementById("save-memory-btn").addEventListener("click", () => {memoryUtils.saveMemoryToFile(memory, userName, aiName, memoryName)});
    document.getElementById("load-memory-btn").addEventListener("click", async () => {
        [memory, currentIndex, memoryName] = await memoryUtils.loadMemoryFromFile(
            userName, 
            aiName, 
            appendMessage, 
        );
    });
    document.getElementById("delete-memory-btn").addEventListener("click", () => {[memory, currentIndex] = memoryUtils.clearMemory()});
    // File group
    document.getElementById("instructions-editor-btn").addEventListener("click", () => { 
        lastEditingObject = popupUtils.openEditor("instructions", lastEditingObject, {instructions, avatar, recollection}, popupLimit);
    });
    document.getElementById("avatar-editor-btn").addEventListener("click", () => { 
        lastEditingObject = popupUtils.openEditor("avatar", lastEditingObject, {instructions, avatar, recollection}, popupLimit);
    });
    document.getElementById("memo-editor-btn").addEventListener("click", () => { 
        lastEditingObject = popupUtils.openEditor("recollection", lastEditingObject, {instructions, avatar, recollection}, popupLimit);
    });
    document.getElementById("editor-save-btn").addEventListener("click", () => {
        const newValue = popupUtils.saveEditor(lastEditingObject);
        if (newValue !== null) {
            if (lastEditingObject === "instructions") {
                instructions = newValue;
            } else if (lastEditingObject === "avatar") {
                avatar = newValue;
            } else if (lastEditingObject === "recollection") {
                recollection = newValue;
            }
        }
    });
    document.getElementById("editor-close-btn").addEventListener("click", popupUtils.closeEditor);
    document.getElementById("editor-info-btn").addEventListener("click", () => { popupUtils.showEditorInfo(lastEditingObject); });
    // Full AI customization (Settings) one-button-group
    document.getElementById("settings-btn").addEventListener("click", () => settingsUtils.openSettings({ aiName, model, port, arduinoDevice, baudRate }));
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
            const observer = new MutationObserver(() => appearanceUtils.saveAppearanceLayers());
            observer.observe(elem, { attributes: true, attributeFilter: ["src", "style"] });
        }
    });
    // Initialize context when the page loads
    initializeContext();
});

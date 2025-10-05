import * as memoryUtils from "/frontend/src/utils/memory-utils.js";

/**
 * Creates a row of control buttons (refresh, delete, edit, copy) 
 * and returns it as a localStorage element to be appended to a message frame.
 *
 * @param {string} sender - The role of the message sender. Should match aiName for AI messages.
 * @param {number} index  - The index of the message in memory.
 * @param {Object} ctx    - Context containing aiName, userName, memory, and callbacks.
 * @returns {HTMLElement} btnWrapper - A <div> element containing the appropriate buttons.
 */
export function addFrameButtons(sender, index, ctx) {
    const { aiName } = ctx;

    // ⧉ Copy button
    const copyBtn = document.createElement("button");
    copyBtn.innerText = "⧉";
    copyBtn.onclick = () => copyText(index, ctx.memory);

    // ✎ Edit button
    const editBtn = document.createElement("button");
    editBtn.innerText = "✎";
    editBtn.onclick = () => editMessage(index, sender, ctx);

    // ♻ Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "♻";
    deleteBtn.onclick = () => deleteMessageByIndex(index, ctx);

    // ↻ Refresh button
    const refreshBtn = document.createElement("button");
    refreshBtn.innerText = "↻";
    refreshBtn.onclick = () => refreshFromIndex(index, ctx);

    // Create wrapper for buttons
    const btnWrapper = document.createElement("div");
    btnWrapper.className = CSS_TAG.frameButtonRow;

    if (sender === aiName) {
        btnWrapper.appendChild(refreshBtn);
        btnWrapper.appendChild(deleteBtn);
        btnWrapper.appendChild(editBtn);
        btnWrapper.appendChild(copyBtn);
    } else {
        btnWrapper.appendChild(deleteBtn);
        btnWrapper.appendChild(editBtn);
        btnWrapper.appendChild(copyBtn);
    }

    return btnWrapper;
}

/**
 * Copies a message to clipboard by its index.
 *
 * @param {number} index - Index of the message to copy.
 * @param {Object} ctx   - Context containing memory and tooltip function.
 * @returns {void}
 */
export function copyText(index, ctx) {
    const memory = ctx;
    const msg = memory.find(m => m.index === index);
    if (!msg) {
        console.error("[⚙ ERROR ⚙] — Message not found for copying.");  // LOGGING: Error
        return;
    }
    navigator.clipboard.writeText(msg.content);
    if (summonTooltip) summonTooltip("Copied!", 2000);
    console.log("[☂ LOG ☂ COPY ☂]: Message copied.");  // LOGGING: Log
}

/**
 * Enables edit mode for a message.
 *
 * @param {number} index  - Index of the message.
 * @param {string} sender - Sender role/name.
 * @param {Object} ctx    - Context containing localStorage refs, memory, and callbacks.
 * @returns {void}
 */
export function editMessage(index, sender, ctx) {
    const { memory } = ctx;
    const chattingContent = document.getElementById(HTML_TAG.chattingContent);
    const targetElem = [...chattingContent.getElementsByClassName(CSS_TAG.messageFramePreset)]
        .find(el => parseInt(el.dataset.index) === index);

    if (!targetElem) {
        console.error("[⚙ ERROR ⚙] — Message not found for editing.");  // LOGGING: Error
        return;
    }

    const userTextWrapper = targetElem.querySelector(".message-text");
    const msg = memory.find(m => m.index === index);
    const originalText = msg?.content || "";

    const input = document.createElement("textarea");
    input.value = originalText;
    input.oninput = () => {
        input.style.height = "";
        input.style.height = (input.scrollHeight + 2) + "px";
    };

    const applyBtn = document.createElement("button");
    applyBtn.innerText = "☑";
    applyBtn.onclick = () => {
        msg.content = input.value.trim();
        userTextWrapper.innerHTML = `<b>[${sender}:]</b> ${msg.content.replace(/\n/g, "<br>")}`;
        memoryUtils.updateMemory(memory, index, msg.content);
        memoryUtils.saveMemoryToLocalStorage(memory);
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.innerText = "☒";
    cancelBtn.onclick = () => {
        userTextWrapper.innerHTML = `<b>[${sender}:]</b> ${originalText.replace(/\n/g, "<br>")}`;
    };

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) applyBtn.click();
    });

    const btnRow = document.createElement("div");
    btnRow.className = CSS_TAG.editButtonRow;
    btnRow.appendChild(input);
    btnRow.appendChild(applyBtn);
    btnRow.appendChild(cancelBtn);

    userTextWrapper.innerHTML = "";
    userTextWrapper.appendChild(btnRow);
    input.focus();
}

/**
 * Deletes a message by its index.
 *
 * @param {number} index - Index of the message.
 * @param {Object} ctx   - Context containing memory and chattingContent.
 * @returns {void}
 */
export function deleteMessageByIndex(index, ctx) {
    // Mutate the shared memory array in-place so all references see the change.
    const mem = ctx.memory;
    const msgPos = mem.findIndex(m => m.index === index);
    if (msgPos !== -1) {
        mem.splice(msgPos, 1);
    }

    // Remove the corresponding localStorage element
    const chattingContent = document.getElementById(HTML_TAG.chattingContent);
    const messages = [...chattingContent.getElementsByClassName(CSS_TAG.messageFramePreset)];
    const targetElem = messages.find(elem => parseInt(elem.dataset.index) === index);
    if (targetElem) targetElem.remove();

    memoryUtils.saveMemoryToLocalStorage(mem);
    console.log(`[☂ LOG ☂ DELETION ☂] — Message with index ${index} deleted.`);  // LOGGING: Log
}

/**
 * Refreshes an AI response for a given user message.
 *
 * @param {number} index - The index of the AI message.
 * @param {Object} ctx   - Context containing memory, userName, chattingContent, handleAiResponse, rewindMessages.
 * @returns {void}
 */
export function refreshFromIndex(index, ctx) {
    const { memory, userName, handleAiResponse } = ctx;
    const targetUserIndex = index - 1;

    let userMessage = memory.find(msg => msg.index === targetUserIndex && msg.role === "user");

    if (!userMessage) {
        const chattingContent = document.getElementById(HTML_TAG.chattingContent);
        const messageElems = [...chattingContent.getElementsByClassName(CSS_TAG.messageFramePreset)];
        const possibleUserElems = messageElems.filter(el => {
            const elIndex = parseInt(el.dataset.index);
            return elIndex < index && el.querySelector(".message-text").innerText.startsWith(`[${userName}:]`);
        });
        if (possibleUserElems.length > 0) {
            const closestUserElem = possibleUserElems[possibleUserElems.length - 1];
            const recoveredIndex = parseInt(closestUserElem.dataset.index);
            const textWrapper = closestUserElem.querySelector(".message-text");
            const rawText = textWrapper.innerText.replace(new RegExp(`^\\[${userName}:\\]\\s*`), "");
            userMessage = { index: recoveredIndex, role: "user", content: rawText };
            console.warn(`[⚠︎ WARNING ⚠︎] — Memory recovery used for refresh: index ${recoveredIndex}`);  // LOGGING: Warning
        }
    }

    if (!userMessage) {
        console.error(`[⚙ ERROR ⚙] — No user message found to refresh near index ${index}.`);  // LOGGING: Error
        return;
    }

    rewindMessages(targetUserIndex, ctx);
    handleAiResponse(userMessage.content, false);
    console.log(`[☂ LOG ☂ REFRESH ☂] — Message with index ${userMessage.index} refreshed.`);  // LOGGING: Log
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
    tooltip.className = CSS_TAG.tooltipPreset;
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
 * Deletes all messages from memory and localStorage up to and including the specified index.
 * 
 * @param {number} targetIndex - The highest index to delete (inclusive).
 * @returns {void}
 */
function rewindMessages(targetIndex, ctx) {
    // Mutate the shared memory array in-place to remove messages with index >= targetIndex
    const mem = ctx.memory;
    for (let i = mem.length - 1; i >= 0; i--) {
        if (mem[i].index >= targetIndex) mem.splice(i, 1);
    }

    // Remove corresponding localStorage elements
    const chattingContent = document.getElementById(HTML_TAG.chattingContent);
    const messages = [...chattingContent.getElementsByClassName(CSS_TAG.messageFramePreset)];
    messages.forEach(elem => {
        const msgIndex = parseInt(elem.dataset.index);
        if (msgIndex >= targetIndex) {
            chattingContent.removeChild(elem);
        }
    });

    memoryUtils.saveMemoryToLocalStorage(mem);
    console.log(`[☂ LOG ☂ REFRESH ☂] — All messages up to index ${targetIndex} (including) deleted.`);  // LOGGING: Log
}

import { inferEmotion } from "/frontend/src/emotion-ai.js";

const observer = new MutationObserver(() => {
    clearTimeout(observer.debounce);
    observer.debounce = setTimeout(() => {
        const chatMessages = document.querySelectorAll("#chat-content > div");
        const last = chatMessages[chatMessages.length - 1];
        if (last && last.innerText.startsWith("[Nicole:]")) {
            const content = last.innerText.replace("[Nicole:]", "").replace("↻\n♻\n✎\n⧉", "").trim();
            let [emotion, isBlushed] = inferEmotion(content);                   // Destructuring array
            if (content) console.log(`[𖦹 AI Emotion 𖦹] — ${emotion}`);         //  LOGGING: Log (AI Emotion)
            else emotion = "annoyed";                                         //   Make her change expression while her reponse is generating
            if (emotion === "annoyed" && window.isDark) emotion = "-sleepy"  //    Change the type of emotion when theme changed
            document.getElementById("wife-expression").src = `/frontend/media/nicole/expressions/${emotion}.png`;
            const blushOverlay = document.getElementById("blush-overlay");
            if (isBlushed) {
                blushOverlay.style.display = "block";
            } else {
                blushOverlay.style.display = "none";
            }
        } else if (!last) {  // If chat is empty
            document.getElementById("wife-expression").src = "/frontend/media/nicole/expressions/neutral.png";
        }
    }, 300);
});
const chatWindow = document.getElementById(HTML_TAG.chattingWindow);
observer.observe(chatWindow, { childList: true, subtree: true, characterData: true });

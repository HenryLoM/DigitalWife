// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Chat window"s frame automatic stretch

function resizeMiniFrame(container) {
    const frame = container.querySelector(".mini-frame-wrapper");
    frame.style.height = container.scrollHeight + "px";
}

const chatWindow = document.getElementById(HTML_TAG.chattingWindow);
resizeMiniFrame(chatWindow);
chatWindow.addEventListener("scroll", () => resizeMiniFrame(chatWindow));
chatWindow.addEventListener("resize", () => resizeMiniFrame(chatWindow));

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Scroll unlocker

function adjustOverflow() {
  if (window.innerHeight < 700) {
    document.body.style.overflowY = "auto";
  } else {
    document.body.style.overflowY = "hidden";
  }
}

window.addEventListener("resize", adjustOverflow);
adjustOverflow();

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Shut down button

const shutter = document.createElement("button");
shutter.id = "force-shut-btn";
shutter.className = "force-shut-button-preset";
shutter.innerText = "✸";
document.body.appendChild(shutter);

// ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== Restore program button

const restorer = document.createElement("button");
restorer.id = "restore-program-btn";
restorer.className = "restore-program-button-preset";
restorer.innerText = "∅";
document.body.appendChild(restorer);

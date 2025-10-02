// ================================
// Modal Logic
// ================================
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modalImg");
const closeBtn = document.getElementById("closeModal");

// Open modal
for (const img of document.querySelectorAll(".screenshot")) {
    img.addEventListener("click", () => {
    window.scrollTo({ top: document.body.scrollHeight/6, behavior: "smooth" });
        modal.classList.add("active");
        modalImg.src = img.src;
        document.body.style.overflow = "hidden";
    });
}

// Close modal button
closeBtn.addEventListener("click", () => {
    modal.classList.remove("active");
    setTimeout(() => modalImg.src = "", 300);
    setTimeout(() => { document.body.style.overflow = ""; }, 300);
});

// Close modal outside content
modal.addEventListener("click", e => {
    if (e.target === modal) {
        modal.classList.remove("active");
        setTimeout(() => modalImg.src = "", 300);
        setTimeout(() => { document.body.style.overflow = ""; }, 300);
    }
});

// ================================
// Nicole Roller Assets
// ================================
const bodies = [
    '/frontend/media/nicole/bodies/white.png',
    '/frontend/media/nicole/bodies/black.png',
    '/frontend/media/nicole/bodies/tan.png',
    '/frontend/media/nicole/bodies/albino.png',
];
const clothes = [
    '/frontend/media/nicole/clothes/bikini.png',
    '/frontend/media/nicole/clothes/hoodie-green.png',
    '/frontend/media/nicole/clothes/hoodie-loose.png',
    '/frontend/media/nicole/clothes/summer-dress.png',
    '/frontend/media/nicole/clothes/uniform-school-light.png',
    '/frontend/media/nicole/clothes/uniform-school-dark.png',
    '/frontend/media/nicole/clothes/pajama.png',
    '/frontend/media/nicole/clothes/bloose-offical.png',
    '/frontend/media/nicole/clothes/uniform-academy.png',
];
const hairsFront = [
    '/frontend/media/nicole/hair/lob-brown front.png',
    '/frontend/media/nicole/hair/lob-blonde front.png',
    '/frontend/media/nicole/hair/lob-pink front.png',
    '/frontend/media/nicole/hair/long-silver front.png',
    '/frontend/media/nicole/hair/long-blonde front.png',
    '/frontend/media/nicole/hair/long-silver front.png',
    '/frontend/media/nicole/hair/bob-pink front.png',
    '/frontend/media/nicole/hair/hime-black front.png',
    '/frontend/media/nicole/hair/hime-brown front.png',
    '/frontend/media/nicole/hair/twin-black front.png',
];
const expressions = [
    '/frontend/media/nicole/expressions/happy 1.png',
    '/frontend/media/nicole/expressions/smile 1.png',
    '/frontend/media/nicole/expressions/smile 2.png',
    '/frontend/media/nicole/expressions/neutral.png',
    '/frontend/media/nicole/expressions/sad.png',
    '/frontend/media/nicole/expressions/-smug.png',
];
const additionals = [
    '/frontend/media/nicole/additional/band-black.png',
    '/frontend/media/nicole/additional/band-white.png',
    '/frontend/media/nicole/additional/choker.png',
    '/frontend/media/nicole/additional/flower.png',
    '/frontend/media/nicole/additional/makeup.png',
];

// ================================
// Roller Logic
// ================================
const rollerTrack = document.getElementById('nicole-roller-track');
const compositeWidth = 280;
const compositeHeight = 320;
const visibleComposites = 4;
let composites = [];

function createNicoleComposite() {
    const frontHair = hairsFront[Math.floor(Math.random() * hairsFront.length)];
    const backHair = frontHair.replace('front.png', 'back.png');
    const body = bodies[Math.floor(Math.random() * bodies.length)];
    const expr = expressions[Math.floor(Math.random() * expressions.length)];
    const clothesItem = clothes[Math.floor(Math.random() * clothes.length)];
    const additional = additionals[Math.floor(Math.random() * additionals.length)];

    const wrapper = document.createElement('div');
    wrapper.className = 'nicole-composite';
    wrapper.style.cssText = `position:relative;width:${compositeWidth}px;height:${compositeHeight}px;flex:none;margin-right:16px;overflow:hidden;`;

    // Preload images before showing
    const images = [backHair, body, expr, clothesItem, frontHair, additional];
    let loaded = 0;

    images.forEach((src, index) => {
        const img = new Image();
        img.src = src;
        img.style.cssText = `position:absolute;left:0;top:0;width:100%;height:100%;z-index:${index + 1};`;
        img.onload = () => {
            loaded++;
            if (loaded === images.length) wrapper.style.visibility = "visible";
        };
        wrapper.appendChild(img);
    });

    // Prevent dragging and selection
    wrapper.addEventListener("dragstart", e => e.preventDefault());
    wrapper.addEventListener("selectstart", e => e.preventDefault());
    wrapper.addEventListener("mousedown", e => e.preventDefault());

    wrapper.style.visibility = "hidden";
    return wrapper;
}

function addCompositeToRoller() {
    const composite = createNicoleComposite();
    rollerTrack.appendChild(composite);
    composites.push(composite);
}

function removeFirstComposite() {
    if (composites.length > 0) {
        rollerTrack.removeChild(composites[0]);
        composites.shift();
    }
}

// Initial fill
for (let i = 0; i < visibleComposites + 2; i++) {
    const composite = createNicoleComposite();
    rollerTrack.appendChild(composite);
    composites.push(composite);
}

let offset = 0;
const speed = 1;

function animateRoller() {
    offset -= speed;
    rollerTrack.style.transform = `translateX(${offset}px)`;

    // Smoothly check if first composite is out of view
    if (composites.length > 0 && offset <= -compositeWidth - 16) {
        // Move the first composite to the end instead of removing and creating a new one
        const first = composites.shift();
        offset += compositeWidth + 16; // adjust offset
        rollerTrack.appendChild(first); // recycle it
        composites.push(first);

        // Optionally, update images in recycled composite for variety
        const newComposite = createNicoleComposite();
        rollerTrack.replaceChild(newComposite, first);
        composites[composites.length - 1] = newComposite;
    }

    requestAnimationFrame(animateRoller);
}

animateRoller();

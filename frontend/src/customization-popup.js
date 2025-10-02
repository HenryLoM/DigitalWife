/**
 * ================================
 * Appearance Customization Script
 * ================================
 *
 * Provides functionality to:
 * - Save and load character appearance attributes using localStorage.
 * - Update a descriptive context of the character's appearance.
 * - Dynamically generate a popup customization menu with sections for clothes, places, extras, and hairstyles.
 * - Handle navigation between customization sections.
 * - Render overlays in the DOM for selected attributes.
 */

// ================================
// Initialize appearance variables
// ================================

window.selectedBody    = localStorage.getItem("selectedBody")    || "White";
window.selectedEyes    = localStorage.getItem("selectedEyes")    || "Purple";
window.selectedHair    = localStorage.getItem("selectedHair")    || "Brown Lob";
window.selectedClothes = localStorage.getItem("selectedClothes") || "Green hoodie";
window.selectedPlace   = localStorage.getItem("selectedPlace")   || "Digital program window";
window.selectedExtra   = localStorage.getItem("selectedExtra")   || null;

// ================================
// Update Appearance Context
// ================================

/**
 * Updates the user's appearance context and saves selections to localStorage.
 *
 * @returns {void}
 *
 * @property {string}   window.appearanceContext - Text description of the appearance.
 * @property {string[]} window.appearanceData    - Array of selected appearance attributes.
 */
window.updateAppearanceContext = function() {
    let appearance = "";

    if (window.selectedBody)    appearance += `You have ${window.selectedBody} skin\n`;
    if (window.selectedEyes)    appearance += `You have ${window.selectedEyes} eyes\n`;
    if (window.selectedHair)    appearance += `You have ${window.selectedHair} hair\n`;
    if (window.selectedClothes) appearance += `You wear ${window.selectedClothes}\n`;
    if (window.selectedPlace)   appearance += `You are in ${window.selectedPlace}\n`;
    if (window.selectedExtra)   appearance += `You additionally wear ${window.selectedExtra}\n`;

    window.appearanceContext = appearance.trim();
    window.appearanceData    = [
        window.selectedBody,
        window.selectedEyes,
        window.selectedHair,
        window.selectedClothes,
        window.selectedPlace,
        window.selectedExtra
    ];

    // Save selections in localStorage
    localStorage.setItem("selectedBody",    window.selectedBody    || "");
    localStorage.setItem("selectedEyes",    window.selectedEyes    || "");
    localStorage.setItem("selectedHair",    window.selectedHair    || "");
    localStorage.setItem("selectedClothes", window.selectedClothes || "");
    localStorage.setItem("selectedPlace",   window.selectedPlace   || "");
    localStorage.setItem("selectedExtra",   window.selectedExtra   || "");

    // Save descriptive context for consistency
    localStorage.setItem("appearanceContext", window.appearanceContext);
};

// ================================
// Popup Close Utility
// ================================

/**
 * Closes and removes a popup element with a transition effect.
 *
 * @param {HTMLElement} popup - The popup element to close and remove.
 * @returns {void}
 */
function closePopup(popup) {
    popup.classList.remove("active");
    popup.classList.add("closing");

    popup.addEventListener(
        "transitionend",
        () => {
            setTimeout(() => {
                if (popup.parentNode) popup.parentNode.removeChild(popup);
            }, 150);
        },
        { once: true }
    );
}

// ================================
// Customize Button Logic
// ================================

document.getElementById("customize-btn").addEventListener("click", () => {
    // Close if already open
    const existingPopup = document.querySelector(".customize-popup-style:not(.closing)");
    if (existingPopup) {
        closePopup(existingPopup);
        return;
    }

    // Create popup container
    const popup = document.createElement("div");
    popup.id = "customize-popup";
    popup.classList.add("customize-popup-style");
    document.body.appendChild(popup);

    // Trigger transition
    popup.offsetHeight;
    popup.classList.add("active");

    // ================================
    // Data Lists
    // ================================

    const bodiesList = [
        { label: "White",  path: "/frontend/media/nicole/bodies/white.png"  },
        { label: "Tan",    path: "/frontend/media/nicole/bodies/tan.png"    },
        { label: "Black",  path: "/frontend/media/nicole/bodies/black.png"  },
        { label: "Albino", path: "/frontend/media/nicole/bodies/albino.png" },
    ];

    const hairList = [
        { label: "Lob:\n",    separator: true },
        { label: "Black",     path: "/frontend/media/nicole/hair/lob-black.png"   },
        { label: "Brown",     path: "/frontend/media/nicole/hair/lob-brown.png"   },
        { label: "Blonde",    path: "/frontend/media/nicole/hair/lob-blonde.png"  },
        { label: "Silver",    path: "/frontend/media/nicole/hair/lob-silver.png"  },
        { label: "Pink",      path: "/frontend/media/nicole/hair/lob-pink.png"    },
        { label: "\nLong:\n", separator: true },
        { label: "Black",     path: "/frontend/media/nicole/hair/long-black.png"  },
        { label: "Brown",     path: "/frontend/media/nicole/hair/long-brown.png"  },
        { label: "Blonde",    path: "/frontend/media/nicole/hair/long-blonde.png" },
        { label: "Silver",    path: "/frontend/media/nicole/hair/long-silver.png" },
        { label: "Pink",      path: "/frontend/media/nicole/hair/long-pink.png"   },
        { label: "\nBob:\n",  separator: true },
        { label: "Black",     path: "/frontend/media/nicole/hair/bob-black.png"  },
        { label: "Brown",     path: "/frontend/media/nicole/hair/bob-brown.png"  },
        { label: "Blonde",    path: "/frontend/media/nicole/hair/bob-blonde.png" },
        { label: "Silver",    path: "/frontend/media/nicole/hair/bob-silver.png" },
        { label: "Pink",      path: "/frontend/media/nicole/hair/bob-pink.png"   },
        { label: "\nHime:\n", separator: true },
        { label: "Black",     path: "/frontend/media/nicole/hair/hime-black.png"  },
        { label: "Brown",     path: "/frontend/media/nicole/hair/hime-brown.png"  },
        { label: "Blonde",    path: "/frontend/media/nicole/hair/hime-blonde.png" },
        { label: "Silver",    path: "/frontend/media/nicole/hair/hime-silver.png" },
        { label: "Pink",      path: "/frontend/media/nicole/hair/hime-pink.png"   },
        { label: "\nTwin:\n", separator: true },
        { label: "Black",     path: "/frontend/media/nicole/hair/twin-black.png"  },
        { label: "Brown",     path: "/frontend/media/nicole/hair/twin-brown.png"  },
        { label: "Blonde",    path: "/frontend/media/nicole/hair/twin-blonde.png" },
        { label: "Silver",    path: "/frontend/media/nicole/hair/twin-silver.png" },
        { label: "Pink",      path: "/frontend/media/nicole/hair/twin-pink.png"   },
    ];

    const clothesList = [
        { label: "Home & Out:\n",           separator: true },
        { label: "Green hoodie",            path: "/frontend/media/nicole/clothes/hoodie-green.png"         },
        { label: "Loose hoodie",            path: "/frontend/media/nicole/clothes/hoodie-loose.png"         },
        { label: "Black boatneck",          path: "/frontend/media/nicole/clothes/boatneck-black.png"       },
        { label: "Pink boatneck",           path: "/frontend/media/nicole/clothes/boatneck-pink.png"        },
        { label: " | ",                     separator: true },
        { label: "Casual bloose",           path: "/frontend/media/nicole/clothes/bloose-casual.png"        },
        { label: "Offical bloose",          path: "/frontend/media/nicole/clothes/bloose-offical.png"       },
        { label: "Casual vest",             path: "/frontend/media/nicole/clothes/casual-vest.png"          },
        { label: "Summer dress",            path: "/frontend/media/nicole/clothes/summer-dress.png"         },
        { label: "Coat and scarf",          path: "/frontend/media/nicole/clothes/coat-and-scarf.png"       },
        { label: "\nUniforms & Special:\n", separator: true },
        { label: "Academy uniform",         path: "/frontend/media/nicole/clothes/uniform-academy.png"      },
        { label: "PE uniform",              path: "/frontend/media/nicole/clothes/uniform-pe.png"           },
        { label: "Light seifuku",           path: "/frontend/media/nicole/clothes/uniform-school-light.png" },
        { label: "Dark seifuku",            path: "/frontend/media/nicole/clothes/uniform-school-dark.png"  },
        { label: " | ",                     separator: true },
        { label: "Tank top",                path: "/frontend/media/nicole/clothes/tank-top.png"             },
        { label: "Swimsuit",                path: "/frontend/media/nicole/clothes/swimsuit.png"             },
        { label: "Bikini",                  path: "/frontend/media/nicole/clothes/bikini.png"               },
        { label: "\nIntimate:\n",           separator: true },
        { label: "Pajama",                  path: "/frontend/media/nicole/clothes/pajama.png"               },
        { label: "Towel",                   path: "/frontend/media/nicole/clothes/towel.png"                },
        { label: "Bra",                     path: "/frontend/media/nicole/clothes/bra.png"                  },
        { label: "Nothing",                 path: "/frontend/media/nicole/additional/-censore.png"          }  // change -censore to -nipples for uncensored output
    ];

    const placesList = [
        { label: "Home:\n",               separator: true },
        { label: "Living room",           path: "/frontend/media/places/living-room.png" },
        { label: "Bedroom",               path: "/frontend/media/places/bedroom.png"     },
        { label: "Kitchen",               path: "/frontend/media/places/kitchen.png"     },
        { label: "Bathroom",              path: "/frontend/media/places/bathroom.png"    },
        { label: "\nCity & Lifestyle:\n", separator: true },
        { label: "Street",                path: "/frontend/media/places/street.png"      },
        { label: "Bus stop",              path: "/frontend/media/places/bus-stop.png"    },
        { label: "Train",                 path: "/frontend/media/places/train.png"       },
        { label: " | ",                   separator: true },
        { label: "Park",                  path: "/frontend/media/places/park.png"        },
        { label: "Cafe",                  path: "/frontend/media/places/cafe.png"        },
        { label: "Restaurant",            path: "/frontend/media/places/restaurant.png"  },
        { label: "Cinema",                path: "/frontend/media/places/cinema.png"      },
        { label: "\nMisc:\n",             separator: true },
        { label: "Classroom",             path: "/frontend/media/places/classroom.png"   },
        { label: "Beach",                 path: "/frontend/media/places/beach.png"       },
        { label: "No Background",         path: null                             }
    ];

    const additionalList = [
        { label: "Flowers:\n",           separator: true },
        { label: "Pink flower",          path: "/frontend/media/nicole/additional/flower.png"        },
        { label: "Red rose",             path: "/frontend/media/nicole/additional/rose-red.png"      },
        { label: "White rose",           path: "/frontend/media/nicole/additional/rose-white.png"    },
        { label: "\nRibbons & Bands:\n", separator: true },
        { label: "White ribbon",         path: "/frontend/media/nicole/additional/ribbon-white.png"  },
        { label: "Black ribbon",         path: "/frontend/media/nicole/additional/ribbon-black.png"  },
        { label: "Yellow ribbon",        path: "/frontend/media/nicole/additional/ribbon-yellow.png" },
        { label: " | ",                  separator: true },
        { label: "White band",           path: "/frontend/media/nicole/additional/band-white.png"    },
        { label: "Black band",           path: "/frontend/media/nicole/additional/band-black.png"    },
        { label: "Yellow band",          path: "/frontend/media/nicole/additional/band-yellow.png"   },
        { label: "\nMisc:\n",            separator: true },
        { label: "Headphones",           path: "/frontend/media/nicole/additional/headphones.png"    },
        { label: "Chocker",              path: "/frontend/media/nicole/additional/choker.png"        },
        { label: "Blush",                path: "/frontend/media/nicole/additional/makeup.png"        },
        { label: "Hide",                 path: null                                          }
    ];

    // ================================
    // Section Creator
    // ================================

    /**
     * Creates a customization section with buttons for each item.
     *
     * @param {string} title - Title of the section.
     * @param {Array}  itemList - List of items with label and path.
     * @param {Function} onClickCallback - Function executed when an item is clicked.
     * @returns {HTMLElement} Section element.
     */
    function createSection(title, itemList, onClickCallback) {
        const section = document.createElement("div");
        section.classList.add("customize-section");
        section.innerHTML = `<h3>${title}:</h3>`;

        itemList.forEach(item => {
            if (item.separator) {
                const separator = document.createElement("span");
                separator.innerText = item.label;
                section.appendChild(separator);
                return;
            }

            const btn = document.createElement("button");
            btn.innerText = item.label;
            btn.addEventListener("click", () => onClickCallback(item));
            section.appendChild(btn);
        });

        return section;
    }

    // ================================
    // Page Logic
    // ================================

    let currentPage = 0; // 0 = clothes/places/additional, 1 = hairstyle
    let clothesSection, placesSection, additionalSection, bodiesSection, hairSection;

    /**
     * Renders sections based on the current page.
     *
     * @returns {void}
     */
    function renderSections() {
        [clothesSection, placesSection, additionalSection, bodiesSection, hairSection].forEach(section => {
            if (section && section.parentNode === popup) popup.removeChild(section);
        });

        if (currentPage === 0) {
            clothesSection = createSection("Clothes", clothesList, (item) => {
                const overlay = document.getElementById("clothes-overlay");
                if (item.path) {
                    overlay.src = item.path;
                    overlay.style.display = "block";
                    selectedClothes = item.label;
                } else {
                    overlay.style.display = "none";
                    selectedClothes = null;
                }
                window.updateAppearanceContext();
            });

            placesSection = createSection("Places", placesList, (item) => {
                const overlay = document.getElementById("background");
                if (item.path) {
                    overlay.src = item.path;
                    overlay.style.display = "block";
                    selectedPlace = item.label;
                } else {
                    overlay.style.display = "none";
                    selectedPlace = "Digital program window";
                }
                window.updateAppearanceContext();
            });

            additionalSection = createSection("Additional", additionalList, (item) => {
                const overlay = document.getElementById("additional-overlay");
                if (item.path) {
                    overlay.src = item.path;
                    overlay.style.display = "block";
                    selectedExtra = item.label;
                } else {
                    overlay.style.display = "none";
                    selectedExtra = null;
                }
                window.updateAppearanceContext();
            });

            popup.appendChild(clothesSection);
            popup.appendChild(placesSection);
            popup.appendChild(additionalSection);

        } else if (currentPage === 1) {
            bodiesSection = createSection("Skin tones", bodiesList, (item) => {
                const overlay = document.getElementById("bodies-overlay");

                if (item.path) {
                    overlay.src = item.path;
                    overlay.style.display = "block";
                    selectedBody = item.label;
                } else {
                    overlay.style.display = "none";
                    selectedBody = null;
                }
                window.updateAppearanceContext();
            });

            hairSection = createSection("Hairstyle", hairList, (item) => {
                const overlayBack  = document.getElementById("wife-hair-back");
                const overlayFront = document.getElementById("wife-hair-front");

                if (item.path) {
                    overlayBack.src  = item.path.replace(".png", " back.png");
                    overlayFront.src = item.path.replace(".png", " front.png");
                    overlayBack.style.display = "block";
                    overlayFront.style.display = "block";

                    if (item.path.includes("lob")) selectedHair = `${item.label} Lob`;
                    else                           selectedHair = `${item.label} Long`;
                } else {
                    overlayBack.style.display = "none";
                    overlayFront.style.display = "none";
                    selectedHair = "Bald";
                }

                window.updateAppearanceContext();
            });

            popup.appendChild(bodiesSection);
            popup.appendChild(hairSection);
        }
    }

    // ================================
    // Navigation Buttons
    // ================================

    const prevBtn = document.createElement("button");
    prevBtn.innerText = "<";
    prevBtn.classList.add("nav-button");
    prevBtn.style.width = "32px";
    prevBtn.style.height = "32px";
    prevBtn.style.marginRight = "8px";
    prevBtn.addEventListener("click", () => {
        currentPage = 0;
        renderSections();
        addNavButtons();
    });

    const nextBtn = document.createElement("button");
    nextBtn.innerText = ">";
    nextBtn.classList.add("nav-button");
    nextBtn.style.width = "32px";
    nextBtn.style.height = "32px";
    nextBtn.style.marginRight = "8px";
    nextBtn.addEventListener("click", () => {
        currentPage = 1;
        renderSections();
        addNavButtons();
    });

    // ================================
    // Navigation Button Container
    // ================================

    function addNavButtons() {
        let navContainer = document.getElementById("nav-container");
        if (navContainer) navContainer.remove();

        navContainer = document.createElement("div");
        navContainer.id = "nav-container";
        navContainer.style.display = "flex";
        navContainer.style.justifyContent = "center";
        navContainer.style.position = "absolute";
        navContainer.style.bottom = "72px";
        navContainer.style.right = "116px";

        if (currentPage === 0) {
            navContainer.appendChild(nextBtn);
        } else if (currentPage === 1) {
            navContainer.appendChild(prevBtn);
        }

        popup.appendChild(navContainer);
    }

    // ================================
    // Initial Render
    // ================================

    renderSections();
    addNavButtons();

    // ================================
    // Close Button
    // ================================

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "X";
    closeBtn.classList.add("close-button");
    closeBtn.style.width = "32px";
    closeBtn.style.height = "32px";
    closeBtn.style.position = "absolute";
    closeBtn.style.bottom = "72px";
    closeBtn.style.right = "72px";
    closeBtn.addEventListener("click", () => closePopup(popup));
    popup.appendChild(closeBtn);

});

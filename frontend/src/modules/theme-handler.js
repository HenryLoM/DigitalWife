window.addEventListener("theme-change", (e) => {
    const isDark = e.detail.isDark;
    const nightLayers = document.querySelectorAll(".night-theme-preset");
    // Change theme inside Nicole's window; Write in to global (window) variables themeContext and change time in Nicole's space
    nightLayers.forEach(layer => {
        if (isDark) {
            layer.classList.add("active");
            window.themeContext = "Currently it is dark in the website, you have a night time in the locations";
            window.isDark = true;
        } else {
            layer.classList.remove("active");
            window.themeContext = "Currently it is light in the website, you have a day time in the locations";
            window.isDark = false;
        }
    });
});

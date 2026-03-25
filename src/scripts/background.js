import LastFM from "./lastfm.js";

let lastfm;

// FontAwesome Icon Unicodes (Solid)
const ICONS = {
    CODE: '\uf121',
    MUSIC: '\uf001',
    HAMMER: '\uf6e3'
};

// Determine icons based on page
let pageIcons;
switch (window.location.pathname) {
    case "/code.html":
        pageIcons = [ICONS.CODE];
        break;
    case "/music.html":
        pageIcons = [ICONS.MUSIC];
        break;
    case "/create.html":
        pageIcons = [ICONS.HAMMER];
        break;
    default:
        pageIcons = [ICONS.CODE, ICONS.MUSIC, ICONS.HAMMER];
}

const ICON_SIZE = 48;
const ICON_GAP = ICON_SIZE / 2;
const GRID_SIZE = ICON_SIZE + ICON_GAP;
// Fixed width logic from original: 1.25 * iconSize
const ICON_WIDTH = ICON_SIZE * 1.25;

// Global State
let ctx;
let canvas;
let animationId;
let iconGrid = [];
let offsetX = 0;
let offsetY = 0;

// Gradient Colors State
// Matching SCSS: color.change(var.$light-color, $alpha: 0.5) -> #eeeeee is 238,238,238
const defaultColor = { r: 238, g: 238, b: 238 };
let currentColors = [
    { ...defaultColor },
    { ...defaultColor },
    { ...defaultColor }
];
let targetColors = [
    { ...defaultColor },
    { ...defaultColor },
    { ...defaultColor }
];

// Interaction State
let hoveredIcon = null;

function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

function updateColors() {
    const speed = 0.01; // Adjust for fade speed
    for (let i = 0; i < 3; i++) {
        currentColors[i].r = lerp(currentColors[i].r, targetColors[i].r, speed);
        currentColors[i].g = lerp(currentColors[i].g, targetColors[i].g, speed);
        currentColors[i].b = lerp(currentColors[i].b, targetColors[i].b, speed);
    }

    // Update CSS variables for other UI elements to fade smoothly
    const root = document.documentElement.style;
    const getRgb = (c) => `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;

    root.setProperty('--color1', getRgb(currentColors[0]));
    root.setProperty('--color2', getRgb(currentColors[1]));
    root.setProperty('--color3', getRgb(currentColors[2]));
}

function initCanvas() {
    const container = document.getElementById("background");
    if (!container) return;

    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");
    container.innerHTML = "";
    container.appendChild(canvas);

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Start Animation Loop
    animate();

    // Pause animation when the tab is not visible to save CPU/battery
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
            animationId = null;
        } else if (!animationId) {
            animate();
        }
    });
}

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Recalculate Grid
    const margin = 6;
    // Horizontal uses iconWidth (fixed width)
    const numIconsHorz = Math.floor(((window.innerWidth - (margin * 2)) - ICON_WIDTH) / (2 * GRID_SIZE)) + 1;
    // Vertical uses iconSize (height) - closer to reality
    const numIconsVert = Math.floor(((window.innerHeight - (margin * 2)) - ICON_SIZE) / (2 * GRID_SIZE)) + 1;

    if (numIconsHorz <= 0 || numIconsVert <= 0) {
        iconGrid = [];
        return;
    }

    const lastColIndex = (numIconsHorz - 1) * 2;
    const lastRowIndex = (numIconsVert - 1) * 2;
    const usedWidth = lastColIndex * GRID_SIZE + ICON_WIDTH;
    const usedHeight = lastRowIndex * GRID_SIZE + ICON_SIZE; // Use height here too

    offsetX = Math.round((window.innerWidth - usedWidth) / 2);
    // Nudge up slightly to fix visual imbalance (user reported too much space at top)
    // Subtracting ~18px (gridSize/4)
    offsetY = Math.round((window.innerHeight - usedHeight) / 2) - margin;

    // Build Grid Data
    iconGrid = [];
    let iconIndex = 0;

    // Use the same loop structure as original to maintain order
    for (let r = 0; r <= lastRowIndex; r += 2) {
        for (let c = 0; c <= lastColIndex; c += 2) {
            const x = offsetX + c * GRID_SIZE;
            const y = offsetY + r * GRID_SIZE;
            const originalIconChar = pageIcons[iconIndex % pageIcons.length];

            iconGrid.push({
                x,
                y,
                originalIcon: originalIconChar,
                currentIcon: originalIconChar
            });
            iconIndex++;
        }
    }
}

function draw() {
    if (!ctx || !canvas) return;

    // Clear Canvas
    ctx.globalCompositeOperation = "source-over"; // Reset before clearing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Icons (Destination)
    ctx.save();

    // Draw Icons Opaque White
    // This defines the "Shape" that the gradient will stick to.
    ctx.font = `900 ${ICON_SIZE}px "Font Awesome 7 Free"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFFFFF";

    // Calculate half width for centering
    const halfWidth = ICON_WIDTH / 2;

    for (const icon of iconGrid) {
        let char = icon.originalIcon;
        if (hoveredIcon) char = hoveredIcon;
        // Draw at center of the grid "cell"
        ctx.fillText(char, icon.x + halfWidth, icon.y + halfWidth);
    }

    // 2. Set Composite Operation to Draw Gradient ATOP Icons
    // "source-atop": New shapes (Gradient) are drawn only where they overlap the existing content (Icons).
    ctx.globalCompositeOperation = "source-atop";

    // 3. Draw Gradient
    const w = canvas.width;
    const h = canvas.height;
    const animDuration = 10000;
    const progress = (Math.sin(Date.now() / (animDuration / Math.PI)) + 1) / 2;
    const translateY = (h - (2 * h)) * progress;
    const translateX = (w - (2 * w)) * 0.5;

    ctx.save();
    ctx.translate(translateX, translateY);

    const gw = w * 2;
    const gh = h * 2;

    // Helper to get RGB string
    const getRgb = (c) => `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;

    // Gradient 1
    const g1 = ctx.createRadialGradient(gw * 0.5, 0, 0, gw * 0.5, 0, gw * 0.9);
    g1.addColorStop(0, getRgb(currentColors[0]));
    g1.addColorStop(0.9, "rgba(0,0,0,0)");
    g1.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, gw, gh);

    // Gradient 2
    const g2 = ctx.createRadialGradient(gw * 0.067, gh * 0.75, 0, gw * 0.067, gh * 0.75, gw * 0.75);
    g2.addColorStop(0, getRgb(currentColors[1]));
    g2.addColorStop(0.75, "rgba(0,0,0,0)");
    g2.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, gw, gh);

    // Gradient 3
    const g3 = ctx.createRadialGradient(gw * 0.933, gh * 0.75, 0, gw * 0.933, gh * 0.75, gw * 0.75);
    g3.addColorStop(0, getRgb(currentColors[2]));
    g3.addColorStop(0.75, "rgba(0,0,0,0)");
    g3.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, gw, gh);

    ctx.restore(); // Undo translation
    ctx.restore(); // Undo ctx.save() (which holds the globalCompositeOperation)
}

function animate() {
    updateColors();
    draw();
    animationId = requestAnimationFrame(animate);
}

function hoverInteraction() {
    const triggers = document.querySelectorAll('.hover-trigger');
    const reset = () => { hoveredIcon = null; };

    // Handle bfcache restoration (e.g. back button on mobile)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            reset();
        }
    });

    triggers.forEach(trigger => {
        const targetName = trigger.dataset.iconTarget; // e.g. "fa-code"

        let targetChar = ICONS.CODE;
        if (targetName.includes("code")) targetChar = ICONS.CODE;
        if (targetName.includes("music")) targetChar = ICONS.MUSIC;
        if (targetName.includes("hammer")) targetChar = ICONS.HAMMER;

        trigger.addEventListener('mouseenter', () => {
            hoveredIcon = targetChar;
        });
        trigger.addEventListener('mouseleave', reset);
    });
}

function handleLastFMError(error) {
    console.error("Error fetching Last.fm data:", error);
}

async function setColors() {
    // Check if LastFM is ready
    if (lastfm) {
        const palette = await lastfm.getAlbumColors(3);
        // palette is [[r,g,b], ...]
        if (palette && palette.length >= 3) {
            // Update TARGET colors instead of current
            targetColors[0] = { r: palette[0][0], g: palette[0][1], b: palette[0][2] };
            targetColors[1] = { r: palette[1][0], g: palette[1][1], b: palette[1][2] };
            targetColors[2] = { r: palette[2][0], g: palette[2][1], b: palette[2][2] };

            // Also update CSS vars for other UI elements if needed
            // NOTE: We update these in the updateColors loop now for smooth fading.
            // But we do update the image immediately.
            const root = document.documentElement.style;
            root.setProperty('--image-url', `url(${lastfm.currentAlbumArtUrl})`);
        } else {
            // Revert to defaults if no colors found
            targetColors[0] = { ...defaultColor };
            targetColors[1] = { ...defaultColor };
            targetColors[2] = { ...defaultColor };

            const root = document.documentElement.style;
            root.removeProperty('--image-url');
        }
    }
}

async function createBackground() {
    // Apply cached colors immediately so the background doesn't flash on page navigation
    const cache = LastFM.loadCache();
    if (cache && cache.colors && cache.colors.length >= 3) {
        for (let i = 0; i < 3; i++) {
            currentColors[i] = { r: cache.colors[i][0], g: cache.colors[i][1], b: cache.colors[i][2] };
            targetColors[i] = { r: cache.colors[i][0], g: cache.colors[i][1], b: cache.colors[i][2] };
        }
        if (cache.albumArtUrl) {
            document.documentElement.style.setProperty('--image-url', `url(${cache.albumArtUrl})`);
        }
    }

    // Start font loading and LastFM initialization in parallel
    const fontPromise = document.fonts.load('900 48px "Font Awesome 7 Free"')
        .catch(e => console.warn("Font loading check failed", e));

    const lastfmPromise = LastFM.create()
        .then(async (lf) => {
            lastfm = lf;
            await setColors();
        })
        .catch(handleLastFMError);

    // Wait for fonts before starting canvas to avoid "blank" icons
    await fontPromise;
    initCanvas();

    // Lastfm and colors will resolve when they are ready
    await lastfmPromise;
    hoverInteraction();

    setInterval(async () => {
        if (lastfm) {
            const updateStatus = await lastfm.updateTrack();
            if (updateStatus.albumArtChanged) {
                await setColors();
            }
        } else {
            lastfm = await LastFM.create().catch(handleLastFMError);
            await setColors();
        }
    }, 10000);
}

window.addEventListener("DOMContentLoaded", createBackground);

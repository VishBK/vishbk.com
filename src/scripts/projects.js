import ColorThief from "colorthief";

const colorThief = new ColorThief();

const RESPONSIVE_WIDTH = 768; // Width at which the timeline should switch to a mobile layout.

/* ---------- Utility Functions ---------- */
const isColorLight = ([r, g, b]) =>
	((r*299 + g*587 + b*114) / 1000) > 128;

/* ---------- Card Positioning ---------- */
/**
 * Arranges cards in a centered grid layout.
 *
 * @param {NodeListOf<HTMLElement>} cards The card elements to position.
 * @param {HTMLElement} container The container to position cards within.
 */
function arrangeInGrid(cards, container) {
    if (!container || cards.length === 0) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;

    // Use a non-expanded card as the reference for grid dimensions
    const referenceCard = Array.from(cards).find(c => !c.classList.contains('expanded')) || cards[0];
    const cardWidth = referenceCard.offsetWidth;
    
    // Find the max height among all cards (excluding expanded ones if possible for safety, though height usually consistent)
    let maxCardHeight = 0;
    cards.forEach(card => {
        if (!card.classList.contains('expanded')) {
            maxCardHeight = Math.max(maxCardHeight, card.offsetHeight);
        }
    });
    // Fallback if all are expanded (unlikely) or something went wrong
    if (maxCardHeight === 0) maxCardHeight = referenceCard.offsetHeight;

    const minHorizontalGap = 40;
    const verticalGap = 40; // Kept small and fixed
    
    const maxCols = Math.floor((containerWidth + minHorizontalGap) / (cardWidth + minHorizontalGap));
    let cols = Math.max(1, Math.min(maxCols, cards.length));

    // Optimization: Prevent a single card from being alone on the last row (orphaned)
    if (cols > 1 && cards.length > 1 && cards.length % cols === 1) {
        cols--;
    }

    // Calculate dynamic horizontal gap to push cards toward the edges or distribute evenly
    const horizontalGap = Math.max(minHorizontalGap, (containerWidth - (cols * cardWidth)) / (cols + 1));
    const gridWidth = cols * cardWidth + (cols - 1) * horizontalGap;
    
    // Center the grid horizontally (X-axis)
    const startX = (containerWidth - gridWidth) / 2;
    const startY = 40; // Moderate top margin

    cards.forEach((card, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const x = startX + col * (cardWidth + horizontalGap);
        let y = startY + row * (maxCardHeight + verticalGap);

        // Organic Stagger: alternate rows and cols for a more "woven" look
        if (col % 2 !== 0) {
            y += 40;
        }
        if (row % 2 !== 0) {
            y += 20;
        }
        
        const transformValue = `translate(${x}px, ${y}px)`;
        card.style.setProperty('--initial-transform', transformValue);
    });

    // Calculate the total height needed by the grid cards.
    // Absolute children don't expand their parent, so we must set it manually.
    let maxY = 0;
    cards.forEach(card => {
        // Use the transform to find where it was placed
        const transform = card.style.getPropertyValue('--initial-transform');
        const match = transform.match(/translate\((.*)px, (.*)px\)/);
        if (match) {
            const y = parseFloat(match[2]);
            const height = card.offsetHeight || maxCardHeight;
            maxY = Math.max(maxY, y + height);
        }
    });

    // Set container height with a buffer for the drift animation (max 10px Y) and shadows
    container.style.height = `${maxY + 60}px`;
}

/* ---------- Card Colors ---------- */
function setDominantColor(card) {
    const img = card.querySelector("img");
    if (!img) return;

    const applyColor = () => {
        try {
            const color = colorThief.getColor(img);
            const textVar = isColorLight(color)
                ? "var(--dark-color-rgb)"
                : "var(--light-color-rgb)";
            card.style.setProperty("--card-bg-color", color);
            card.style.setProperty("--card-text-rgb", textVar);
        } catch (err) {
            console.error("ColorThief failed:", err);
        }
    };

    img.complete ? applyColor() : img.addEventListener("load", applyColor, { once: true });
}

/* ---------- Slideshows ---------- */
function initSlideshow(container) {
    let index = 0;
    const slides = container.querySelectorAll(".slide");
    const prev = container.querySelector(".prev");
    const next = container.querySelector(".next");
    let startX = 0;

    if (slides.length <= 1) {
        if (prev) prev.style.display = "none";
        if (next) next.style.display = "none";
        if (slides.length === 1) slides[0].classList.add("is-active");
        return;
    }

    const show = n => {
        index = Math.max(0, Math.min(n, slides.length - 1));
        slides.forEach((s, i) =>
            s.className = `slide ${i === index ? "is-active" : i < index ? "is-prev" : "is-next"}`
        );
        container.classList.toggle("is-first-slide", index === 0);
        container.classList.toggle("is-last-slide", index === slides.length - 1);
    };

    prev?.addEventListener("click", e => (e.stopPropagation(), show(index - 1)));
    next?.addEventListener("click", e => (e.stopPropagation(), show(index + 1)));

    container.addEventListener("touchstart", e => {
        if (container.closest(".project-card.expanded")) startX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener("touchend", e => {
        if (!container.closest(".project-card.expanded")) return;
        const dist = e.changedTouches[0].screenX - startX;
        if (Math.abs(dist) >= 50) show(index + (dist < 0 ? 1 : -1));
    });

    show(0);
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".project-container");
    const cards = document.querySelectorAll(".project-card");
    let zCounter = 5;  // Manages card stacking order

    cards.forEach(card => {
        card.style.animationDelay = `${-(Math.random() * 20)}s`;
        card.style.animationDuration = `${15 + Math.random() * 10}s`;
        setDominantColor(card);

        card.addEventListener("click", () => {
             const isExpanding = !card.classList.contains("expanded");
             const details = card.querySelector(".project-details");

             if (isExpanding) {
                 // OPENING:
                 // 1. Capture current drift position from the active animation
                 const style = window.getComputedStyle(card);
                 const currentTranslate = style.translate;
                 
                 let x = '0px';
                 let y = '0px';
                 if (currentTranslate && currentTranslate !== 'none') {
                     const parts = currentTranslate.split(/\s+/);
                     x = parts[0] || '0px';
                     y = parts[1] || '0px';
                 }
                 
                 // 2. Set these as CSS variables to correct the centering transform
                 card.style.setProperty('--drift-x', x);
                 card.style.setProperty('--drift-y', y);

                 // 3. Expand (CSS pauses animation and applies compensation transform)
                 card.classList.add("expanded");
                 if (details) details.style.maxHeight = details.scrollHeight + "px";
                 
                 zCounter++;
                 card.style.zIndex = zCounter;

             } else {
                 // CLOSING:
                 // 1. Keep animation paused so it doesn't jump while moving back
                 // (The class removal would otherwise resume it immediately)
                 // We rely on the fact that the animation is ALREADY paused by the class,
                 // but removing the class removes that rule. So we set it inline first.
                 card.style.animationPlayState = 'paused';
                 
                 // 2. Remove class - CSS transition moves it back to original position
                 card.classList.remove("expanded");
                 if (details) details.style.maxHeight = "0px";

                 // 3. Wait for transition to finish, then resume animation
                 const onShrinkFinish = (event) => {
                     // Wait for transform to finish (the movement back to grid)
                     if (event.target === card && event.propertyName === "transform") {
                         // Resume drifting
                         card.style.animationPlayState = ''; 
                         
                         // Clean up
                         card.style.removeProperty('--drift-x');
                         card.style.removeProperty('--drift-y');
                         card.style.removeProperty("z-index");
                         card.removeEventListener("transitionend", onShrinkFinish);
                     }
                 };
                 card.addEventListener("transitionend", onShrinkFinish);
             }

             // Handle grid layout update after size change
             const onSizeChange = (e) => {
                 if (e.target === card && (e.propertyName === "width" || e.propertyName === "max-height")) {
                     arrangeInGrid(cards, container);
                 }
             };
             card.addEventListener("transitionend", onSizeChange, { once: true });
         });
    });
    
    /**
     * Updates the layout based on the current window size.
     */
    const performLayoutUpdate = () => {
        if (window.innerWidth <= RESPONSIVE_WIDTH) {
            cards.forEach(card => {
                card.style.removeProperty('--initial-transform');
                card.style.position = '';
                card.style.left = '';
                card.style.top = '';
                
                // Keep expanded cards' height updated for mobile responsiveness
                if (card.classList.contains('expanded')) {
                    const details = card.querySelector('.project-details');
                    if (details) {
                        details.style.maxHeight = details.scrollHeight + 'px';
                    }
                }
            });
            container.style.height = '';
        } else {

            arrangeInGrid(cards, container);
            
            // Also ensure desktop expanded height is correct
            cards.forEach(card => {
                if (card.classList.contains('expanded')) {
                    const details = card.querySelector('.project-details');
                    if (details) {
                        details.style.maxHeight = details.scrollHeight + 'px';
                    }
                }
            });
        }
    };

    let resizeTimeout;
    const resizeObserver = new ResizeObserver(() => {
        // Disable transitions during resize for immediate responsiveness
        container.classList.add('is-resizing');

        requestAnimationFrame(() => {
            performLayoutUpdate();
            
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                container.classList.remove('is-resizing');
            }, 150);
        });
    });
    /**
     * Initializes the layout. 
     * Renders immediately and updates as images load.
     */
    const initLayout = () => {
        // 1. Initial layout pass immediately (even if images aren't ready)
        performLayoutUpdate();
        
        // 2. Add 'is-ready' to show the cards (fade in)
        container.classList.add('is-ready');
        
        // 3. Listen for image loads to re-calculate layout if dimensions change
        cards.forEach(card => {
             const img = card.querySelector('.slide:first-child img');
             if (img && !img.complete) {
                 img.addEventListener('load', () => {
                     requestAnimationFrame(performLayoutUpdate);
                 }, { once: true });
             }
        });

        // 4. Start observing for container changes (resize)
        resizeObserver.observe(container);
    };

    // Begin
    initLayout();

    document.querySelectorAll(".slideshow-container").forEach(initSlideshow);
});

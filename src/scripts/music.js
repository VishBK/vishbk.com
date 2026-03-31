/**
 * @file music.js
 * @description Displays the Tableau dashboard, concert list, currently playing track, and images of concerts.
 * It changes the color of the shadows based on the album art.
 */

import LastFM from "./lastfm.js";

const RESPONSIVE_WIDTH = 1024; // Width at which the layout should switch to a mobile stack.
// Concert images
const IMAGE_LIST = [
    { "artist": "Clipse", "date": "09/08/2025", "image": new URL("../images/music/Clipse.png?as=avif", import.meta.url) },
    { "artist": "clipping.", "date": "08/08/2025", "image": new URL("../images/music/clipping.png?as=avif", import.meta.url) },
    { "artist": "The Weeknd", "date": "05/30/2025", "image": new URL("../images/music/TheWeeknd.jpg?as=avif", import.meta.url) },
    { "artist": "The Weeknd", "date": "05/30/2025", "image": new URL("../images/music/TheWeeknd2.png?as=avif", import.meta.url) },
    { "artist": "Hans Zimmer", "date": "09/22/2024", "image": new URL("../images/music/HansZimmer.jpg?as=avif", import.meta.url) },
    { "artist": "Hans Zimmer", "date": "09/22/2024", "image": new URL("../images/music/HansZimmer2.png?as=avif", import.meta.url) },
    { "artist": "JPEGMAFIA", "date": "09/06/2024", "image": new URL("../images/music/JPEGMAFIA2.jpg?as=avif", import.meta.url) },
    { "artist": "Childish Gambino", "date": "09/02/2024", "image": new URL("../images/music/ChildishGambino.jpg?as=avif", import.meta.url) },
    { "artist": "ScHoolboy Q", "date": "07/26/2024", "image": new URL("../images/music/ScHoolboyQ.jpg?as=avif", import.meta.url) },
    { "artist": "Travis Scott", "date": "11/08/2023", "image": new URL("../images/music/TravisScott.jpg?as=avif", import.meta.url) },
    { "artist": "Run the Jewels", "date": "10/04/2023", "image": new URL("../images/music/RunTheJewels.jpg?as=avif", import.meta.url) },
    { "artist": "Death Grips", "date": "09/26/2023", "image": new URL("../images/music/DeathGrips.jpg?as=avif", import.meta.url) },
    { "artist": "JPEGMAFIA & Danny Brown", "date": "08/17/2023", "image": new URL("../images/music/JPEGDanny.jpg?as=avif", import.meta.url) },
    { "artist": "M83", "date": "04/19/2023", "image": new URL("../images/music/M83.jpg?as=avif", import.meta.url) },
    { "artist": "Kid Cudi", "date": "09/06/2022", "image": new URL("../images/music/KidCudi.png?as=avif", import.meta.url) },
    { "artist": "Pusha T", "date": "06/07/2022", "image": new URL("../images/music/PushaT.png?as=avif", import.meta.url) },
    { "artist": "JPEGMAFIA", "date": "11/09/2021", "image": new URL("../images/music/JPEGMAFIA.jpg?as=avif", import.meta.url) },
    { "artist": "Kanye West", "date": "08/26/2021", "image": new URL("../images/music/Kanye.jpg?as=avif", import.meta.url) },
    { "artist": "Kanye West", "date": "08/26/2021", "image": new URL("../images/music/KanyeLine.jpg?as=avif", import.meta.url) }
];

// Initialize LastFM (singleton — shared with background.js, no duplicate API calls)
(async () => {
    try {
        const lastfm = await LastFM.create();
        updateLastFmUI(lastfm.currentTrack, lastfm.currentAlbumArtUrl);

        // Subscribe to track changes pushed by background.js's polling loop
        lastfm.onChange((track, artUrl) => {
            updateLastFmUI(track, artUrl);
        });
    } catch (e) {
        console.error("LastFM Init Error:", e);
    }
})();


// Track state for cross-fading
let activeContainerId = 'track-current';

function updateLastFmUI(track, artUrl) {
    if (!track) return;

    // Determine containers
    const currentContainer = document.getElementById(activeContainerId);
    const nextContainerId = activeContainerId === 'track-current' ? 'track-next' : 'track-current';
    const nextContainer = document.getElementById(nextContainerId);

    // 1. Update content of the HIDDEN (next) container
    const infoContainer = nextContainer.querySelector('.last-fm-info');
    const artEl = nextContainer.querySelector('.last-fm-art');

    // Reset HTML to standard structure to clear any previous marquee wrappers
    // Using &bull; for bullet point
    infoContainer.innerHTML = `
        <span class="track-name">${track.name}</span>
        <span class="separator">&bull;</span>
        <span class="artist-name">${track.artist['#text']}</span>
    `;

    // Update Image in next container
    if (artUrl) {
        artEl.src = artUrl;
        artEl.onload = () => {
            artEl.classList.add('loaded');
            // Re-check marquee once image occupies space
            checkMarquee(infoContainer);
        };
    } else {
        // Clear image if no URL
        artEl.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        artEl.classList.remove('loaded');
    }

    // 2. Perform Cross-fade
    nextContainer.classList.add('active');
    currentContainer.classList.remove('active');

    // 3. Check for Marquee needs (after making visible so we can measure)
    // We use a slight timeout/AF to ensure layout is computed. 
    // This is critical because the 'active' class transition and flex layout 
    // take a moment to settle.
    requestAnimationFrame(() => {
        checkMarquee(infoContainer);
    });

    // 4. Update Label (fade color)
    const label = document.querySelector('.last-played-label');
    if (track['@attr'] && track['@attr'].nowplaying === "true") {
        label.textContent = "Listening To";
        label.classList.add('is-playing');
    } else {
        label.textContent = "Last Played";
        label.classList.remove('is-playing');
    }

    // 5. Swap state
    activeContainerId = nextContainerId;
}

function checkMarquee(container) {
    // 1. Reset everything to original state to measure correctly
    // Stop any existing animations in the whole container (including wrapper)
    container.getAnimations({ subtree: true }).forEach(anim => anim.cancel());

    // Reset mask
    container.classList.remove('mask-active');

    // If already wrapped in a marquee (from a previous check), unwrap it to measure correctly
    const existingWrapper = container.querySelector('.marquee-wrapper');
    if (existingWrapper) {
        const group = existingWrapper.querySelector('.marquee-group');
        if (group) {
            container.innerHTML = group.innerHTML;
        }
    }

    // Measure
    const contentWidth = container.scrollWidth;
    const boxWidth = container.clientWidth;

    if (contentWidth > boxWidth) {
        // Needs marquee
        container.classList.add('mask-active');
        const contentHTML = container.innerHTML;
        const gap = 64; // 4rem = 64px approx, matching CSS

        // Wrap content
        container.innerHTML = `
            <div class="marquee-wrapper">
                <div class="marquee-group">${contentHTML}</div>
                <div class="marquee-group">${contentHTML}</div>
            </div>
        `;

        const wrapper = container.querySelector('.marquee-wrapper');
        const group = container.querySelector('.marquee-group');

        // Measure group width (real width of content)
        const groupWidth = group.offsetWidth;

        // Calculate duration: distance / speed
        // Speed = 40px/s (adjust as liked)
        const speed = 40;
        const distance = groupWidth + gap;
        const moveTime = (distance / speed) * 1000; // ms
        const pauseTime = 2000; // 2s pause
        const totalDuration = moveTime + pauseTime;

        // Calculate keyframe offset for pause
        // 0% -> 0
        // (pauseTime / totalDuration)% -> 0
        // 100% -> -distance
        const pauseOffset = pauseTime / totalDuration;

        // 1. Text Scrolling Animation
        wrapper.animate([
            { transform: 'translateX(0)', offset: 0 },
            { transform: 'translateX(0)', offset: pauseOffset },
            { transform: `translateX(-${distance}px)`, offset: 1 }
        ], {
            duration: totalDuration,
            iterations: Infinity,
            easing: 'linear'
        });

        // 2. Mask Gradient Animation
        // Goal: 
        // - Pause (0 - pauseOffset): SOLID LEFT
        // - Start Move (pauseOffset): SNAP TO FADED LEFT
        // - Moving (pauseOffset - near end): FADED LEFT
        // - End Move (near end - 1): TRANSITION TO SOLID LEFT

        // This ensures that when the scroll finishes and resets to the "Pause" state, 
        // the mask is ALREADY solid, so there is no visual snap.

        const maskSolid = 'linear-gradient(to right, black 0, black 1rem, black calc(100% - 1rem), transparent)';
        const maskFaded = 'linear-gradient(to right, transparent 0, black 1rem, black calc(100% - 1rem), transparent)';

        // Calculate a point slightly before the end to start fading back to solid
        // Let's say last 500ms of the movement
        const fadeBackDuration = 500; // ms
        const fadeBackOffset = Math.max(pauseOffset + 0.01, 1 - (fadeBackDuration / totalDuration));

        container.animate([
            { maskImage: maskSolid, webkitMaskImage: maskSolid, offset: 0 },
            { maskImage: maskSolid, webkitMaskImage: maskSolid, offset: pauseOffset },
            // Snap to faded when movement starts
            { maskImage: maskFaded, webkitMaskImage: maskFaded, offset: pauseOffset + 0.001 },
            // Stay faded until near the end
            { maskImage: maskFaded, webkitMaskImage: maskFaded, offset: fadeBackOffset },
            // Transition back to solid just before the loop resets
            { maskImage: maskSolid, webkitMaskImage: maskSolid, offset: 1 }
        ], {
            duration: totalDuration,
            iterations: Infinity,
            easing: 'linear'
        });
    }
}

const tableauViz = document.getElementById('tableauViz');
const vizContainer = document.querySelector('.viz-container');

if (tableauViz) {
    // Set device type based on initial width
    const updateDeviceType = () => {
        const isMobile = window.innerWidth <= RESPONSIVE_WIDTH;
        if (isMobile) {
            tableauViz.device = 'phone';
        } else {
            tableauViz.device = 'desktop';
        }
    };

    updateDeviceType();

    // Disable/enable scrollbars on the Tableau iframe once the viz loads
    tableauViz.addEventListener('firstinteractive', () => {
        const iframe = (tableauViz.shadowRoot || tableauViz).querySelector('iframe');
        const isMobile = window.innerWidth <= RESPONSIVE_WIDTH;
        if (isMobile) {
            if (iframe) iframe.setAttribute('scrolling', 'yes');
        } else {
            if (iframe) {
                iframe.setAttribute('scrolling', 'no');
            }
        }

        // Reveal the dashboard once it's loaded and scrollbars are removed
        tableauViz.classList.add('loaded');
    });

    // Update device type on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Use requestAnimationFrame to ensure the CSS layout pass has finished
            requestAnimationFrame(() => {
                updateDeviceType();
                const containerHeight = vizContainer.clientHeight;
                tableauViz.setAttribute('height', containerHeight + 'px');

                // Hide dashboard during re-render to avoid scrollbar flashes
                tableauViz.classList.remove('loaded');
                tableauViz.src = tableauViz.src;
            });
        }, 200);
    });
}

const marqueeOriginal = document.getElementById('marquee-original');
const marqueeDuplicate = document.getElementById('marquee-duplicate');

if (marqueeOriginal && marqueeDuplicate) {
    const backdrop = document.querySelector('.lightbox-backdrop');
    let isPaused = false;
    const pause = () => isPaused = true;
    const resume = () => {
        if (!document.querySelector('.marquee-item-clone')) {
            isPaused = false;
        }
    };

    /**
     * Opens a lightbox for the given marquee item.
     * Clones the item, animates it to the center of the viewport,
     * and sets up close/resize handlers.
     */
    const openLightbox = (wrapper) => {
        if (document.querySelector('.marquee-item-clone')) return;
        pause();

        // 1. Get initial position & create clone
        const rect = wrapper.getBoundingClientRect();
        const clone = wrapper.cloneNode(true);
        clone.classList.remove('marquee-item');
        clone.classList.add('marquee-item-clone');

        clone.style.top = `${rect.top}px`;
        clone.style.left = `${rect.left}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;

        document.body.appendChild(clone);
        document.body.classList.add('no-scroll');
        void clone.offsetWidth; // Force reflow

        wrapper.style.opacity = '0';
        backdrop.classList.add('active');

        // 2. Size the lightbox to fit the viewport, preserving aspect ratio
        const imgEl = wrapper.querySelector('img');
        const applySize = () => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const imgRatio = imgEl.naturalWidth / imgEl.naturalHeight;
            const pct = vw <= RESPONSIVE_WIDTH ? 0.90 : 0.8;
            const maxW = vw * pct;
            const maxH = vh * pct;

            // Fit to the constraining dimension in one pass
            let targetWidth = Math.min(maxW, maxH * imgRatio);
            let targetHeight = targetWidth / imgRatio;

            const targetTop = (vh - targetHeight) / 2;
            const targetLeft = (vw - targetWidth) / 2;

            // External caption on mobile when there is enough space below
            clone.classList.remove('caption-outside');
            if (vw <= RESPONSIVE_WIDTH) {
                const bottomSpace = vh - (targetTop + targetHeight);
                if (bottomSpace >= 140) {
                    clone.classList.add('caption-outside');
                }
            }

            clone.style.top = `${targetTop}px`;
            clone.style.left = `${targetLeft}px`;
            clone.style.width = `${targetWidth}px`;
            clone.style.height = `${targetHeight}px`;
        };

        applySize();
        clone.classList.add('expanded');

        // 3. Lock background scroll
        const preventScroll = (e) => e.preventDefault();
        window.addEventListener('touchmove', preventScroll, { passive: false });
        window.addEventListener('wheel', preventScroll, { passive: false });

        // 4. Responsive updates on resize
        let resizeTimeout;
        const onResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => requestAnimationFrame(applySize), 100);
        };
        window.addEventListener('resize', onResize);

        // 5. Close handler — animate back to original position, then clean up
        const closeLightbox = () => {
            window.removeEventListener('touchmove', preventScroll);
            window.removeEventListener('wheel', preventScroll);
            window.removeEventListener('resize', onResize);
            backdrop.classList.remove('active');
            clone.classList.remove('expanded');

            const newRect = wrapper.getBoundingClientRect();
            clone.style.top = `${newRect.top}px`;
            clone.style.left = `${newRect.left}px`;
            clone.style.width = `${newRect.width}px`;
            clone.style.height = `${newRect.height}px`;

            clone.addEventListener('transitionend', (e) => {
                if (e.target !== clone || e.propertyName !== 'width') return;
                clone.remove();
                wrapper.style.opacity = '';
                document.body.classList.remove('no-scroll');
                resume();
            });
        };

        clone.addEventListener('click', closeLightbox);
    };

    const createMarqueeItem = (item) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'marquee-item';
        wrapper.innerHTML = `
            <img src="${item.image}" alt="${item.artist}" crossorigin="anonymous">
            <div class="image-overlay">
                <span class="overlay-artist">${item.artist}</span>
                <span class="overlay-date">${item.date}</span>
            </div>
        `;
        wrapper.addEventListener('click', () => openLightbox(wrapper));
        return wrapper;
    };

    IMAGE_LIST.forEach(item => {
        marqueeOriginal.appendChild(createMarqueeItem(item));
        marqueeDuplicate.appendChild(createMarqueeItem(item));
    });

    // Wait for images to load before starting scroll to ensure correct height calculation
    const waitForImages = () => {
        const images = marqueeOriginal.querySelectorAll('img');
        const promises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => img.addEventListener('load', resolve));
        });
        return Promise.all(promises);
    };

    waitForImages().then(() => {
        // Transform-based infinite scroll (GPU composited, no layout thrashing)
        const mask = document.querySelector('.marquee-mask');
        const track = mask.querySelector('.marquee-track');
        const SCROLL_SPEED = 30; // px per second (frame-rate independent)
        let scrollPos = 0;
        let lastTime = 0;

        // Smooth wheel momentum
        let wheelVelocity = 0;
        const WHEEL_FRICTION = 0.9; // exponential decay per frame
        const WHEEL_MIN_VELOCITY = 0.1; // stop threshold

        // Cache horizontal state via matchMedia listener instead of polling every frame
        const mql = window.matchMedia(`(max-width: ${RESPONSIVE_WIDTH}px)`);
        let horizontal = mql.matches;
        mql.addEventListener('change', (e) => {
            horizontal = e.matches;
            recalcLoopSize();
        });

        // Cache loop size — only recalculate on resize, not every frame
        let loopSize = 0;
        const GAP = 10; // matches CSS gap
        const recalcLoopSize = () => {
            loopSize = horizontal
                ? marqueeOriginal.offsetWidth + GAP
                : marqueeOriginal.offsetHeight + GAP;
        };
        recalcLoopSize();

        // Recalculate on resize (debounced)
        let resizeRAF = null;
        window.addEventListener('resize', () => {
            if (resizeRAF) cancelAnimationFrame(resizeRAF);
            resizeRAF = requestAnimationFrame(recalcLoopSize);
        });

        // Apply transform to the track (runs on compositor — no layout/reflow)
        const applyTransform = () => {
            if (horizontal) {
                track.style.transform = `translate3d(${-scrollPos}px,0,0)`;
            } else {
                track.style.transform = `translate3d(0,${-scrollPos}px,0)`;
            }
        };

        // Wrap scroll position into [0, loopSize) for infinite loop (both directions)
        const wrapScrollPos = () => {
            if (loopSize > 0) {
                scrollPos = ((scrollPos % loopSize) + loopSize) % loopSize;
            }
        };

        let animationId = null;
        const animateScroll = (now) => {
            if (!lastTime) lastTime = now;
            const dt = Math.min(now - lastTime, 50); // cap at 50ms to avoid jumps on tab switch
            lastTime = now;

            let needsUpdate = false;

            // Auto-scroll
            if (!isPaused && loopSize > 0) {
                scrollPos += SCROLL_SPEED * (dt / 1000);
                needsUpdate = true;
            }

            // Wheel momentum (runs even when paused for manual scrolling feel)
            if (Math.abs(wheelVelocity) > WHEEL_MIN_VELOCITY) {
                scrollPos += wheelVelocity;
                wheelVelocity *= WHEEL_FRICTION;
                needsUpdate = true;
            } else {
                wheelVelocity = 0;
            }

            if (needsUpdate) {
                wrapScrollPos();
                applyTransform();
                // Re-evaluate hover when content moves under a stationary cursor
                if (mouseInMask) scheduleHoverUpdate();
            }

            animationId = requestAnimationFrame(animateScroll);
        };

        // Start animation
        animationId = requestAnimationFrame(animateScroll);

        // Pause animation when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            } else {
                if (!animationId) {
                    lastTime = performance.now(); // Reset lastTime to avoid a large dt jump
                    animationId = requestAnimationFrame(animateScroll);
                }
            }
        });

        // Pause on hover/touch (pause/resume defined at top of marquee block)

        let mouseInMask = false;

        mask.addEventListener('mouseenter', () => {
            mouseInMask = true;
            pause();
            clearHovered();
        });
        mask.addEventListener('mouseleave', () => {
            mouseInMask = false;
            resume();
            clearHovered();
        });
        let lastTouchX = 0;
        let lastTouchY = 0;
        let lastTouchTime = 0;
        let touchVelocity = 0;

        mask.addEventListener('touchstart', (e) => {
            pause();
            const touch = e.touches[0];
            lastTouchX = touch.clientX;
            lastTouchY = touch.clientY;
            lastTouchTime = e.timeStamp;
            touchVelocity = 0;
            wheelVelocity = 0; // stop existing momentum on grab
        }, { passive: true });

        mask.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            const currentX = touch.clientX;
            const currentY = touch.clientY;

            const deltaX = lastTouchX - currentX; // drag left -> shift track right -> positive scroll delta
            const deltaY = lastTouchY - currentY;
            const delta = horizontal ? deltaX : deltaY;

            // Only prevent default page scroll if they are pulling primarily along the marquee axis
            if (horizontal && Math.abs(deltaX) > Math.abs(deltaY)) {
                if (e.cancelable) e.preventDefault();
            } else if (!horizontal && Math.abs(deltaY) > Math.abs(deltaX)) {
                if (e.cancelable) e.preventDefault();
            }

            scrollPos += delta;

            const now = e.timeStamp;
            const dt = now - lastTouchTime;
            if (dt > 0) {
                const instVelocity = (delta / dt) * 16.66; // scale to pixels-per-frame (approx 60fps)
                touchVelocity = touchVelocity * 0.5 + instVelocity * 0.5; // smooth velocity
            }

            lastTouchX = currentX;
            lastTouchY = currentY;
            lastTouchTime = now;

            wrapScrollPos();
            applyTransform();
            scheduleHoverUpdate();
        }, { passive: false });

        mask.addEventListener('touchend', (e) => {
            resume();
            clearHovered();
            // If they released smoothly after moving, carry the smoothed momentum over to the wheel decay physics
            // If they held still for >100ms before releasing, stop completely
            if (e.timeStamp - lastTouchTime < 100) {
                wheelVelocity = touchVelocity;
            } else {
                wheelVelocity = 0;
            }
        });

        // Hover tracking — transforms don't trigger :hover re-evaluation,
        // so we use elementFromPoint to manage a .hovered class after wheel scroll.
        // Debounced to once-per-frame via rAF to avoid layout thrashing.
        let mouseX = 0, mouseY = 0;
        let currentHovered = null;
        let hoverRAF = null;

        const updateHovered = () => {
            const el = document.elementFromPoint(mouseX, mouseY);
            const item = el?.closest('.marquee-item');
            if (item === currentHovered) return;
            if (currentHovered) currentHovered.classList.remove('hovered');
            currentHovered = item;
            if (item) item.classList.add('hovered');
        };

        const scheduleHoverUpdate = () => {
            if (!hoverRAF) {
                hoverRAF = requestAnimationFrame(() => {
                    updateHovered();
                    hoverRAF = null;
                });
            }
        };

        const clearHovered = () => {
            if (hoverRAF) {
                cancelAnimationFrame(hoverRAF);
                hoverRAF = null;
            }
            if (currentHovered) {
                currentHovered.classList.remove('hovered');
                currentHovered = null;
            }
        };

        mask.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            scheduleHoverUpdate();
        });

        // Manual scroll via mouse wheel — feeds into momentum system
        mask.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = horizontal ? e.deltaX || e.deltaY : e.deltaY;
            wheelVelocity += delta * 0.1;
            scheduleHoverUpdate();
        }, { passive: false });
    });
}

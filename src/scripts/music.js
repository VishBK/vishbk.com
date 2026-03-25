/**
 * @file music.js
 * @description Displays the Tableau dashboard, concert list, currently playing track, and images of concerts.
 * It changes the color of the shadows based on the album art.
 */

import LastFM from "./lastfm.js";

const RESPONSIVE_WIDTH = 1024; // Width at which the layout should switch to a mobile stack.
// Concert images
const IMAGE_LIST = [
    { "artist": "Clipse", "date": "09/08/2025", "image": new URL("../images/music/Clipse.png?as=avif", import.meta.url).href },
    { "artist": "clipping.", "date": "08/08/2025", "image": new URL("../images/music/clipping.png?as=avif", import.meta.url).href },
    { "artist": "The Weeknd", "date": "05/30/2025", "image": new URL("../images/music/TheWeeknd.jpg?as=avif", import.meta.url).href },
    { "artist": "The Weeknd", "date": "05/30/2025", "image": new URL("../images/music/TheWeeknd2.png?as=avif", import.meta.url).href },
    { "artist": "Hans Zimmer", "date": "09/22/2024", "image": new URL("../images/music/HansZimmer.jpg?as=avif", import.meta.url).href },
    { "artist": "Hans Zimmer", "date": "09/22/2024", "image": new URL("../images/music/HansZimmer2.png?as=avif", import.meta.url).href },
    { "artist": "JPEGMAFIA", "date": "09/06/2024", "image": new URL("../images/music/JPEGMAFIA2.jpg?as=avif", import.meta.url).href },
    { "artist": "Childish Gambino", "date": "09/02/2024", "image": new URL("../images/music/ChildishGambino.jpg?as=avif", import.meta.url).href },
    { "artist": "ScHoolboy Q", "date": "07/26/2024", "image": new URL("../images/music/ScHoolboyQ.jpg?as=avif", import.meta.url).href },
    { "artist": "Travis Scott", "date": "11/08/2023", "image": new URL("../images/music/TravisScott.jpg?as=avif", import.meta.url).href },
    { "artist": "Run the Jewels", "date": "10/04/2023", "image": new URL("../images/music/RunTheJewels.jpg?as=avif", import.meta.url).href },
    { "artist": "Death Grips", "date": "09/26/2023", "image": new URL("../images/music/DeathGrips.jpg?as=avif", import.meta.url).href },
    { "artist": "JPEGMAFIA & Danny Brown", "date": "08/17/2023", "image": new URL("../images/music/JPEGDanny.jpg?as=avif", import.meta.url).href },
    { "artist": "M83", "date": "04/19/2023", "image": new URL("../images/music/M83.jpg?as=avif", import.meta.url).href },
    { "artist": "Kid Cudi", "date": "09/06/2022", "image": new URL("../images/music/KidCudi.png?as=avif", import.meta.url).href },
    { "artist": "Pusha T", "date": "06/07/2022", "image": new URL("../images/music/PushaT.png?as=avif", import.meta.url).href },
    { "artist": "JPEGMAFIA", "date": "11/09/2021", "image": new URL("../images/music/JPEGMAFIA.jpg?as=avif", import.meta.url).href },
    { "artist": "Kanye West", "date": "08/26/2021", "image": new URL("../images/music/Kanye.jpg?as=avif", import.meta.url).href },
    { "artist": "Kanye West", "date": "08/26/2021", "image": new URL("../images/music/KanyeLine.jpg?as=avif", import.meta.url).href }
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
        document.getElementById('last-fm-track').textContent = "Failed to load music data";
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
        label.style.color = "color-mix(in srgb, var(--color1), #d8d8d8 30%)";
        label.style.opacity = "0.9";
    } else {
        label.textContent = "Last Played";
        label.style.color = "";
        label.style.opacity = "";
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
    // console.log("MARQUEE CHECK", contentWidth, boxWidth);

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

    const createMarqueeItem = (item) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'marquee-item';

        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.artist;
        img.crossOrigin = "anonymous";

        const overlay = document.createElement('div');
        overlay.className = 'image-overlay';

        const artist = document.createElement('span');
        artist.className = 'overlay-artist';
        artist.textContent = item.artist;

        const date = document.createElement('span');
        date.className = 'overlay-date';
        date.textContent = item.date;

        overlay.appendChild(artist);
        overlay.appendChild(date);

        wrapper.appendChild(img);
        wrapper.appendChild(overlay);

        // Lightbox Click Handler
        wrapper.addEventListener('click', () => {
            // Check if already open (debouncing)
            if (document.querySelector('.marquee-item-clone')) return;

            // Pause marquee
            isPaused = true;

            // 1. Get initial position
            const rect = wrapper.getBoundingClientRect();

            // 2. Create Clone
            const clone = wrapper.cloneNode(true);
            clone.classList.remove('marquee-item');
            clone.classList.add('marquee-item-clone');

            // Set initial fixed position
            clone.style.top = `${rect.top}px`;
            clone.style.left = `${rect.left}px`;
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`; // Explicit height for transition

            document.body.appendChild(clone);
            document.body.classList.add('no-scroll');

            // 3. Force reflow
            void clone.offsetWidth;

            // Hide original
            wrapper.style.opacity = '0';

            // 4. Animate to center
            backdrop.classList.add('active');

            // Calculate center position and size respecting aspect ratio
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Get image aspect ratio
            const imgEl = wrapper.querySelector('img');
            const imgRatio = imgEl.naturalWidth / imgEl.naturalHeight;
            const viewportPercent = window.innerWidth <= RESPONSIVE_WIDTH ? 0.90 : 0.8;

            // Max viewport width or height
            const maxWidth = viewportWidth * viewportPercent;
            const maxHeight = viewportHeight * viewportPercent;

            let targetWidth, targetHeight;

            if (imgRatio > 1) {
                // Landscape
                targetWidth = Math.min(maxWidth, maxHeight * imgRatio);
                targetHeight = targetWidth / imgRatio;
            } else {
                // Portrait or Square
                targetHeight = Math.min(maxHeight, maxWidth / imgRatio);
                targetWidth = targetHeight * imgRatio;
            }

            // Ensure we don't exceed constraints (double check)
            if (targetWidth > maxWidth) {
                targetWidth = maxWidth;
                targetHeight = targetWidth / imgRatio;
            }
            if (targetHeight > maxHeight) {
                targetHeight = maxHeight;
                targetWidth = targetHeight * imgRatio;
            }

            const targetTop = (viewportHeight - targetHeight) / 2;
            const targetLeft = (viewportWidth - targetWidth) / 2;

            clone.style.top = `${targetTop}px`;
            clone.style.left = `${targetLeft}px`;
            clone.style.width = `${targetWidth}px`;
            clone.style.height = `${targetHeight}px`;
            clone.classList.add('expanded');

            // Close Handler
            const closeLightbox = () => {
                backdrop.classList.remove('active');
                clone.classList.remove('expanded');

                // Animate back to original position (which might have moved slightly if paused wasn't instant, 
                // but we paused it so it should be close). 
                // Better: simple reverse calculation if we assume it didn't move.
                clone.style.top = `${rect.top}px`;
                clone.style.left = `${rect.left}px`;
                clone.style.width = `${rect.width}px`;
                clone.style.height = `${rect.height}px`;

                // Cleanup after the CSS transition finishes
                const handleTransitionEnd = (e) => {
                    // Only act on the clone's own transition (not children bubbling up)
                    if (e.target !== clone || e.propertyName !== 'width') return;

                    clone.removeEventListener('transitionend', handleTransitionEnd);
                    clone.remove();
                    wrapper.style.opacity = ''; // Restore visibility
                    document.body.classList.remove('no-scroll');
                    isPaused = false;
                };

                clone.addEventListener('transitionend', handleTransitionEnd);

                clone.removeEventListener('click', closeLightbox);
            };

            clone.addEventListener('click', closeLightbox);
        });

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

            requestAnimationFrame(animateScroll);
        };

        // Start animation
        requestAnimationFrame(animateScroll);

        // Pause on hover/touch
        const pause = () => isPaused = true;
        const resume = () => {
            if (!document.querySelector('.marquee-item-clone')) {
                isPaused = false;
            }
        };

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
        mask.addEventListener('touchstart', pause, { passive: true });
        mask.addEventListener('touchend', resume);

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

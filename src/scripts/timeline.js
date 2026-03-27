/**
 * @file timeline.js
 * @description This script creates an interactive, responsive, chronological timeline of events from a given dataset.
 * It handles dynamic layout adjustments to prevent overlapping elements, manages expanding/collapsing event details,
 * and gracefully handles content like images that load asynchronously.
 */

/**
 * timelineData contains all the raw data for the events to be displayed on the timeline.
 * Each object represents a single event with properties like type, title, dates, and associated media.
 */
const TIMELINE_DATA = [
    {
        type: 'education', title: 'High School', place: 'University High School', start: '2014-08-18', end: '2018-05-20',
        description: "I first learned coding in my AP Computer Science class Sophomore year writing Java. \
        I also captained the chess team all four years, participated in FIRST robotics in team 4213 for two years, and earned my Eagle Scout.",
        logo: new URL('../images/career/CareerLogos/UHigh.avif', import.meta.url), images: [new URL('../images/career/FIRSTTEAM.jpg?as=avif', import.meta.url), new URL('../images/career/HighSchoolGraduation.jpg?as=avif', import.meta.url)]
    },

    {
        type: 'education', title: 'B.S. in Computer Science', place: 'University of Illinois', start: '2018-08-27', end: '2022-05-14',
        description: "Undergrad is where I gained the majority of my coding knowledge.\
        I learned everything from C++, to reinforcement learning, to compilers, and operating systems. \
        However, in my later years I focused more on AI and ML. \
        During this time, I participated in MRDC, similar to the First Robotics Competition, and the SIGPwny cybersecurity club.",
        logo: new URL('../images/career/CareerLogos/UofI.avif', import.meta.url), images: [new URL('../images/career/CypherCon.png?as=avif', import.meta.url), new URL('../images/career/UIUCGraduation.jpg?as=avif', import.meta.url)]
    },

    {
        type: 'work', title: 'Data Reporting Analyst Intern', place: 'American Family Insurance', start: '2019-05-20', end: '2019-08-16',
        description: "I worked at AmFam as a data analyst intern on the data reporting team. \
        Since this was my first work experience, I learned how a large company operates and the pros and cons that come with that. \
        My work mainly consisted of creating Tableau dashboards and using Python to replace a SAS project, while documenting and teaching coworkers without coding experience.",
        logo: new URL('../images/career/CareerLogos/AmFam.avif', import.meta.url), images: []
    },

    {
        type: 'work', title: 'Software QA Engineer', place: 'Brain Corp', start: '2021-05-24', end: '2022-06-10',
        description: "I started at Brain Corp as a summer intern, then transitioned to working full-time while finishing school. \
        As a QA Engineer, I worked with multiple teams to identify bugs in the floor cleaning robots. \
        I built out mock components and automated test cases to comply with the strict standards of robots deployed in public spaces. \
        I was fully remote for this position, but visited the office in San Diego for two weeks and enjoyed the people and location.",
        logo: new URL('../images/career/CareerLogos/BrainCorp.avif', import.meta.url), images: [new URL('../images/career/BrainCorp.jpg?as=avif', import.meta.url), new URL('../images/career/BrainCorpVolleyball.jpg?as=avif', import.meta.url)]
    },

    {
        type: 'education', title: 'M.S. in Robotics', place: 'Georgia Tech', start: '2022-08-22', end: '2024-05-04',
        description: "After completing my Bachelor's, I wanted to learn more in depth about robotics and research, so I decided to pursue a Master's. \
        The robotics program at Georgia Tech consists of choosing three focus areas (mine were perception, artificial intelligence, and human-robot interaction) and completing a capstone project in the last two semesters. \
        My capstone project was tracking the real-time state of an opponent's racket in tennis and table tennis using computer vision and an IMU.",
        logo: new URL('../images/career/CareerLogos/GeorgiaTech.avif', import.meta.url), images: [new URL('../images/career/GeorgiaTechHalloween.jpg?as=avif', import.meta.url), new URL('../images/career/GeorgiaTechGraduation.jpg?as=avif', import.meta.url)]
    },

    {
        type: 'work', title: 'Autonomy Intern', place: 'Sandia National Labs', start: '2023-05-30', end: '2024-08-09',
        description: "At Sandia, I worked as a summer intern on two different projects - \
        one being satellite image tracking with our own small observatory, and the other building a dashboard to visualize nuclear stronglink data for a QA team. \
        I enjoyed meeting and working with the interns in our department while living in Albuquerque for the summer. \
        After that summer, I worked part-time researching methods for onboard cybersecurity on satellites while finishing my Master's.",
        logo: new URL('../images/career/CareerLogos/Sandia.avif', import.meta.url), images: [new URL('../images/career/LosAlamos.jpg?as=avif', import.meta.url), new URL('../images/career/SandiaTeam.jpg?as=avif', import.meta.url)]
    },
];

/**
 * The Timeline class encapsulates all functionality for creating, managing, and rendering the interactive timeline.
 * It handles data processing, DOM manipulation, event handling, and responsive layout adjustments.
 */
class Timeline {
    // --- CONFIGURABLE CONSTANTS ---
    // These properties define the visual layout and physics of the timeline.
    EVENT_GAP = 16; // Minimum vertical gap in pixels between two consecutive events in the same column.
    PIXELS_PER_YEAR = 100; // Determines the scale of the timeline; how many pixels represent one year.
    MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25; // Milliseconds in a year, accounting for leap years.
    RESPONSIVE_WIDTH = 768; // Width at which the timeline should switch to a mobile layout.

    /**
     * Initializes the Timeline instance.
     * @param {string} containerId - The ID of the HTML element that will contain the timeline.
     * @param {Array<object>} data - The raw timeline data array.
     */
    constructor(containerId, data) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`Container with id "${containerId}" not found.`);

        // Pre-processes the raw data into a more usable format and stores it.
        this.eventsData = this._prepareData(data);

        // Calculate the total time span of all events to determine the timeline's height.
        const allDates = this.eventsData.flatMap(e => [e.startDate, e.endDate]);
        this.minDate = new Date(Math.min(...allDates));
        this.maxDate = new Date(Math.max(...allDates));
        // Add a small buffer to the start and end dates for better visual padding.
        this.minDate.setMonth(this.minDate.getMonth() - 1);
        this.maxDate.setMonth(this.maxDate.getMonth() + 1);

        // The spine should be at least as tall as its container.
        this.minTimelineHeight = ((this.maxDate - this.minDate) / this.MS_PER_YEAR) * this.PIXELS_PER_YEAR;
        this.effectiveHeight = Math.max(this.minTimelineHeight, this.container.clientHeight);
    }

    /**
     * Prepares the raw data for use by converting date strings to Date objects
     * and sorting the events chronologically.
     * @private
     * @param {Array<object>} rawData - The original timelineData array.
     * @returns {Array<object>} The processed and sorted data array.
     */
    _prepareData(rawData) {
        const eventsData = rawData.map((d, index) => ({
            ...d,
            id: index, // Assign a unique ID for easy reference.
            startDate: new Date(d.start), // Convert string to Date object.
            endDate: d.end === 'Present' ? new Date() : new Date(d.end) // Handle 'Present' case.
        }));
        // Sort events by end date, descending. This is crucial for rendering the newest events first.
        return eventsData.sort((a, b) => b.endDate - a.endDate);
    }

    /**
     * Public method to kick off the timeline creation and rendering process.
     * This is the main entry point after the class is instantiated.
     */
    init() {
        this.container.classList.add('is-loading');
        this._initDOM(); // Build the initial HTML structure
        this._addEventListeners();  // Set up event listeners for user interaction and responsiveness
    }

    /**
     * Creates and appends all the necessary DOM elements for the timeline (spine, year markers, events, duration bars).
     * @private
     */
    _initDOM() {
        // Clear any existing content to ensure a clean slate.
        this.container.innerHTML = '';

        // --- Element Creation ---
        this.container.appendChild(this._createTimelineSpine());
        this.container.appendChild(this._createDurationBars());
        this.container.appendChild(this._createEventElements());

        // Apply image aspect-ratio styling and wait for images to finish loading before measuring.
        this._setAspectRatioFlex().then(() => {
            // Apply initial overlap resolution/positioning.
            this.resolveEventOverlaps();
            // Remove the loading class after the first layout to enable transitions for interactions.
            requestAnimationFrame(() => this.container.classList.remove('is-loading'));
        });
    }

    /**
     * Constructs the central timeline spine and its year markers.
     * @private
     * @returns {DocumentFragment} A fragment containing the spine and markers.
     */
    _createTimelineSpine() {
        const spineFragment = document.createDocumentFragment();
        const totalDuration = this.maxDate - this.minDate;

        // --- Spine Creation ---
        let spineEl = this.container.querySelector('.timeline-spine');
        if (!spineEl) {
            spineEl = document.createElement('div');
            spineEl.classList.add('acrylic', 'timeline-spine');
            spineFragment.appendChild(spineEl);
        }
        spineEl.style.height = `${this.effectiveHeight}px`;

        // --- Year Marker Creation ---
        const markers = Array.from(this.container.querySelectorAll('.timeline-year-marker'));
        let maskStops = ['black 0%'];
        let sortedYears = [];

        for (let year = this.minDate.getFullYear(); year <= this.maxDate.getFullYear(); year++) {
            const yearDate = new Date(year, 0, 1);
            if (yearDate < this.minDate || yearDate > this.maxDate) continue;
            sortedYears.push(yearDate);

            // Find existing marker
            let markerEl = markers.find(m => m.textContent === String(year));
            if (!markerEl) {
                markerEl = document.createElement('div');
                markerEl.classList.add('timeline-year-marker');
                markerEl.textContent = year;
                spineFragment.appendChild(markerEl);
            }

            // Update marker position
            const topPosition = ((this.maxDate - yearDate) / totalDuration) * this.effectiveHeight;
            markerEl.style.top = `calc(${topPosition}px - 0.75rem)`; // Center vertically
        }

        sortedYears.sort((a, b) => b - a);
        for (const yearDate of sortedYears) {
            const topPosition = ((this.maxDate - yearDate) / totalDuration) * this.effectiveHeight;
            maskStops.push(`black calc(${topPosition}px - 14px)`);
            maskStops.push(`transparent calc(${topPosition}px - 14px)`);
            maskStops.push(`transparent calc(${topPosition}px + 14px)`);
            maskStops.push(`black calc(${topPosition}px + 14px)`);
        }
        maskStops.push('black 100%');
        const maskGradient = `linear-gradient(to bottom, ${maskStops.join(', ')})`;

        if (spineEl) {
            spineEl.style.setProperty('--line-mask', maskGradient);
        }

        return spineFragment;
    }

    /**
     * Creates the vertical bars that visually represent the duration of each event.
     * @private
     * @returns {DocumentFragment} A fragment containing all duration bars.
     */
    _createDurationBars() {
        const barsFragment = document.createDocumentFragment();
        const bars = Array.from(this.container.querySelectorAll('.duration-bar'));
        const totalDuration = this.maxDate - this.minDate;

        this.eventsData.forEach(eventData => {
            // Calculate the positions for the top and bottom of the duration bar
            const top = ((this.maxDate - eventData.endDate) / totalDuration) * this.effectiveHeight;
            const bottom = ((this.maxDate - eventData.startDate) / totalDuration) * this.effectiveHeight;

            // Create and position the duration bar
            let barEl = bars.find(b => b.dataset.eventId == eventData.id);
            if (!barEl) {
                barEl = document.createElement('div');
                barEl.classList.add('duration-bar', eventData.type);
                barEl.dataset.eventId = eventData.id;
                barsFragment.appendChild(barEl);
            }

            barEl.style.top = `${top}px`;
            barEl.style.height = `${bottom - top}px`;
        });

        return barsFragment;
    }

    /**
     * Creates the DOM elements for all events in the timeline.
     * @private
     * @returns {DocumentFragment} A fragment containing all event elements.
     */
    _createEventElements() {
        const eventsFragment = document.createDocumentFragment();
        const events = Array.from(this.container.querySelectorAll('.timeline-event'));
        const totalDuration = this.maxDate - this.minDate;

        this.eventsData.forEach(eventData => {
            const top = ((this.maxDate - eventData.endDate) / totalDuration) * this.effectiveHeight;

            // Create and position the event
            let eventEl = events.find(e => e.dataset.eventId == eventData.id);
            if (!eventEl) {
                eventEl = this._createEventElement(eventData);
                eventEl.dataset.eventId = eventData.id; // Link event to its data and bar
                eventsFragment.appendChild(eventEl);
            }

            eventEl.style.top = `${top}px`;
            eventEl.dataset.originalTop = top; // Store its ideal chronological position            
        });

        return eventsFragment;
    }

    /**
     * Creates a single timeline event element from its data object and attaches its specific event listeners.
     * @private
     * @param {object} eventData - The processed data for a single event.
     * @returns {HTMLElement} The fully constructed event element.
     */
    _createEventElement(eventData) {
        const dateRangeStr = `${this._formatDate(eventData.startDate)} - ${this._formatDate(eventData.endDate)}`;
        let imagesHTML = '';
        if (eventData.images && eventData.images.length > 0) {
            imagesHTML = `<div class="event-images-container">${eventData.images.map(src => `<img src="${src}">`).join('')}</div>`;
        }

        const eventEl = document.createElement('div');
        eventEl.classList.add('timeline-event', eventData.type);
        eventEl.innerHTML = `
            <div class="event-header">
                <img src="${eventData.logo}" alt="${eventData.place} logo" class="event-logo">
                <div class="event-title-group">
                    <h3>${eventData.title}</h3>
                    <p class="event-place">${eventData.place}</p>
                </div>
            </div>
            <div class="expandable-content">
                <p class="event-date-expanded">${dateRangeStr}</p>
                <div class="timeline-event-details">
                    <p>${eventData.description}</p>
                    ${imagesHTML}
                </div>
            </div>
        `;

        // --- Event-specific Listeners ---
        // Highlight the corresponding duration bar on mouse hover
        eventEl.addEventListener('mouseenter', () => {
            const eventBar = this.container.querySelector(`.duration-bar[data-event-id="${eventData.id}"]`);
            eventBar.classList.add('highlighted');
        });
        eventEl.addEventListener('mouseleave', () => {
            const eventBar = this.container.querySelector(`.duration-bar[data-event-id="${eventData.id}"]`);
            // Only remove highlight if the event is not in its expanded state
            if (!eventEl.classList.contains('expanded')) {
                eventBar.classList.remove('highlighted');
            }
        });

        eventEl.addEventListener('click', () => {
            eventEl.classList.toggle('expanded');

            // Collapse all other events to ensure only one is expanded at a time
            this.container.querySelectorAll('.timeline-event').forEach(e => {
                if (e !== eventEl) { // Don't collapse the one we just clicked
                    e.classList.remove('expanded');
                    // Unhighlight the corresponding bar
                    const barToUnhighlight = this.container.querySelector(`.duration-bar[data-event-id="${e.dataset.eventId}"]`);
                    barToUnhighlight.classList.remove('highlighted');
                }
            });
            // Recalculate all event positions after a click
            this.resolveEventOverlaps();
        });

        return eventEl;
    }

    /**
     * Handles the full layout update cycle on window resize.
     */
    updateLayout() {
        this.container.classList.add('is-resizing');
        // Recalculate all event positions after a resize
        this.effectiveHeight = Math.max(this.minTimelineHeight, this.container.clientHeight);
        this._createTimelineSpine();
        this._createDurationBars();
        this._createEventElements();
        this.resolveEventOverlaps();
        requestAnimationFrame(() => this.container.classList.remove('is-resizing'));
    }

    /**
     * Calculates and applies the vertical positions of all event elements to prevent them from overlapping.
     * This function is the core of the layout logic and is called on init, resize, and expansion.
     */
    resolveEventOverlaps() {
        const isMobile = window.matchMedia(`(max-width: ${this.RESPONSIVE_WIDTH}px)`).matches;
        let allEvents = this.container.querySelectorAll('.timeline-event');
        let columnTops = { left: 0, right: 0 }; // Tracks the bottom-most Y-coordinate for each column to stack events correctly

        allEvents.forEach(event => {
            const timelineContent = event.querySelector('.expandable-content');
            const header = event.querySelector('.event-header');

            // Dynamically measure heights to guarantee precision
            const style = window.getComputedStyle(event);
            const verticalPadding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

            // scrollHeight gives the full unclipped height of the content natively
            const trueExpandedHeight = header.offsetHeight + timelineContent.scrollHeight + verticalPadding;
            const trueCollapsedHeight = header.offsetHeight + verticalPadding;

            // Trigger the visual CSS transition by setting the maxHeight property.
            if (event.classList.contains('expanded')) {
                timelineContent.style.maxHeight = timelineContent.scrollHeight + "px";
            } else {
                timelineContent.style.maxHeight = null;
            }

            const column = (isMobile || event.classList.contains('education')) ? 'left' : 'right';
            // The new top position is the greater of its ideal chronological position 
            // or the position below the previous item in the same column
            const newTop = Math.max(columnTops[column], parseFloat(event.dataset.originalTop));
            event.style.top = `${newTop}px`;

            const isExpanded = event.classList.contains('expanded');
            const currentTotalHeight = isExpanded ? trueExpandedHeight : trueCollapsedHeight;

            // Update the column's bottom-most coordinate for the next event in that column
            columnTops[column] = newTop + currentTotalHeight + this.EVENT_GAP;
        });
    }

    /**
     * Adds global event listeners, primarily for handling window resizing.
     * @private
     */
    _addEventListeners() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            // Debounce the resize event to avoid excessive calculations.
            // The layout logic will only run 150ms after the user stops resizing the window.
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.updateLayout(), 150);
        });
    }

    /**
     * Formats a Date object into a "Month Year" string.
     * @private
     * @param {Date} date - The date to format.
     * @returns {string} The formatted date string (e.g., "August 2025").
     */
    _formatDate(date) {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    /**
     * Sets the flex-grow property on images within a flex container based on their
     * natural aspect ratio. This prevents distortion and is crucial for accurate height calculations.
     * Returns a Promise that resolves when all images have been processed.
     * @private
     * @returns {Promise<void>}
     */
    _setAspectRatioFlex() {
        const images = Array.from(this.container.querySelectorAll('.event-images-container img'));

        // If no images, resolve immediately
        if (images.length === 0) return Promise.resolve();

        const promises = images.map(img => new Promise(resolve => {
            const applyAspectRatio = () => {
                // Guard against zero dimensions (broken image)
                if (img.naturalWidth && img.naturalHeight) {
                    img.style.flexGrow = img.naturalWidth / img.naturalHeight;
                    img.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
                } else {
                    img.style.flexGrow = 1;
                }
                resolve();
            };

            // Image already loaded (cache) and dimensions available
            if (img.complete && img.naturalWidth) {
                applyAspectRatio();
            } else {
                // Wait for load or error
                img.addEventListener('load', applyAspectRatio, { once: true });
                img.addEventListener('error', () => {
                    img.style.flexGrow = 1;
                    resolve();
                }, { once: true });
            }
        }));

        return Promise.all(promises);
    }
}

// --- INITIALIZATION ---
window.addEventListener("DOMContentLoaded", () => {
    const timeline = new Timeline('timeline-body', TIMELINE_DATA);
    timeline.init();
});

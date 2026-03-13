import ColorThief from "colorthief";

const CACHE_KEY = 'lastfm_cache';

export default class LastFM {
    /**
     * The currently playing or most recent track information.
     * @type {object|null}
     */
    currentTrack = null;    
    currentAlbumArtUrl = null;

    // Singleton state
    static #instance = null;
    static #createPromise = null;

    // Private fields for internal state management.
    // Use a relative path in production, but keep the local PHP server URL for development
    #apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? "http://127.0.0.1:8000/proxy.php"
        : "/proxy.php";
    #colorThief = new ColorThief();
    #albumArt = new Image();
    #albumArtLoadPromise = null; // A promise that resolves once the album art has finished loading
    #changeListeners = []; // Callbacks notified on track changes

    /**
     * The constructor is kept minimal. Asynchronous setup is handled by the static `create` method.
     */
    constructor() {
        // Required by ColorThief to process images from other origins
        this.#albumArt.crossOrigin = 'Anonymous';
    }

    /**
     * Asynchronously creates and initializes a LastFM singleton.
     * Multiple concurrent calls share the same initialization promise and return the same instance.
     * @returns {Promise<LastFM>} A promise that resolves to the shared instance.
     */
    static async create() {
        // Return existing instance immediately if already initialized
        if (LastFM.#instance) return LastFM.#instance;

        // If initialization is in progress, wait for it
        if (LastFM.#createPromise) return LastFM.#createPromise;

        // First caller — start initialization
        LastFM.#createPromise = (async () => {
            const instance = new LastFM();
            try {
                await instance.#initialize();
                LastFM.#instance = instance;
                return instance;
            } catch (error) {
                console.error("Failed to initialize LastFM instance:", error.message);
                LastFM.#createPromise = null; // Allow retry on failure
                throw error;
            }
        })();

        return LastFM.#createPromise;
    }

    /**
     * Loads cached data from sessionStorage if available.
     * Returns the cached object or null.
     */
    static loadCache() {
        try {
            const raw = sessionStorage.getItem(CACHE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (_) { /* ignore */ }
        return null;
    }

    /**
     * Saves current state to sessionStorage for cross-page persistence.
     */
    #saveCache(colors) {
        try {
            const data = {
                albumArtUrl: this.currentAlbumArtUrl,
                track: this.currentTrack ? {
                    name: this.currentTrack.name,
                    album: this.currentTrack.album,
                    artist: this.currentTrack.artist,
                    image: this.currentTrack.image
                } : null,
                colors: colors || null,
                timestamp: Date.now()
            };
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (_) { /* storage full or unavailable */ }
    }

    async #initialize() {
        const data = await this.#fetchLastTrackData();
        this.currentTrack = data.recenttracks.track[0];
        // The new #loadAlbumArt method will handle setting the initial URL
        await this.#loadAlbumArt();
    }

    async #fetchLastTrackData() {
        const response = await fetch(this.#apiUrl);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        return await response.json();
    }

    /**
     * Loads album art for the current track.
     * @returns {Promise<boolean>} A promise resolving to `true` if new art was loaded, `false` otherwise
     */
    async #loadAlbumArt() {
        const newImageUrl = this.currentTrack.image && this.currentTrack.image[3] ? this.currentTrack.image[3]["#text"] : null;
        if (!newImageUrl) {
            console.warn("No album art URL found for the track.");
            this.currentAlbumArtUrl = null;
            this.#albumArtLoadPromise = Promise.resolve(false);
            return false;
        }
        
        // If the URL is the same, do nothing and report that the art did not change
        if (newImageUrl === this.currentAlbumArtUrl) {
            return false;
        }

        this.#albumArtLoadPromise = new Promise((resolve, reject) => {
            this.#albumArt.onload = () => {
                this.currentAlbumArtUrl = newImageUrl;
                resolve(true); // Resolve with 'true' because the art changed
            };
            this.#albumArt.onerror = () => reject(new Error(`Failed to load album art from: ${newImageUrl}`));
            this.#albumArt.src = newImageUrl;
            if (this.#albumArt.complete) {
                this.currentAlbumArtUrl = newImageUrl;
                resolve(true); // Resolve with 'true' here as well
            }
        });

        return this.#albumArtLoadPromise;
    }

    /**
     * Registers a callback to be invoked whenever the track changes.
     * @param {function} callback - Called with (currentTrack, currentAlbumArtUrl) on change.
     */
    onChange(callback) {
        this.#changeListeners.push(callback);
    }

    /**
     * Checks for a new track and updates data.
     * Notifies all registered onChange listeners if the track changed.
     * @returns {Promise<{trackChanged: boolean, albumArtChanged: boolean}>} Status object.
     */
    async updateTrack() {
        try {
            const data = await this.#fetchLastTrackData();
            const newTrack = data.recenttracks.track[0];

            const trackHasChanged = newTrack.name !== this.currentTrack.name ||
                               newTrack.album['#text'] !== this.currentTrack.album['#text'] ||
                               newTrack.artist['#text'] !== this.currentTrack.artist['#text'];

            if (trackHasChanged) {
                this.currentTrack = newTrack;
                // Capture the boolean returned by #loadAlbumArt
                const albumArtHasChanged = await this.#loadAlbumArt();
                const result = { trackChanged: true, albumArtChanged: albumArtHasChanged };
                // Notify all listeners
                for (const listener of this.#changeListeners) {
                    try { listener(this.currentTrack, this.currentAlbumArtUrl); } catch (_) {}
                }
                return result;
            }

            // If no change, return a status object indicating nothing happened.
            return { trackChanged: false, albumArtChanged: false };
        } catch (error) {
            console.error("Failed to update track:", error.message);
            return { trackChanged: false, albumArtChanged: false };
        }
    }

    /**
     * Extracts a color palette from the loaded album art.
     * @param {number} numColors - The desired number of colors in the palette.
     * @returns {Promise<Array<[number, number, number]>>} A promise resolving to an array of RGB colors.
     */
    async getAlbumColors(numColors) {
        try {
            // Awaiting this promise ensures the image is fully loaded before we access its data.
            await this.#albumArtLoadPromise;

            if (!this.currentAlbumArtUrl) return [];

            // Get the palette, defaulting to an empty array if the library returns null.
            const palette = this.#colorThief.getPalette(this.#albumArt, numColors) || [];

            // If the palette has some colors but fewer than requested, pad it by repeating the first color.
            if (palette.length > 0 && palette.length < numColors) {
                const padding = Array(numColors - palette.length).fill(palette[0]);
                const result = palette.concat(padding);
                this.#saveCache(result);
                return result;
            }

            if (palette.length > 0) {
                this.#saveCache(palette);
            }
            return palette;
        } catch (error) {
            console.error("Could not get album colors:", error.message);
            // Return an empty array on failure to prevent crashes in the code that uses this method.
            return [];
        }
    }
}
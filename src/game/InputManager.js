class InputManager {
    constructor() {
        this.keys = {}; // Store state of relevant keys

        // Use bind to ensure 'this' context is correct inside event handlers
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    init() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        console.log("InputManager initialized.");
    }

    handleKeyDown(event) {
        const key = event.key.toLowerCase();
        this.keys[key] = true;

        // Prevent default browser action for spacebar (scrolling)
        if (key === ' ') {
            event.preventDefault();
        }
        // console.log(`Key down: ${key}`);
    }

    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        this.keys[key] = false;
        // console.log(`Key up: ${key}`);
    }

    isKeyDown(key) {
        return !!this.keys[key.toLowerCase()]; // Use !! to convert undefined to false
    }

    // Call this if you need to remove listeners, e.g., on game over screen
    dispose() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}

// Export a single instance
export const inputManager = new InputManager();
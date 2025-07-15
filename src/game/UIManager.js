class UIManager {
    constructor() {
        this.ammoCountElement = null;
        this.messageAreaElement = null;
        this.messageTimeout = null;
    }

    init() {
        this.ammoCountElement = document.getElementById('ammo-count');
        this.messageAreaElement = document.getElementById('message-area');

        if (!this.ammoCountElement || !this.messageAreaElement) {
            console.error("UI elements not found!");
            return;
        }
        console.log("UIManager initialized.");
    }

    updateAmmo(count) {
        if (this.ammoCountElement) {
            this.ammoCountElement.textContent = `Ammo: ${count}`;
        }
    }

    showMessage(text, duration = 3000) {
        if (this.messageAreaElement) {
            this.messageAreaElement.textContent = text;

            // Clear previous timeout if one exists
            if (this.messageTimeout) {
                clearTimeout(this.messageTimeout);
            }

            // Set new timeout to clear the message
            if (duration > 0) {
                this.messageTimeout = setTimeout(() => {
                    this.messageAreaElement.textContent = '';
                    this.messageTimeout = null; // Reset timeout ID
                }, duration);
            }
        }
    }

    clearMessage() {
         if (this.messageAreaElement) {
             this.messageAreaElement.textContent = '';
             if (this.messageTimeout) {
                clearTimeout(this.messageTimeout);
                this.messageTimeout = null;
             }
         }
    }
}

// Export a single instance
export const uiManager = new UIManager();
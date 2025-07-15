import * as CANNON from 'cannon-es';

class PhysicsManager {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82 * 2, 0); // Adjusted gravity
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = 15; // Increased solver iterations

        // --- Deferred Removal Queue ---
        this.bodiesToRemove = [];

        // --- Materials ---
        this.groundMaterial = new CANNON.Material("groundMaterial");
        this.playerMaterial = new CANNON.Material("playerMaterial");
        this.slipperyMaterial = new CANNON.Material("slipperyMaterial"); // Example if needed later

        this.setupContactMaterials();

        console.log("PhysicsManager initialized (v3 - Deferred Removal).");
    }

    setupContactMaterials() {
        // Define interaction properties between materials
        const groundPlayerContact = new CANNON.ContactMaterial(
            this.groundMaterial,
            this.playerMaterial,
            {
                friction: 0.4,      // How much friction between player and ground
                restitution: 0.0    // --- CHANGED: No restitution (bounce) ---
            }
        );
        this.world.addContactMaterial(groundPlayerContact);

        // Example for slippery material if used later
        const playerSlipperyContact = new CANNON.ContactMaterial(
            this.playerMaterial,
            this.slipperyMaterial,
            {
                friction: 0.01, // Very low friction
                restitution: 0.2
            }
        );
        this.world.addContactMaterial(playerSlipperyContact);

         // Default contact material (for interactions not explicitly defined)
        this.world.defaultContactMaterial.friction = 0.1;
        this.world.defaultContactMaterial.restitution = 0.2;
    }


    addBody(body) {
        if (body && body instanceof CANNON.Body) {
             // Prevent adding the same body twice
             if (this.world.bodies.includes(body)) {
                 // console.warn("Attempted to add body that is already in the world.", body.userData); // Optional warning
                 return;
             }
            this.world.addBody(body);
        } else {
            console.error("Attempted to add invalid/null body to physics world:", body);
        }
    }

    // Schedule a body for removal after the physics step
    scheduleRemoval(body) {
        if (!body || !(body instanceof CANNON.Body)) {
             console.warn("Attempted to schedule removal of invalid/null body:", body);
             return;
        }
        // Avoid adding duplicates to the removal queue
        if (!this.bodiesToRemove.includes(body)) {
            // console.log("Scheduling removal for body:", body.userData?.type); // Optional log
            this.bodiesToRemove.push(body);
             // Detach listener immediately when scheduling - safer
             if (body.collisionHandler && typeof body.removeEventListener === 'function') {
                 try { body.removeEventListener('collide', body.collisionHandler); } catch(e) {/* Ignore */}
             }
        }
    }

    // Process the removal queue - called *after* world.step()
    processRemovals() {
        if (this.bodiesToRemove.length === 0) return;

        // console.log(`Processing ${this.bodiesToRemove.length} body removals.`); // Optional log
        for (const body of this.bodiesToRemove) {
            this.removeBodyInternal(body);
        }
        this.bodiesToRemove.length = 0; // Clear the queue efficiently
    }

    // Internal method to perform the actual removal
    removeBodyInternal(body) {
        if (!body || !(body instanceof CANNON.Body)) {
             console.warn("Internal remove call with invalid body:", body);
             return;
        }

        // Ensure listeners are removed (might be redundant if done in scheduleRemoval)
        if (body.collisionHandler && typeof body.removeEventListener === 'function') {
            try { body.removeEventListener('collide', body.collisionHandler); } catch(e) {/* Ignore */}
        }

        // Check if the body is actually in the world before removing
        const index = this.world.bodies.indexOf(body);
        if (index !== -1) {
            this.world.removeBody(body);
            // console.log("Removed body from physics world:", body.userData?.type); // Optional log
        } else {
            // console.warn("Attempted internal remove for body not in world (likely already processed):", body.userData?.type);
        }
    }

    // Update the physics simulation
    update(deltaTime) {
        // Use try-catch here to potentially catch the 'wakeUpAfterNarrowphase' error if it recurs
        try {
            // Step the physics world. Use fixed timestep for stability.
            // Max sub-steps (3rd arg) prevents spiral of death if lagging.
            this.world.step(1 / 60, deltaTime, 3);
        } catch (e) {
            console.error("!!! ERROR during physics world step (PhysicsManager.update):", e);
            // You might want to add logic here to pause the game or attempt recovery
        }
    }
}

// Export a single instance
export const physicsManager = new PhysicsManager();
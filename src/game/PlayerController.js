import * as THREE from 'three';
import { Unicorn } from '../entities/Unicorn.js';
import { CupcakeProjectile } from '../entities/CupcakeProjectile.js';
import { uiManager } from './UIManager.js';

export class PlayerController {
    constructor(scene, physicsManager, inputManager, camera) {
        this.scene = scene; this.physicsManager = physicsManager; this.inputManager = inputManager; this.camera = camera;
        this.player = null; this.projectiles = [];
        this.gameWon = false; this.gameOver = false;
        this.shootInputHeld = false; // Prevent holding shift for continuous fire
    }

    init(startPosition = new THREE.Vector3(0, 0.5, 5)) { // Match Unicorn start Y
        if (this.player) { this.player.dispose(); }
        this.player = new Unicorn(this.scene, startPosition);
        this.projectiles = [];
        this.gameWon = false; this.gameOver = false;
        this.shootInputHeld = false;
        if (this.player.body) { this.player.body.addEventListener('collide', this.handlePlayerCollision.bind(this)); }
        else { console.error("Player body not created!"); }
        uiManager.updateAmmo(this.player.ammo);
        console.log("PlayerController initialized.");
    }

    update(deltaTime) {
        if (this.gameOver || this.gameWon) return;
        if (!this.player || !this.player.body) return;

        // Update Player (includes internal input checks for movement/jump)
        this.player.update(deltaTime, this.inputManager, this.camera);

        // --- Handle Shooting Input ---
        const shootKeyDown = this.inputManager.isKeyDown('shift');
        // console.log(`[FRAME] Shift Key Down: ${shootKeyDown}, Input Held Flag: ${this.shootInputHeld}`); // Frame-by-frame log (can be spammy)

        if (shootKeyDown) {
            if (!this.shootInputHeld) { // Fire only on the initial press this frame cycle
                 this.shootInputHeld = true;
                 console.log(`[SHOOT CTRL] Shift pressed first time. Held: ${this.shootInputHeld}. Calling player.shoot().`);

                 // Ensure player exists before calling shoot
                 if (!this.player) {
                     console.error("[SHOOT CTRL] Player object is null/undefined!");
                     return;
                 }

                 const shotData = this.player.shoot(); // Try to shoot

                 if (shotData && shotData.spawnPosition && shotData.velocity) { // Check if data is valid
                     console.log("[SHOOT CTRL] player.shoot() returned valid data:", shotData);
                     try {
                         // Check data validity again before constructor
                         if (isNaN(shotData.spawnPosition.x) || isNaN(shotData.velocity.x)) {
                              console.error("[SHOOT CTRL] shotData contains NaN before creating projectile!", shotData);
                              return; // Stop if data is bad
                         }

                         const cupcake = new CupcakeProjectile(
                             this.scene,
                             shotData.spawnPosition,
                             shotData.velocity
                         );
                         // Check if cupcake body was created successfully (might fail if inputs were bad despite checks)
                         if (cupcake.body) {
                             this.projectiles.push(cupcake);
                             uiManager.updateAmmo(this.player.ammo); // Update UI only on successful shot
                             console.log("[SHOOT CTRL] CupcakeProjectile created and pushed successfully.");
                         } else {
                              console.error("[SHOOT CTRL] Cupcake creation failed (likely bad input to constructor despite checks).");
                         }
                     } catch (e) {
                          console.error("[SHOOT CTRL] Error during CupcakeProjectile creation:", e);
                     }
                 } else {
                     console.log("[SHOOT CTRL] player.shoot() returned null or invalid data.");
                 }
            } else {
                // console.log("[SHOOT CTRL] Shift still held, shootInputHeld=true, skipping shot."); // Optional log
            }
        } else {
            // If shift is released, reset the flag
            if (this.shootInputHeld) {
                 // console.log("[SHOOT CTRL] Shift released, resetting shootInputHeld to false."); // Optional log
                 this.shootInputHeld = false;
            }
        }
        // --- End Shooting ---


        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            if (!proj || proj.shouldDestroy) {
                 proj?.destroy();
                 this.projectiles.splice(i, 1);
             } else {
                 proj.update(deltaTime);
             }
        }

         // Fall check
         if (this.player.body.position.y < -20) { this.resetPlayer(); }
    }

    handlePlayerCollision(event) {
        const other = event.body;
        if (!other || !other.userData) return;
        const type = other.userData.type;
        if (type === 'Enemy') {
            console.log('Player collided with enemy: Game Over');
            uiManager.showMessage('Game Over!', 0);
            this.gameOver = true;
            // Disable further input
            this.inputManager.dispose();
        } else if (type === 'Jewel') {
            const jewel = other.userData.entity;
            if (jewel && !jewel.isCollected) {
                jewel.collect();
                this.player.addAmmo(jewel.ammoValue);
                uiManager.updateAmmo(this.player.ammo);
            }
        } else if (type === 'TreasureChest') {
            console.log('Player reached treasure chest: You win!');
            uiManager.showMessage('You found the treasure! Congratulations!', 0);
            this.gameWon = true;
        }
    }
    resetPlayer() { /* ... (Same reset logic) ... */ }
    dispose() { /* ... (Same dispose logic) ... */ }
}
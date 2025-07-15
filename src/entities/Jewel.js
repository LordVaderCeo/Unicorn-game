import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { physicsManager } from '../game/PhysicsManager.js';

// ... (Constants and JEWEL_PROPERTIES same as before) ...
const RADIUS = 0.3;
const JEWEL_PROPERTIES = { 'yellow': { color: 0xFFFF00, ammo: 1 }, 'blue': { color: 0x00BFFF, ammo: 3 }, 'red': { color: 0xFF1493, ammo: 5 } };

export class Jewel {
    constructor(scene, position, type = 'yellow') { // ... (Same constructor logic) ...
        this.scene = scene;
        this.properties = JEWEL_PROPERTIES[type] || JEWEL_PROPERTIES['yellow'];
        this.ammoValue = this.properties.ammo;
        this.type = type;
        const geometry = new THREE.IcosahedronGeometry(RADIUS, 0);
        const material = new THREE.MeshStandardMaterial({ color: this.properties.color, emissive: this.properties.color, emissiveIntensity: 0.4, roughness: 0.1, metalness: 0.3 });
        this.mesh = new THREE.Mesh(geometry, material); this.mesh.position.copy(position); this.mesh.userData.entity = this; scene.add(this.mesh);
        const shape = new CANNON.Sphere(RADIUS);
        this.body = new CANNON.Body({ mass: 0, position: new CANNON.Vec3(position.x, position.y, position.z), shape: shape, isTrigger: true });
        this.body.userData = { entity: this, type: 'Jewel' }; physicsManager.addBody(this.body);
        this.isCollected = false; this.initialY = position.y;
    }

    update(deltaTime) { // ... (Same animation logic) ...
        if (this.mesh && !this.isCollected) { this.mesh.rotation.y += 1.5 * deltaTime; this.mesh.position.y = this.initialY + Math.sin(Date.now() * 0.002) * (RADIUS * 0.3); if (this.body) this.body.position.y = this.mesh.position.y; }
    }

    collect() {
        if (this.isCollected) return;
        // console.log(`Collecting ${this.type} jewel`); // Keep this log
        this.isCollected = true;

        // Remove visual mesh immediately
        if (this.mesh) this.scene.remove(this.mesh);
        this.mesh = null; // Clear reference

        // --- CHANGE: Schedule physics body removal ---
        if (this.body) {
            physicsManager.scheduleRemoval(this.body);
            this.body = null; // Clear reference
        }
        // --- END CHANGE ---
    }
}
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { physicsManager } from '../game/PhysicsManager.js';

// ... (Constants) ...
const BASE_RADIUS = 0.15; const BASE_HEIGHT = 0.1; const FROSTING_RADIUS = BASE_RADIUS * 0.9; const CHERRY_RADIUS = BASE_RADIUS * 0.3; const LIFETIME = 3.0;

export class CupcakeProjectile {
    constructor(scene, startPosition, velocity) {
        this.scene = scene; this.lifeTimer = LIFETIME;

        // --- Visuals ---
        this.meshGroup = new THREE.Group(); this.meshGroup.position.copy(startPosition);
        const baseGeom = new THREE.CylinderGeometry(BASE_RADIUS, BASE_RADIUS * 0.8, BASE_HEIGHT, 8); const baseMat = new THREE.MeshStandardMaterial({ color: 0xD2B48C }); const baseMesh = new THREE.Mesh(baseGeom, baseMat); baseMesh.castShadow = true; this.meshGroup.add(baseMesh);
        const frostingGeom = new THREE.SphereGeometry(FROSTING_RADIUS, 8, 6); const frostingMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 }); const frostingMesh = new THREE.Mesh(frostingGeom, frostingMat); frostingMesh.position.y = BASE_HEIGHT * 0.4; frostingMesh.castShadow = true; this.meshGroup.add(frostingMesh);
        const cherryGeom = new THREE.SphereGeometry(CHERRY_RADIUS, 6, 4); const cherryMat = new THREE.MeshStandardMaterial({ color: 0xFF0000 }); const cherryMesh = new THREE.Mesh(cherryGeom, cherryMat); cherryMesh.position.y = BASE_HEIGHT * 0.4 + FROSTING_RADIUS * 0.8; cherryMesh.castShadow = true; this.meshGroup.add(cherryMesh);
        scene.add(this.meshGroup); this.meshGroup.userData.entity = this;

        // --- Physics ---
        const physicsRadius = Math.max(BASE_RADIUS, FROSTING_RADIUS) * 1.1; const shape = new CANNON.Sphere(physicsRadius);
        // Check input values before creating body
        if (isNaN(startPosition?.x) || isNaN(velocity?.x)) {
             console.error("!!! CupcakeProjectile received NaN position or velocity!", startPosition, velocity);
             // Cannot create physics body if input is bad
             this.body = null;
             this.shouldDestroy = true; // Mark for immediate cleanup
             return; // Exit constructor early
        }
        this.body = new CANNON.Body({ mass: 0.5, position: new CANNON.Vec3(startPosition.x, startPosition.y, startPosition.z), velocity: new CANNON.Vec3(velocity.x, velocity.y, velocity.z), shape: shape, collisionResponse: true });
        this.body.userData = { entity: this, type: 'Cupcake' }; physicsManager.addBody(this.body);
        this.shouldDestroy = false; this.collisionHandler = this.handleCollision.bind(this); this.body.addEventListener('collide', this.collisionHandler);

        console.log(`[SHOOT] Cupcake constructed at (${startPosition.x.toFixed(1)},${startPosition.y.toFixed(1)},${startPosition.z.toFixed(1)}) with vel (${velocity.x.toFixed(1)},${velocity.y.toFixed(1)},${velocity.z.toFixed(1)})`); // DEBUG
    }

    update(deltaTime) { /* ... */ if (this.shouldDestroy) return; if (this.meshGroup && this.body) { this.meshGroup.position.copy(this.body.position); this.meshGroup.quaternion.copy(this.body.quaternion); } else { this.shouldDestroy = true; return; } this.lifeTimer -= deltaTime; if (this.lifeTimer <= 0) { this.shouldDestroy = true; } }
    handleCollision(event) { /* ... */ if (this.shouldDestroy) return; const otherBody = (event.body.id === this.body?.id) ? event.target : event.body; const otherType = otherBody?.userData?.type; if (otherType !== 'Player' && otherType !== 'Cupcake') { this.shouldDestroy = true; if (otherType === 'Enemy' && otherBody?.userData?.entity) { otherBody.userData.entity.takeDamage(); } } }
    destroy() { /* ... (Uses scheduleRemoval) ... */ if (this.meshGroup) this.scene.remove(this.meshGroup); this.meshGroup = null; if (this.body) { physicsManager.scheduleRemoval(this.body); this.body = null; } }
}
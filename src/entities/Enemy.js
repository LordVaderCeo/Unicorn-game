import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { physicsManager } from '../game/PhysicsManager.js';

// --- Constants & Properties ---
const ENEMY_PROPERTIES = {
    'Cow':    { baseColor: 0xFFFFFF, spotColor: 0x111111, scale: 0.8, speed: 2, health: 2, legColor: 0xFFFFFF, hoofColor: 0x555555 },
    'Bull':   { baseColor: 0x8B4513, hornColor: 0xF0E68C, scale: 1.0, speed: 3.5, health: 3, legColor: 0x8B4513, hoofColor: 0x333333 }, // Khaki horns
    'Dragon': { baseColor: 0x2E8B57, wingColor: 0xFF8C00, scale: 1.2, speed: 3, health: 5, legColor: 0x2E8B57, hoofColor: 0x444444, bellyColor: 0x90EE90 } // LightGreen belly
};
const DETECTION_RADIUS = 15;
const PATROL_RANGE = 10;
const LEG_SEGMENT_HEIGHT_RATIO = 0.4;
const LEG_RADIUS_RATIO = 0.1;

export class Enemy {
    constructor(scene, position = new THREE.Vector3(0, 0, 0), type = 'Cow') {
        this.scene = scene;
        this.properties = ENEMY_PROPERTIES[type] || ENEMY_PROPERTIES['Cow'];
        this.type = type; this.scale = this.properties.scale; this.speed = this.properties.speed; this.health = this.properties.health;
        this.size = new THREE.Vector3(1.0 * this.scale, 0.8 * this.scale, 1.6 * this.scale);

        // --- Visuals ---
        this.meshGroup = new THREE.Group();
        this.meshGroup.position.copy(position); // Origin at feet level

        // --- Materials ---
        const bodyMat = new THREE.MeshStandardMaterial({ color: this.properties.baseColor, roughness: 0.8 });
        const legMat = new THREE.MeshStandardMaterial({ color: this.properties.legColor || this.properties.baseColor, roughness: 0.8 });
        const hoofMat = new THREE.MeshStandardMaterial({ color: this.properties.hoofColor || 0x444444, roughness: 0.6 });

        // --- Body Parts Store ---
        this.bodyParts = {};

        // --- Geometry Construction ---
        const totalLegHeight = this.size.y * 0.9;
        const bodyYOffset = totalLegHeight; // Body center relative to feet
        const bodyGeom = new THREE.BoxGeometry(this.size.x, this.size.y, this.size.z);
        this.bodyParts.bodyMesh = new THREE.Mesh(bodyGeom, bodyMat); this.bodyParts.bodyMesh.position.y = bodyYOffset; this.bodyParts.bodyMesh.castShadow = true; this.bodyParts.bodyMesh.receiveShadow = true; this.meshGroup.add(this.bodyParts.bodyMesh);
        // Head
        const headSize = this.size.y * 0.9; const headGeom = new THREE.SphereGeometry(headSize / 2, 10, 8);
        this.bodyParts.headMesh = new THREE.Mesh(headGeom, bodyMat); this.bodyParts.headMesh.position.y = bodyYOffset + this.size.y * 0.2; this.bodyParts.headMesh.position.z = -this.size.z * 0.5 - headSize * 0.2; this.bodyParts.headMesh.castShadow = true; this.meshGroup.add(this.bodyParts.headMesh);
        // Legs
        this.bodyParts.legs = []; const upperLegHeight = totalLegHeight * LEG_SEGMENT_HEIGHT_RATIO; const lowerLegHeight = totalLegHeight * (1 - LEG_SEGMENT_HEIGHT_RATIO); const legRadius = this.size.x * LEG_RADIUS_RATIO;
        const legPositions = [ { x: -this.size.x * 0.4, y: totalLegHeight, z: -this.size.z * 0.35 }, { x: this.size.x * 0.4, y: totalLegHeight, z: -this.size.z * 0.35 }, { x: -this.size.x * 0.4, y: totalLegHeight, z: this.size.z * 0.35 }, { x: this.size.x * 0.4, y: totalLegHeight, z: this.size.z * 0.35 } ];
        legPositions.forEach(pos => { const legGroup = new THREE.Group(); legGroup.position.set(pos.x, pos.y, pos.z); const upperGeom = new THREE.CylinderGeometry(legRadius * 1.1, legRadius, upperLegHeight, 6); const upperMesh = new THREE.Mesh(upperGeom, legMat); upperMesh.position.y = -upperLegHeight / 2; upperMesh.castShadow = true; legGroup.add(upperMesh); const lowerGeom = new THREE.CylinderGeometry(legRadius, legRadius * 0.9, lowerLegHeight, 6); const lowerMesh = new THREE.Mesh(lowerGeom, legMat); lowerMesh.position.y = -upperLegHeight - lowerLegHeight / 2; lowerMesh.castShadow = true; legGroup.add(lowerMesh); const hoofGeom = new THREE.CylinderGeometry(legRadius * 0.9, legRadius * 1.1, lowerLegHeight * 0.3, 6); const hoofMesh = new THREE.Mesh(hoofGeom, hoofMat); hoofMesh.position.y = -upperLegHeight - lowerLegHeight - (lowerLegHeight * 0.15); hoofMesh.castShadow = true; legGroup.add(hoofMesh); this.meshGroup.add(legGroup); this.bodyParts.legs.push(legGroup); });

        // Add type-specific details
        this.addDetails(this.bodyParts.headMesh, this.bodyParts.bodyMesh);

        scene.add(this.meshGroup); this.meshGroup.userData.entity = this;

        // --- Physics ---
        const shape = new CANNON.Box(new CANNON.Vec3(this.size.x / 2, this.size.y / 2, this.size.z / 2));
        const bodyCenterY = position.y + this.size.y / 2;
        this.body = new CANNON.Body({ mass: 80 * this.scale, position: new CANNON.Vec3(position.x, bodyCenterY, position.z), shape: shape, material: physicsManager.groundMaterial, linearDamping: 0.6, angularDamping: 0.95 });
        this.body.angularFactor.set(0, 1, 0); this.body.userData = { entity: this, type: 'Enemy' }; physicsManager.addBody(this.body);

        // --- State ---
        this.state = 'patrol'; this.patrolTarget = this.getRandomPatrolPoint(this.body.position);
        this.isDestroyed = false; this.originalColor = new THREE.Color(this.properties.baseColor); this.flashTimeout = null;
        this.isMoving = false; this.animationTime = Math.random() * 10;

        this.collisionHandler = () => {}; this.body.addEventListener('collide', this.collisionHandler);
    }

    addDetails(headMesh, bodyMesh) { // RESTORED Detail Logic
        const headSize = headMesh.geometry.parameters.radius * 2;
        if (this.type === 'Cow' && this.properties.spotColor) { const spotMat = new THREE.MeshStandardMaterial({ color: this.properties.spotColor, roughness: 0.9 }); for (let i = 0; i < 7; i++) { const spotGeom = new THREE.SphereGeometry(this.size.x * (0.05 + Math.random()*0.1), 6, 4); const spotMesh = new THREE.Mesh(spotGeom, spotMat); const axis = Math.floor(Math.random() * 3); const side = Math.random() < 0.5 ? -1 : 1; spotMesh.position.set( axis === 0 ? side * this.size.x * 0.51 : (Math.random() - 0.5) * this.size.x * 0.8, axis === 1 ? side * this.size.y * 0.51 : (Math.random() - 0.5) * this.size.y * 0.8, axis === 2 ? side * this.size.z * 0.51 : (Math.random() - 0.5) * this.size.z * 0.8 ); bodyMesh.add(spotMesh); } }
        else if (this.type === 'Bull' && this.properties.hornColor) { const hornMat = new THREE.MeshStandardMaterial({ color: this.properties.hornColor, roughness: 0.7 }); const hornGeom = new THREE.ConeGeometry(headSize * 0.2, headSize * 0.7, 6); const hornL = new THREE.Mesh(hornGeom, hornMat); hornL.position.set(-headSize * 0.4, headSize * 0.35, -headSize * 0.2); hornL.rotation.z = -Math.PI / 4; hornL.rotation.x = -Math.PI / 8; headMesh.add(hornL); const hornR = new THREE.Mesh(hornGeom, hornMat); hornR.position.set(headSize * 0.4, headSize * 0.35, -headSize * 0.2); hornR.rotation.z = Math.PI / 4; hornR.rotation.x = -Math.PI / 8; headMesh.add(hornR); }
        else if (this.type === 'Dragon') { const wingMat = new THREE.MeshStandardMaterial({ color: this.properties.wingColor, roughness: 0.6, side: THREE.DoubleSide }); const wingShape = new THREE.Shape(); const w = this.size.z * 0.9; const h = this.size.y * 1.4; wingShape.moveTo(0, 0); wingShape.bezierCurveTo(w*0.3, h*0.2, w*0.7, h*0.8, w, h*0.6); wingShape.bezierCurveTo(w*0.8, h*1.1, w*0.3, h*1.2, 0, h*0.9); wingShape.lineTo(0,0); const wingGeom = new THREE.ShapeGeometry(wingShape, 8); const wingYOffset = this.size.y * 0.9; const wingL = new THREE.Mesh(wingGeom, wingMat); wingL.position.set(-this.size.x * 0.4, wingYOffset, 0); wingL.rotation.y = -Math.PI / 5; wingL.rotation.z = Math.PI / 12; this.meshGroup.add(wingL); const wingR = new THREE.Mesh(wingGeom, wingMat); wingR.position.set(this.size.x * 0.4, wingYOffset, 0); wingR.rotation.y = Math.PI + Math.PI / 5; wingR.rotation.z = Math.PI / 12; this.meshGroup.add(wingR); const snoutGeom = new THREE.BoxGeometry(headSize * 0.6, headSize*0.5, headSize * 1.0); const snoutMesh = new THREE.Mesh(snoutGeom, bodyMesh.material); snoutMesh.position.z = -headSize * 0.7; headMesh.add(snoutMesh); if(this.properties.bellyColor) { const bellyMat = new THREE.MeshStandardMaterial({color: this.properties.bellyColor, roughness: 0.9}); const bellyGeom = new THREE.BoxGeometry(this.size.x * 0.6, this.size.y * 0.1, this.size.z * 0.8); const bellyMesh = new THREE.Mesh(bellyGeom, bellyMat); bellyMesh.position.y = -this.size.y * 0.45; bodyMesh.add(bellyMesh); } }
    }

    update(deltaTime, playerPosition) {
        if (this.isDestroyed || !this.body || isNaN(this.body.position.x) || isNaN(this.body.quaternion.x)) { return; }
        const physicsBottomY = this.body.position.y - this.size.y / 2;
        this.meshGroup.position.x = this.body.position.x; this.meshGroup.position.y = physicsBottomY; this.meshGroup.position.z = this.body.position.z;
        this.meshGroup.quaternion.copy(this.body.quaternion);
        const currentPos = this.body.position;
        if (!playerPosition || isNaN(playerPosition.x)) { this.state = 'patrol'; }
        else { const playerDistSq = currentPos.distanceSquared(playerPosition); this.state = (playerDistSq < DETECTION_RADIUS * DETECTION_RADIUS) ? 'chase' : 'patrol'; }
        let targetDirection = new CANNON.Vec3(); let targetSpeed = this.speed;
        if (this.state === 'chase' && playerPosition && !isNaN(playerPosition.x)) { targetDirection = playerPosition.vsub(currentPos); targetDirection.y = 0; if (targetDirection.lengthSquared() < (this.size.z*0.8)**2) { targetSpeed = 0; } }
        else { targetDirection = this.patrolTarget.vsub(currentPos); targetDirection.y = 0; if (targetDirection.lengthSquared() < 1 || isNaN(targetDirection.x)) { this.patrolTarget = this.getRandomPatrolPoint(this.body.position); targetDirection = this.patrolTarget.vsub(currentPos); targetDirection.y = 0; } }
        let applyRotation = false; this.isMoving = false;
        if (targetSpeed > 0 && targetDirection.lengthSquared() > 0.01 && !isNaN(targetDirection.x)) { targetDirection.normalize(); this.body.velocity.x = targetDirection.x * targetSpeed; this.body.velocity.z = targetDirection.z * targetSpeed; applyRotation = true; this.isMoving = true; }
        else { this.body.velocity.x *= 0.8; this.body.velocity.z *= 0.8; }
        if (applyRotation && !isNaN(targetDirection.x)) { const angle = Math.atan2(targetDirection.x, targetDirection.z) + Math.PI; const targetQuat = new CANNON.Quaternion(); targetQuat.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle); if (!isNaN(targetQuat.x)) { this.body.quaternion.slerp(targetQuat, 0.1, this.body.quaternion); this.body.quaternion.normalize(); } }
        this.animationTime += deltaTime;
        if (this.isMoving) { this.animateWalk(this.animationTime); } else { this.animateIdle(this.animationTime); }
    }

    animateIdle(time) { /* ... Same idle animation ... */
        const bobAmplitude = 0.03 * this.scale; const bobFrequency = 1.5; if (!this.bodyParts.bodyMesh) return; this.bodyParts.bodyMesh.position.y = this.size.y * 0.9 + Math.sin(time * bobFrequency) * bobAmplitude; if (this.bodyParts.legs) { this.bodyParts.legs.forEach(leg => leg.rotation.x = 0); }
    }

    animateWalk(time) { /* ... Same walk animation ... */
         const walkAmplitude = Math.PI / 7; const walkFrequency = this.speed * 1.5; const stepPhase = time * walkFrequency; if (!this.bodyParts.legs || this.bodyParts.legs.length !== 4) return; this.bodyParts.legs[0].rotation.x = Math.sin(stepPhase) * walkAmplitude; this.bodyParts.legs[3].rotation.x = Math.sin(stepPhase) * walkAmplitude; this.bodyParts.legs[1].rotation.x = Math.sin(stepPhase + Math.PI) * walkAmplitude; this.bodyParts.legs[2].rotation.x = Math.sin(stepPhase + Math.PI) * walkAmplitude; if (this.bodyParts.bodyMesh) this.bodyParts.bodyMesh.position.y = this.size.y * 0.9;
    }

    getRandomPatrolPoint(currentPosition) { /* ... */ const x = currentPosition.x + (Math.random() - 0.5) * 2 * PATROL_RANGE; const z = currentPosition.z + (Math.random() - 0.5) * 2 * PATROL_RANGE; return new CANNON.Vec3(x, currentPosition.y, z); }
    takeDamage() { /* ... */ if (this.isDestroyed) return; this.health--; if (this.meshGroup && this.bodyParts.bodyMesh) { clearTimeout(this.flashTimeout); const bodyMesh = this.bodyParts.bodyMesh; if (bodyMesh.material) { bodyMesh.material.color.setHex(0xFF0000); this.flashTimeout = setTimeout(() => { if(bodyMesh && bodyMesh.material) { bodyMesh.material.color.copy(this.originalColor); } }, 150); } } if (this.health <= 0) { this.destroy(); } }
    destroy() { /* ... (Uses scheduleRemoval) ... */ if (this.isDestroyed) return; console.log(`Enemy (${this.type}) being destroyed!`); this.isDestroyed = true; clearTimeout(this.flashTimeout); if (this.meshGroup) { this.scene.remove(this.meshGroup); this.meshGroup.traverse(child => { if (child.isMesh) { child.geometry?.dispose(); child.material?.dispose(); } }); } this.meshGroup = null; if (this.body) { physicsManager.scheduleRemoval(this.body); this.body = null; } }
}
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { physicsManager } from '../game/PhysicsManager.js';

// --- Constants --- (Same visually tweaked values)
const BODY_LENGTH = 0.8; const BODY_RADIUS = 0.32; const HEAD_RADIUS = BODY_RADIUS * 1.0; const NECK_LENGTH = BODY_RADIUS * 1.3; const LEG_UPPER_RADIUS = BODY_RADIUS * 0.25; const LEG_LOWER_RADIUS = BODY_RADIUS * 0.2; const LEG_HOOF_RADIUS = BODY_RADIUS * 0.22; const LEG_UPPER_HEIGHT = BODY_LENGTH * 0.3; const LEG_LOWER_HEIGHT = BODY_LENGTH * 0.25; const LEG_HOOF_HEIGHT = BODY_LENGTH * 0.1; const TOTAL_LEG_HEIGHT = LEG_UPPER_HEIGHT + LEG_LOWER_HEIGHT + LEG_HOOF_HEIGHT; const HORN_LENGTH = HEAD_RADIUS * 2.5; const HORN_RADIUS = HEAD_RADIUS * 0.3; const TAIL_SEGMENTS = 7; const TAIL_RADIUS_START = BODY_RADIUS * 0.3; const RAINBOW_COLORS = [ 0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x4B0082, 0x9400D3 ];
const COYOTE_TIME = 0.1; // Seconds player can jump after leaving ground

export class Unicorn {
    constructor(scene, startPosition = new THREE.Vector3(0, 0.5, 5)) {
        // ... (Constructor - Same visual setup) ...
        this.scene = scene; this.startPosition = startPosition.clone(); this.meshGroup = new THREE.Group(); this.meshGroup.position.copy(startPosition);
        const bodyMat=new THREE.MeshStandardMaterial({color:0xFF69B4,roughness:0.7,metalness:0.1}); const hornMat=new THREE.MeshStandardMaterial({color:0xFFFFE0,roughness:0.4,metalness:0.2}); const legMat=new THREE.MeshStandardMaterial({color:0xFFFFFF,roughness:0.8}); const hoofMat=new THREE.MeshStandardMaterial({color:0xB0C4DE,roughness:0.6}); const eyeMat=new THREE.MeshStandardMaterial({color:0x111111,roughness:0.1,metalness:0.1}); const pupilMat=new THREE.MeshStandardMaterial({color:0xeeeeee,roughness:0.1,metalness:0.1}); const nostrilMat=new THREE.MeshStandardMaterial({color:0x442233,roughness:0.9}); const maneMat=new THREE.MeshStandardMaterial({color:0xADD8E6,roughness:0.7,transparent:true,opacity:0.9}); this.tailMats=RAINBOW_COLORS.map(c=>new THREE.MeshStandardMaterial({color:c,roughness:0.6,metalness:0.1}));
        this.bodyParts={}; const bodyYOffset=TOTAL_LEG_HEIGHT*0.8; const bodyGeom=new THREE.CapsuleGeometry(BODY_RADIUS,BODY_LENGTH,4,12); this.bodyParts.bodyMesh=new THREE.Mesh(bodyGeom,bodyMat); this.bodyParts.bodyMesh.rotation.x=Math.PI/2; this.bodyParts.bodyMesh.position.y=bodyYOffset; this.bodyParts.bodyMesh.castShadow=true; this.meshGroup.add(this.bodyParts.bodyMesh); const neckGeom=new THREE.CylinderGeometry(BODY_RADIUS*0.9,HEAD_RADIUS*0.95,NECK_LENGTH,8); this.bodyParts.neckMesh=new THREE.Mesh(neckGeom,bodyMat); this.bodyParts.neckMesh.position.y=bodyYOffset; this.bodyParts.neckMesh.position.z=-BODY_LENGTH/2-NECK_LENGTH/2+0.05; this.bodyParts.neckMesh.rotation.x=Math.PI/6; this.meshGroup.add(this.bodyParts.neckMesh); this.bodyParts.headGroup=new THREE.Group(); this.bodyParts.headGroup.position.y=bodyYOffset+NECK_LENGTH*0.6*Math.sin(Math.PI/6); this.bodyParts.headGroup.position.z=-BODY_LENGTH/2-NECK_LENGTH*Math.cos(Math.PI/6); this.meshGroup.add(this.bodyParts.headGroup); const headGeom=new THREE.SphereGeometry(HEAD_RADIUS,16,12); const headMesh=new THREE.Mesh(headGeom,bodyMat); headMesh.castShadow=true; this.bodyParts.headGroup.add(headMesh); const snoutGeom=new THREE.BoxGeometry(HEAD_RADIUS*0.8,HEAD_RADIUS*0.7,HEAD_RADIUS*1.2); const snoutMesh=new THREE.Mesh(snoutGeom,bodyMat); snoutMesh.position.z=-HEAD_RADIUS*0.7; snoutMesh.position.y=-HEAD_RADIUS*0.1; snoutMesh.castShadow=true; this.bodyParts.headGroup.add(snoutMesh); const nostrilGeom=new THREE.SphereGeometry(HEAD_RADIUS*0.08,6,4); const nostrilL=new THREE.Mesh(nostrilGeom,nostrilMat); nostrilL.position.set(-HEAD_RADIUS*0.25,-HEAD_RADIUS*0.15,-HEAD_RADIUS*1.25); this.bodyParts.headGroup.add(nostrilL); const nostrilR=nostrilL.clone(); nostrilR.position.x=HEAD_RADIUS*0.25; this.bodyParts.headGroup.add(nostrilR); const eyeGroupL=new THREE.Group(); const eyeGeom=new THREE.SphereGeometry(HEAD_RADIUS*0.2,10,8); const eyeMeshL=new THREE.Mesh(eyeGeom,eyeMat); eyeGroupL.add(eyeMeshL); const pupilGeom=new THREE.SphereGeometry(HEAD_RADIUS*0.08,8,6); const pupilMeshL=new THREE.Mesh(pupilGeom,pupilMat); pupilMeshL.position.z=-HEAD_RADIUS*0.18; eyeGroupL.add(pupilMeshL); eyeGroupL.position.set(-HEAD_RADIUS*0.6,HEAD_RADIUS*0.25,-HEAD_RADIUS*0.4); this.bodyParts.headGroup.add(eyeGroupL); const eyeGroupR=eyeGroupL.clone(); eyeGroupR.position.x=HEAD_RADIUS*0.6; this.bodyParts.headGroup.add(eyeGroupR); this.bodyParts.eyes=[eyeGroupL,eyeGroupR]; const hornGeom=new THREE.ConeGeometry(HORN_RADIUS,HORN_LENGTH,8); this.bodyParts.hornMesh=new THREE.Mesh(hornGeom,hornMat); this.bodyParts.hornMesh.position.y=HEAD_RADIUS*0.7; this.bodyParts.hornMesh.position.z=-HEAD_RADIUS*0.2; this.bodyParts.hornMesh.rotation.x=Math.PI/16; this.bodyParts.headGroup.add(this.bodyParts.hornMesh); const earGeom=new THREE.ConeGeometry(HEAD_RADIUS*0.3,HEAD_RADIUS*0.7,6); earGeom.scale(0.5,1,0.2); this.bodyParts.earL=new THREE.Mesh(earGeom,bodyMat); this.bodyParts.earL.position.set(-HEAD_RADIUS*0.8,HEAD_RADIUS*0.6,HEAD_RADIUS*0.1); this.bodyParts.earL.rotation.z=-Math.PI/5; this.bodyParts.earL.rotation.x=Math.PI/6; this.bodyParts.headGroup.add(this.bodyParts.earL); this.bodyParts.earR=this.bodyParts.earL.clone(); this.bodyParts.earR.position.x=HEAD_RADIUS*0.8; this.bodyParts.earR.rotation.z=Math.PI/5; this.bodyParts.headGroup.add(this.bodyParts.earR); this.bodyParts.mane=[]; const maneSegmentGeom=new THREE.BoxGeometry(BODY_RADIUS*0.6,BODY_RADIUS*0.2,BODY_LENGTH*0.15); for(let i=0;i<6;i++){const maneSegment=new THREE.Mesh(maneSegmentGeom,maneMat); maneSegment.position.y=bodyYOffset+NECK_LENGTH*0.4*Math.sin(Math.PI/6)+BODY_RADIUS*0.1; maneSegment.position.z=-BODY_LENGTH/2-NECK_LENGTH/2+(i*BODY_LENGTH*0.12); maneSegment.rotation.x=-Math.PI/7*(1+i*0.1); maneSegment.rotation.z=(Math.random()-0.5)*0.1; this.meshGroup.add(maneSegment); this.bodyParts.mane.push(maneSegment);} this.bodyParts.legs=[]; const legJointGeom=new THREE.SphereGeometry(LEG_UPPER_RADIUS*0.8,6,4); const createLeg=(iF,iL)=>{const lG=new THREE.Group(); const s=iL?1:-1; const fB=iF?1:-1; lG.position.x=s*(BODY_RADIUS*0.7); lG.position.z=fB*(BODY_LENGTH/2*0.7); lG.position.y=TOTAL_LEG_HEIGHT; const uG=new THREE.CylinderGeometry(LEG_UPPER_RADIUS,LEG_LOWER_RADIUS,LEG_UPPER_HEIGHT,8); const uM=new THREE.Mesh(uG,legMat); uM.position.y=-LEG_UPPER_HEIGHT/2; uM.castShadow=true; lG.add(uM); const kJ=new THREE.Mesh(legJointGeom,hoofMat); kJ.position.y=-LEG_UPPER_HEIGHT; lG.add(kJ); const lLG=new THREE.Group(); lLG.position.y=-LEG_UPPER_HEIGHT; lG.add(lLG); const lGe=new THREE.CylinderGeometry(LEG_LOWER_RADIUS,LEG_HOOF_RADIUS*0.9,LEG_LOWER_HEIGHT,8); const lMe=new THREE.Mesh(lGe,legMat); lMe.position.y=-LEG_LOWER_HEIGHT/2; lMe.castShadow=true; lLG.add(lMe); const hJ=new THREE.Mesh(legJointGeom,hoofMat); hJ.position.y=-LEG_LOWER_HEIGHT; lLG.add(hJ); const hG=new THREE.CylinderGeometry(LEG_HOOF_RADIUS,LEG_HOOF_RADIUS*1.1,LEG_HOOF_HEIGHT,8); const hM=new THREE.Mesh(hG,hoofMat); hM.position.y=-LEG_LOWER_HEIGHT-LEG_HOOF_HEIGHT/2; hM.castShadow=true; lLG.add(hM); lG.userData={initialY:lG.position.y,lowerLegGroup:lLG}; return lG;}; this.bodyParts.legs.push(createLeg(true,true)); this.bodyParts.legs.push(createLeg(true,false)); this.bodyParts.legs.push(createLeg(false,true)); this.bodyParts.legs.push(createLeg(false,false)); this.bodyParts.legs.forEach(l=>this.meshGroup.add(l)); this.bodyParts.tailSegments=[]; const tailBaseZ=BODY_LENGTH/2*0.9; const tailSegmentLength=BODY_LENGTH*0.15; let currentTailPos=new THREE.Vector3(0,bodyYOffset,tailBaseZ); let currentAngle=-Math.PI/8; for(let i=0;i<TAIL_SEGMENTS;i++){const segRadius=TAIL_RADIUS_START*(1-i/(TAIL_SEGMENTS*1.5)); const segGeom=new THREE.SphereGeometry(segRadius,8,6); const segMat=this.tailMats[i%this.tailMats.length]; const segment=new THREE.Mesh(segGeom,segMat); segment.position.copy(currentTailPos); segment.position.y+=Math.sin(currentAngle)*tailSegmentLength; segment.position.z+=Math.cos(currentAngle)*tailSegmentLength; segment.castShadow=true; segment.userData={initialY:segment.position.y,initialZ:segment.position.z,index:i}; this.meshGroup.add(segment); this.bodyParts.tailSegments.push(segment); currentTailPos=segment.position; currentAngle-=Math.PI/24;}

        scene.add(this.meshGroup); this.meshGroup.userData.entity = this;
        const physicsHeight = BODY_LENGTH * 1.1 + NECK_LENGTH; const physicsRadius = BODY_RADIUS * 1.2;
        this.physicsShapeRadius = Math.max(physicsHeight / 2, physicsRadius) * 0.8;
        const shape = new CANNON.Sphere(this.physicsShapeRadius);
        const bodyCenterY = startPosition.y + this.physicsShapeRadius;
        this.body = new CANNON.Body({ mass: 70, position: new CANNON.Vec3(startPosition.x, bodyCenterY, startPosition.z), shape: shape, material: physicsManager.playerMaterial, linearDamping: 0.6, angularDamping: 0.9 });
        this.body.angularFactor.set(0, 1, 0); this.body.userData = { entity: this, type: 'Player' }; physicsManager.addBody(this.body);
        this.moveSpeed = 6; this.turnSpeed = 3;
        this.jumpForce = 12; // <<<--- REVERTED JUMP FORCE for velocity change ---<<<
        // this.jumpImpulse = new CANNON.Vec3(0, 0, 0); // Not needed now
        this.maxAmmo = 20; this.ammo = 10; this.isGrounded = false; this.canShoot = true; this.shootCooldown = 300;
        this.forwardDirection = new THREE.Vector3(0, 0, -1);
        this.jumpInputHeld = false; this.isMoving = false; this.animationTime = 0;
        this._deltaRotation = new CANNON.Quaternion(); this._yAxis = new CANNON.Vec3(0, 1, 0);
        this.timeSinceGrounded = 0; // <<<--- For Coyote Time ---<<<
        this.collisionHandler = this.handleCollision.bind(this); this.body.addEventListener('collide', this.collisionHandler);
        console.log("Unicorn constructor complete (v6 - Revert Jump Vel).");
    }


    update(deltaTime, inputManager, camera) {
        if (!this.body || isNaN(this.body.position.x) || isNaN(this.body.quaternion.x)) { return; }
        const physicsBottomY = this.body.position.y - this.physicsShapeRadius;
        this.meshGroup.position.x = this.body.position.x; this.meshGroup.position.y = physicsBottomY; this.meshGroup.position.z = this.body.position.z;
        this.meshGroup.quaternion.copy(this.body.quaternion);
        if (isNaN(this.meshGroup.quaternion.x)) { console.error(`!!! Visual quat NaN AFTER COPY!`); }

        this.checkGrounded(deltaTime); // Update isGrounded and timeSinceGrounded
        this.handleMovement(deltaTime, inputManager, camera); // Includes Jump check now
        this.animationTime += deltaTime;
        if (this.isMoving) { this.animateWalk(this.animationTime); } else { this.animateIdle(this.animationTime); }
        if (!inputManager.isKeyDown(' ')) { this.jumpInputHeld = false; }
    }

    handleMovement(deltaTime, inputManager, camera) {
        if (!this.body || isNaN(this.body.position.x) || isNaN(this.body.quaternion.x)) { return; }
        const moveDirectionInput = new CANNON.Vec3(0, 0, 0); let rotationAngle = 0; let isInputMoving = false;
        if (inputManager.isKeyDown('a')) { rotationAngle += this.turnSpeed * deltaTime; }
        if (inputManager.isKeyDown('d')) { rotationAngle -= this.turnSpeed * deltaTime; }
        if (rotationAngle !== 0) { const qB=this.body.quaternion; if(isNaN(qB.x)){return;} this._deltaRotation.setFromAxisAngle(this._yAxis, rotationAngle); if(isNaN(this._deltaRotation.x)){return;} this.body.quaternion.mult(this._deltaRotation, this.body.quaternion); this.body.quaternion.normalize(); const qA=this.body.quaternion; if(isNaN(qA.x)){console.error(`!!! Quat NaN AFTER rot mult!`);} }
        const currentRotation = new THREE.Quaternion().copy(this.body.quaternion); this.forwardDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(currentRotation).normalize(); if(isNaN(this.forwardDirection.x)) { console.error("!!! Fwd Dir NaN!"); }
        if (inputManager.isKeyDown('w')) { moveDirectionInput.x += this.forwardDirection.x; moveDirectionInput.z += this.forwardDirection.z; isInputMoving = true; }
        if (inputManager.isKeyDown('s')) { moveDirectionInput.x -= this.forwardDirection.x; moveDirectionInput.z -= this.forwardDirection.z; isInputMoving = true; } this.isMoving = isInputMoving;
        const targetVelocity = new CANNON.Vec3(0, this.body.velocity.y, 0);
        if (this.isMoving && !isNaN(this.forwardDirection.x)) { moveDirectionInput.normalize(); moveDirectionInput.scale(this.moveSpeed, moveDirectionInput); targetVelocity.x = moveDirectionInput.x; targetVelocity.z = moveDirectionInput.z; }
        else { targetVelocity.x = this.body.velocity.x * 0.80; targetVelocity.z = this.body.velocity.z * 0.80; }
        if (!isNaN(targetVelocity.x) && !isNaN(targetVelocity.z)) { this.body.velocity.x = targetVelocity.x; this.body.velocity.z = targetVelocity.z; } else { console.error("!!! Target velocity NaN!", targetVelocity); }

        // --- JUMPING LOGIC (Reverted to direct velocity set + Coyote Time) ---
        const canCoyoteJump = this.timeSinceGrounded < COYOTE_TIME;
        const isJumpAttempt = inputManager.isKeyDown(' ') && !this.jumpInputHeld;

        // console.log(`[JUMP TRY] Attempt:${isJumpAttempt}, Grounded:${this.isGrounded}, Coyote:${canCoyoteJump}, VelY:${this.body.velocity.y.toFixed(2)}`); // DEBUG

        if (isJumpAttempt) {
            this.jumpInputHeld = true; // Consume the input press
             // Allow jump if grounded OR within coyote time window
            if (this.isGrounded || canCoyoteJump) {
                 // Prevent jumping if already moving up quickly (prevents spam/double boost)
                if (this.body.velocity.y < this.jumpForce * 0.5) {
                    console.log(`[JUMP] Applying Jump Velocity! Grounded: ${this.isGrounded}, Coyote: ${canCoyoteJump}`);
                    this.body.velocity.y = this.jumpForce; // Set upward velocity directly
                    this.isGrounded = false; // Assume airborne
                    this.timeSinceGrounded = COYOTE_TIME; // Immediately end coyote time after jump
                } else {
                    console.log(`[JUMP] Jump key pressed but already moving up fast (VelY: ${this.body.velocity.y.toFixed(2)}), skipping.`);
                }
            } else {
                 console.log("[JUMP] Jump attempted but not grounded and coyote time expired.");
            }
        }
        // --- End Jumping ---

        // --- SHOOTING LOGIC (Keep logs from previous version) ---
        // No functional changes here, just confirming logs are present if needed
        if (inputManager.isKeyDown('shift')) {
             // console.log("[SHOOT] Shift key detected in handleMovement."); // Optional log
        }
    }

    checkGrounded(deltaTime) {
        // Raycast origin: Start slightly above the absolute bottom of the physics sphere
        const rayOrigin = new CANNON.Vec3().copy(this.body.position);
        // Cast ray downwards from body center by physicsShapeRadius + small buffer
        const rayLength = this.physicsShapeRadius + 0.05;
        const rayEnd = new CANNON.Vec3(rayOrigin.x, rayOrigin.y - rayLength, rayOrigin.z);
        const options = { skipBackfaces: true, collisionFilterMask: -1, collisionFilterGroup: ~1 };
        const result = new CANNON.RaycastResult();
        const wasGrounded = this.isGrounded;

        this.isGrounded = physicsManager.world.raycastClosest(rayOrigin, rayEnd, options, result);
        if (this.isGrounded && result.body === this.body) { this.isGrounded = false; }

        // Update Coyote Time Timer
        if (this.isGrounded) {
            this.timeSinceGrounded = 0;
            if (!wasGrounded && Math.abs(this.body.velocity.y) < 1.0) {
                // console.log(`[GROUND] Landed & Settled!`); // DEBUG
                this.jumpInputHeld = false; // Reset jump held only when settled
            }
        } else {
            this.timeSinceGrounded += deltaTime; // Increment timer while airborne
        }
         // Periodic log
         // if (Math.random() < 0.02) console.log(`[GROUND] Grounded: ${this.isGrounded}, CoyoteT: ${this.timeSinceGrounded.toFixed(2)}, VelY: ${this.body.velocity.y.toFixed(2)}`);
    }


    animateIdle(time) {
        // Tail swaying idle animation
        this.bodyParts.tailSegments.forEach(seg => {
            const phase = time * 2 + seg.userData.index * 0.6;
            seg.position.y = seg.userData.initialY + Math.sin(phase) * 0.05;
            seg.position.z = seg.userData.initialZ + Math.cos(phase) * 0.05;
        });
        // Mane flutter idle animation
        this.bodyParts.mane.forEach((seg, idx) => {
            if (seg.userData.initialRotZ === undefined) seg.userData.initialRotZ = seg.rotation.z;
            const base = seg.userData.initialRotZ;
            seg.rotation.z = base + Math.sin(time * 3 + idx) * 0.05;
        });
    }

    animateWalk(time) {
        // More pronounced tail sway while walking
        this.bodyParts.tailSegments.forEach(seg => {
            const phase = time * 4 + seg.userData.index * 0.8;
            seg.position.y = seg.userData.initialY + Math.sin(phase) * 0.1;
            seg.position.z = seg.userData.initialZ + Math.cos(phase) * 0.1;
        });
        // Mane reacts to walking
        this.bodyParts.mane.forEach((seg, idx) => {
            if (seg.userData.initialRotZ === undefined) seg.userData.initialRotZ = seg.rotation.z;
            const base = seg.userData.initialRotZ;
            seg.rotation.z = base + Math.sin(time * 5 + idx) * 0.07;
        });
    }

    // --- SHOOT Method --- (With added NaN checks and logs)
    shoot() {
        console.log(`[SHOOT CALL] Ammo: ${this.ammo}, CanShoot: ${this.canShoot}`);
        if (this.ammo > 0 && this.canShoot) {
            this.ammo--;
            this.canShoot = false;
            setTimeout(() => { this.canShoot = true; }, this.shootCooldown);
            console.log(`[SHOOT] Fired! Ammo left: ${this.ammo}. Cooldown started.`);

            if (!this.bodyParts.hornMesh || !this.bodyParts.headGroup || !this.meshGroup) { console.error("[SHOOT] Missing body parts!"); return null; }
            const hornLocalPos = this.bodyParts.hornMesh.position.clone();
            const hornTipOffset = new THREE.Vector3(0, HORN_LENGTH * 0.95, 0);
            hornTipOffset.applyQuaternion(this.bodyParts.hornMesh.quaternion);
            hornLocalPos.add(hornTipOffset);
            const worldHornTip = this.bodyParts.headGroup.localToWorld(hornLocalPos.clone());

            const shootVelocity = this.forwardDirection.clone().multiplyScalar(25);
             if(this.body && !isNaN(this.body.velocity.x)) { shootVelocity.add(new THREE.Vector3().copy(this.body.velocity)); }
             else { console.warn("[SHOOT] Player body velocity invalid."); }

            if (isNaN(worldHornTip.x) || isNaN(shootVelocity.x)) { console.error("[SHOOT] Calculated NaN spawn/velocity!", worldHornTip, shootVelocity); this.ammo++; return null; }

            console.log(`[SHOOT] Returning valid shot data. Spawn: (${worldHornTip.x.toFixed(1)}, ${worldHornTip.y.toFixed(1)}, ${worldHornTip.z.toFixed(1)})`);
            return { spawnPosition: worldHornTip, velocity: shootVelocity };

        } else {
             console.log(`[SHOOT] Cannot shoot condition not met. Ammo: ${this.ammo}, CanShoot: ${this.canShoot}`);
            return null;
        }
    }

    addAmmo(amount) { this.ammo = Math.min(this.ammo + amount, this.maxAmmo); console.log(`Collected ammo! Current: ${this.ammo}`); }
    handleCollision(event) { /* Handled by PlayerController */ }
    dispose() { /* ... */ if (this.meshGroup) this.scene.remove(this.meshGroup); if (this.body) { this.body.removeEventListener('collide', this.collisionHandler); physicsManager.scheduleRemoval(this.body); } this.meshGroup = null; this.body = null; this.bodyParts = {}; console.log("Unicorn disposed."); }
}
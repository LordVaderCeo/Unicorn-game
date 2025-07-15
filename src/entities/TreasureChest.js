import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { physicsManager } from '../game/PhysicsManager.js';

export function createTreasureChest(scene, position, size = new THREE.Vector3(0.8, 0.5, 0.6)) {

    // --- Visuals (THREE.Group) ---
    const chestGroup = new THREE.Group();
    chestGroup.position.copy(position);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 }); // Brown wood
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.6, roughness: 0.4 }); // Gold metal

    // Base Box
    const baseGeom = new THREE.BoxGeometry(size.x, size.y, size.z);
    const baseMesh = new THREE.Mesh(baseGeom, woodMat);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    chestGroup.add(baseMesh);

    // Lid (Cylinder top)
    const lidGeom = new THREE.CylinderGeometry(size.x / 2, size.x / 2, size.z, 8, 1, false, 0, Math.PI); // Half cylinder
    const lidMesh = new THREE.Mesh(lidGeom, woodMat);
    lidMesh.rotation.z = Math.PI / 2; // Rotate to align width with X
    lidMesh.scale.y = size.y / (size.x/2) * 1.2; // Scale height to match box proportion
    lidMesh.position.y = size.y / 2; // Place on top of the box base
    lidMesh.castShadow = true;
    chestGroup.add(lidMesh);

    // Metal Trim
    const trimThickness = size.y * 0.1;
    const trimHorzGeom = new THREE.BoxGeometry(size.x * 1.05, trimThickness, trimThickness); // Horizontal bands
    const trimVertGeom = new THREE.BoxGeometry(trimThickness, size.y * 1.05, trimThickness); // Vertical bands
    const trimLidGeom = new THREE.BoxGeometry(trimThickness, trimThickness * 1.1, size.z * 1.05); // Lid edge bands

    const trimFrontH = new THREE.Mesh(trimHorzGeom, metalMat); trimFrontH.position.set(0, -size.y*0.4, size.z*0.5 + trimThickness*0.5); chestGroup.add(trimFrontH);
    const trimBackH = new THREE.Mesh(trimHorzGeom, metalMat); trimBackH.position.set(0, -size.y*0.4, -size.z*0.5 - trimThickness*0.5); chestGroup.add(trimBackH);

    const trimLeftV = new THREE.Mesh(trimVertGeom, metalMat); trimLeftV.position.set(-size.x*0.5 - trimThickness*0.5, 0, size.z*0.5 + trimThickness*0.5); chestGroup.add(trimLeftV);
    const trimRightV = new THREE.Mesh(trimVertGeom, metalMat); trimRightV.position.set(size.x*0.5 + trimThickness*0.5, 0, size.z*0.5 + trimThickness*0.5); chestGroup.add(trimRightV);
    // Add more trim if desired...

    // Lock
    const lockGeom = new THREE.BoxGeometry(size.x * 0.2, size.y * 0.3, trimThickness * 1.5);
    const lockMesh = new THREE.Mesh(lockGeom, metalMat);
    lockMesh.position.set(0, 0, size.z * 0.5 + trimThickness); // On front face
    chestGroup.add(lockMesh);


    scene.add(chestGroup);
    chestGroup.userData.entity = { type: 'TreasureChest' }; // Link info


    // --- Physics (Cannon-es) ---
    // Simple trigger box matching the base is enough
    const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
    const body = new CANNON.Body({
        mass: 0, // Static
        position: new CANNON.Vec3(position.x, position.y + size.y / 2, position.z), // Center body
        shape: shape,
        isTrigger: true,
        material: physicsManager.groundMaterial
    });
    // Adjust body position UP to match the base of the visual group
    body.position.copy(position);
    body.position.y += size.y / 2;

    body.userData = { entity: { type: 'TreasureChest' }, type: 'TreasureChest' };
    physicsManager.addBody(body);

    console.log("Treasure Chest created (visually enhanced).");
    return { mesh: chestGroup, body };
}
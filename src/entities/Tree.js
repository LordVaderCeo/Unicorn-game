import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { physicsManager } from '../game/PhysicsManager.js';

export function createTree(scene, position, height = 5, radius = 0.5) {
    const trunkHeight = height * 0.7;
    const leavesCenterY = trunkHeight; // Leaves start above trunk

    // --- Visuals (Three.js Group) ---
    const treeGroup = new THREE.Group();
    treeGroup.position.copy(position);

    // Trunk (Cylinder)
    const trunkGeom = new THREE.CylinderGeometry(radius * 0.6, radius, trunkHeight, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 }); // Brown, rough
    const trunkMesh = new THREE.Mesh(trunkGeom, trunkMat);
    trunkMesh.position.y = trunkHeight / 2; // Base at group origin
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    treeGroup.add(trunkMesh);

    // Leaves (Multiple Spheres - "Fluffy" look)
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 }); // Forest Green
    const numLeafSpheres = 8 + Math.floor(Math.random() * 5); // 8-12 spheres
    const baseLeafRadius = radius * 3;

    for (let i = 0; i < numLeafSpheres; i++) {
        const leafRadius = baseLeafRadius * (0.6 + Math.random() * 0.4); // Vary size
        const leafGeom = new THREE.SphereGeometry(leafRadius, 6, 5);
        const leafMesh = new THREE.Mesh(leafGeom, leafMat);

        // Position spheres randomly in a cone-like volume above the trunk
        const angle = Math.random() * Math.PI * 2;
        const distFromCenter = Math.random() * baseLeafRadius * 0.8;
        const yOffset = Math.random() * height * 0.5; // Spread vertically

        leafMesh.position.set(
            Math.cos(angle) * distFromCenter,
            leavesCenterY + yOffset,
            Math.sin(angle) * distFromCenter
        );
        leafMesh.castShadow = true;
        treeGroup.add(leafMesh);
    }

    scene.add(treeGroup);

    // --- Physics (Cannon-es) ---
    // Simple cylinder for the trunk is sufficient for physics
    const trunkShape = new CANNON.Cylinder(radius, radius, trunkHeight, 8);
    const trunkBody = new CANNON.Body({
        mass: 0, // Static
        material: physicsManager.groundMaterial
    });
    // Add shape with offset relative to the body's position
    // Body position matches the treeGroup's position (at the base)
    // Shape needs to be centered vertically along the trunk
    trunkBody.addShape(trunkShape, new CANNON.Vec3(0, trunkHeight / 2, 0)); // Offset the shape
    trunkBody.position.copy(treeGroup.position); // Place body at group's base position
    trunkBody.userData = { type: 'Tree' };
    physicsManager.addBody(trunkBody);

    return { mesh: treeGroup, body: trunkBody };
}
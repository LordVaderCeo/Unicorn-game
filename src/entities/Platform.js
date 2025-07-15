import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { physicsManager } from '../game/PhysicsManager.js';

export function createPlatform(scene, position, size = new THREE.Vector3(4, 0.3, 2)) {

    // --- Visuals (Three.js) ---
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshStandardMaterial({
        color: 0xAAAAAA, // Lighter Stone Grey color
        roughness: 0.7   // Slightly less rough than default wood/ground
        });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type: 'Platform' };
    scene.add(mesh);

    // --- Physics (Cannon-es) ---
    const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
    const body = new CANNON.Body({
        mass: 0, // Static
        position: new CANNON.Vec3(position.x, position.y, position.z),
        shape: shape,
        material: physicsManager.groundMaterial // Use ground material for consistent friction
    });
    body.userData = { type: 'Platform' };
    physicsManager.addBody(body);

    return { mesh, body };
}
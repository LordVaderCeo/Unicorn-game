import * as THREE from 'three';
// No physics changes needed

export function createCloud(scene, position, size = 2) {

    const cloudGroup = new THREE.Group();
    // Use MeshStandardMaterial for better lighting interaction
    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF, // White
        transparent: true,
        opacity: 0.85, // Slightly less transparent
        roughness: 0.9, // Clouds aren't shiny
        emissive: 0xcccccc, // Give them a very faint self-light
        emissiveIntensity: 0.05
    });

    const numSpheres = 5 + Math.floor(Math.random() * 4); // 5-8 spheres per cloud

    for (let i = 0; i < numSpheres; i++) {
        const sphereRadius = size * (0.3 + Math.random() * 0.4); // Vary sphere sizes
        const sphereGeom = new THREE.SphereGeometry(sphereRadius, 8, 6);
        const sphereMesh = new THREE.Mesh(sphereGeom, cloudMat);

        // Position spheres randomly around the group center
        sphereMesh.position.set(
            (Math.random() - 0.5) * size * 1.2,
            (Math.random() - 0.5) * size * 0.4, // Flatter distribution vertically
            (Math.random() - 0.5) * size * 1.2
        );
        cloudGroup.add(sphereMesh);
    }


    cloudGroup.position.copy(position);
    cloudGroup.userData = { type: 'Cloud' };
    scene.add(cloudGroup);

     // Add simple horizontal drift animation data
     cloudGroup.userData.driftSpeed = (Math.random() - 0.5) * 0.5 + 0.1; // Slow drift speed/direction
     cloudGroup.userData.update = (deltaTime) => {
        cloudGroup.position.x += cloudGroup.userData.driftSpeed * deltaTime;
        // Basic wrapping (teleport) - needs world size awareness
        // if (cloudGroup.position.x > WORLD_SIZE / 2 + size) cloudGroup.position.x = -WORLD_SIZE / 2 - size;
        // if (cloudGroup.position.x < -WORLD_SIZE / 2 - size) cloudGroup.position.x = WORLD_SIZE / 2 + size;
     };


    return { mesh: cloudGroup };
}
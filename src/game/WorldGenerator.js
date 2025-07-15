import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { physicsManager } from './PhysicsManager.js';
import { noise2D } from '../utils/Noise.js';
import { createTree } from '../entities/Tree.js';
import { createPlatform } from '../entities/Platform.js';
import { createCloud } from '../entities/Cloud.js';
import { Jewel } from '../entities/Jewel.js';
import { Enemy } from '../entities/Enemy.js';
import { createTreasureChest } from '../entities/TreasureChest.js';

const WORLD_SIZE = 100; // Diameter of the playable area
const GROUND_Y = 0;

export class WorldGenerator {
    constructor() {
        this.dynamicEntities = {
            jewels: [],
            enemies: [],
            clouds: [] // <<<--- ADDED CLOUDS ARRAY
        };
        this.staticBodies = [];
        this.staticMeshes = [];
    }

    generate(scene) {
        console.log("Generating world...");
        this.clearWorld(scene); // Clear previous entities if any

        this.createGround(scene);
        // Create natural cliff/barrier around edges to prevent falling off the world
        this.createEdgeBarriers(scene);
        this.scatterTrees(scene, 50);
        this.scatterPlatforms(scene, 20);
        this.scatterClouds(scene, 15); // Will now track these
        this.scatterJewels(scene, 40);
        this.scatterEnemies(scene, 5);
        this.placeTreasureChest(scene);

        console.log("World generation complete.");
        return this.dynamicEntities;
    }

    clearWorld(scene) {
         console.log("Clearing previous world entities...");
         this.dynamicEntities.jewels.forEach(j => j.collect());
         this.dynamicEntities.enemies.forEach(e => e.destroy());
         // No special destroy for clouds needed, just remove mesh
         this.dynamicEntities.clouds.forEach(c => scene.remove(c));
         this.dynamicEntities = { jewels: [], enemies: [], clouds: [] }; // Reset all

         this.staticBodies.forEach(body => physicsManager.removeBody(body));
         this.staticBodies = [];

         this.staticMeshes.forEach(mesh => scene.remove(mesh));
         this.staticMeshes = [];
    }

    createGround(scene) {
        // Visual Plane
        const groundGeometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = GROUND_Y;
        groundMesh.receiveShadow = true;
        groundMesh.userData = { type: 'Ground' };
        scene.add(groundMesh);
        this.staticMeshes.push(groundMesh);

        // Physics Plane
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0, shape: groundShape, material: physicsManager.groundMaterial });
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.position.y = GROUND_Y;
        groundBody.userData = { type: 'Ground' };
        physicsManager.addBody(groundBody);
        this.staticBodies.push(groundBody);
    }

    scatterTrees(scene, count) {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
            const z = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
            if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
            const heightVariation = (noise2D(x * 0.1, z * 0.1) + 1) * 2 + 4;
            const tree = createTree(scene, new THREE.Vector3(x, GROUND_Y, z), heightVariation);
            if (tree.body) this.staticBodies.push(tree.body);
            if (tree.mesh) this.staticMeshes.push(tree.mesh);
        }
    }

    scatterPlatforms(scene, count) {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * WORLD_SIZE * 0.8;
            const z = (Math.random() - 0.5) * WORLD_SIZE * 0.8;
            const y = GROUND_Y + 1 + Math.random() * 6;
            if (Math.abs(x) < 6 && Math.abs(z) < 6 && y < 3) continue;
            const size = new THREE.Vector3(2 + Math.random() * 4, 0.3, 1.5 + Math.random() * 3);
            const platform = createPlatform(scene, new THREE.Vector3(x, y, z), size);
             if (platform.body) this.staticBodies.push(platform.body);
            if (platform.mesh) this.staticMeshes.push(platform.mesh);
        }
    }

    scatterClouds(scene, count) {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * WORLD_SIZE * 1.2;
            const z = (Math.random() - 0.5) * WORLD_SIZE * 1.2;
            const y = GROUND_Y + 15 + Math.random() * 10;
            const size = 2 + Math.random() * 3;
            const cloud = createCloud(scene, new THREE.Vector3(x, y, z), size);
            // <<<--- ADDED THIS LINE to track clouds --->>>
            if (cloud.mesh) this.dynamicEntities.clouds.push(cloud.mesh);
        }
    }

    scatterJewels(scene, count) {
        const types = ['yellow', 'blue', 'red'];
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
            const z = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
            if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;
            const y = GROUND_Y + 0.5 + Math.random() * 3;
            const type = types[Math.floor(Math.random() * types.length)];
            const jewel = new Jewel(scene, new THREE.Vector3(x, y, z), type);
            this.dynamicEntities.jewels.push(jewel);
        }
    }

    scatterEnemies(scene, count) {
        const types = ['Cow', 'Bull', 'Dragon'];
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * WORLD_SIZE * 0.8;
            const z = (Math.random() - 0.5) * WORLD_SIZE * 0.8;
             if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
            const y = GROUND_Y;
            const type = types[Math.floor(Math.random() * types.length)];
            const enemy = new Enemy(scene, new THREE.Vector3(x, y, z), type);
            this.dynamicEntities.enemies.push(enemy);
        }
    }

    placeTreasureChest(scene) {
        const angle = Math.random() * Math.PI * 2;
        const distance = WORLD_SIZE * 0.4 * (0.8 + Math.random() * 0.2);
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const y = GROUND_Y; // Place base on ground
        const chest = createTreasureChest(scene, new THREE.Vector3(x, y, z));
         if (chest.body) this.staticBodies.push(chest.body);
         if (chest.mesh) this.staticMeshes.push(chest.mesh);
    }

    // Natural barriers (cliffs) around the world edges
    createEdgeBarriers(scene) {
        const barrierHeight = 5;
        const barrierThickness = 2;
        const half = WORLD_SIZE / 2;
        const mat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        // North barrier (positive Z)
        {
            const geom = new THREE.BoxGeometry(WORLD_SIZE + barrierThickness * 2, barrierHeight, barrierThickness);
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(0, barrierHeight / 2, half + barrierThickness / 2);
            mesh.castShadow = mesh.receiveShadow = true;
            scene.add(mesh);
            this.staticMeshes.push(mesh);
            const shape = new CANNON.Box(new CANNON.Vec3((WORLD_SIZE + barrierThickness * 2) / 2, barrierHeight / 2, barrierThickness / 2));
            const body = new CANNON.Body({ mass: 0, shape: shape, position: new CANNON.Vec3(0, barrierHeight / 2, half + barrierThickness / 2), material: physicsManager.groundMaterial });
            body.userData = { type: 'Barrier' };
            physicsManager.addBody(body);
            this.staticBodies.push(body);
        }
        // South barrier (negative Z)
        {
            const geom = new THREE.BoxGeometry(WORLD_SIZE + barrierThickness * 2, barrierHeight, barrierThickness);
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(0, barrierHeight / 2, -half - barrierThickness / 2);
            mesh.castShadow = mesh.receiveShadow = true;
            scene.add(mesh);
            this.staticMeshes.push(mesh);
            const shape = new CANNON.Box(new CANNON.Vec3((WORLD_SIZE + barrierThickness * 2) / 2, barrierHeight / 2, barrierThickness / 2));
            const body = new CANNON.Body({ mass: 0, shape: shape, position: new CANNON.Vec3(0, barrierHeight / 2, -half - barrierThickness / 2), material: physicsManager.groundMaterial });
            body.userData = { type: 'Barrier' };
            physicsManager.addBody(body);
            this.staticBodies.push(body);
        }
        // East barrier (positive X)
        {
            const geom = new THREE.BoxGeometry(barrierThickness, barrierHeight, WORLD_SIZE + barrierThickness * 2);
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(half + barrierThickness / 2, barrierHeight / 2, 0);
            mesh.castShadow = mesh.receiveShadow = true;
            scene.add(mesh);
            this.staticMeshes.push(mesh);
            const shape = new CANNON.Box(new CANNON.Vec3(barrierThickness / 2, barrierHeight / 2, (WORLD_SIZE + barrierThickness * 2) / 2));
            const body = new CANNON.Body({ mass: 0, shape: shape, position: new CANNON.Vec3(half + barrierThickness / 2, barrierHeight / 2, 0), material: physicsManager.groundMaterial });
            body.userData = { type: 'Barrier' };
            physicsManager.addBody(body);
            this.staticBodies.push(body);
        }
        // West barrier (negative X)
        {
            const geom = new THREE.BoxGeometry(barrierThickness, barrierHeight, WORLD_SIZE + barrierThickness * 2);
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(-half - barrierThickness / 2, barrierHeight / 2, 0);
            mesh.castShadow = mesh.receiveShadow = true;
            scene.add(mesh);
            this.staticMeshes.push(mesh);
            const shape = new CANNON.Box(new CANNON.Vec3(barrierThickness / 2, barrierHeight / 2, (WORLD_SIZE + barrierThickness * 2) / 2));
            const body = new CANNON.Body({ mass: 0, shape: shape, position: new CANNON.Vec3(-half - barrierThickness / 2, barrierHeight / 2, 0), material: physicsManager.groundMaterial });
            body.userData = { type: 'Barrier' };
            physicsManager.addBody(body);
            this.staticBodies.push(body);
        }
    }
}
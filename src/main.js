import * as THREE from 'three';
import { physicsManager } from './game/PhysicsManager.js';
import { inputManager } from './game/InputManager.js';
import { uiManager } from './game/UIManager.js';
import { WorldGenerator } from './game/WorldGenerator.js';
import { PlayerController } from './game/PlayerController.js';

// --- Configuration ---
const WORLD_SIZE = 100;

// --- Basic Scene Setup ---
let scene, camera, renderer, clock;
let playerController;
let worldGenerator;
let dynamicEntities = { enemies: [], jewels: [], clouds: [] };
let axesHelper;

// --- Camera Control ---
const cameraOffset = new THREE.Vector3(0, 7, 12);
const cameraLookAtOffset = new THREE.Vector3(0, 1.0, 0);

// --- DEBUG FLAGS ---
let logCounter = 0;
const LOG_FREQUENCY = 120;

function init() { // ... (Same init setup: Renderer, Scene, Camera, Helpers, Lighting, Clock, Managers, World Gen, Player Controller) ...
    console.log("Initializing game...");
    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, logComputations: true });
    renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(window.devicePixelRatio); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x87CEEB); scene.fog = new THREE.Fog(0x87CEEB, 20, WORLD_SIZE * 0.7);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); camera.position.set(0, 10, 15); camera.lookAt(0, 0, 0);
    axesHelper = new THREE.AxesHelper(10); scene.add(axesHelper);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); directionalLight.position.set(15, 20, 10); directionalLight.castShadow = true; directionalLight.shadow.mapSize.width = 1024; directionalLight.shadow.mapSize.height = 1024; directionalLight.shadow.camera.near = 0.5; directionalLight.shadow.camera.far = 50; directionalLight.shadow.camera.left = -25; directionalLight.shadow.camera.right = 25; directionalLight.shadow.camera.top = 25; directionalLight.shadow.camera.bottom = -25; scene.add(directionalLight);
    clock = new THREE.Clock();
    inputManager.init(); uiManager.init();
    worldGenerator = new WorldGenerator(); dynamicEntities = worldGenerator.generate(scene);
    playerController = new PlayerController(scene, physicsManager, inputManager, camera); playerController.init();
    window.addEventListener('resize', onWindowResize, false);
    console.log("Initialization complete. Starting game loop.");
    animate();
}

function onWindowResize() { /* ... */ camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }
function updateCamera() { /* ... (Same camera logic with NaN checks) ... */
    if (!playerController?.player?.meshGroup) { camera.lookAt(0,0,0); return; }
    const playerPosition = playerController.player.meshGroup.position; const playerRotation = playerController.player.meshGroup.quaternion;
    if (isNaN(playerPosition.x)) { console.error("!!! Player visual position NaN!", playerPosition); return; }
    if (isNaN(playerRotation.x)) { console.error(`!!! Player visual rotation NaN! (main.js updateCamera)`, playerRotation); camera.lookAt(playerPosition); return; }
    const cameraTargetPosition = cameraOffset.clone().applyQuaternion(playerRotation).add(playerPosition);
    if (isNaN(cameraTargetPosition.x)) { console.error("!!! Calculated camera target NaN!", cameraTargetPosition); return; }
    camera.position.lerp(cameraTargetPosition, 0.15);
    const lookAtTarget = playerPosition.clone().add(cameraLookAtOffset.clone().applyQuaternion(playerRotation));
    if (isNaN(lookAtTarget.x)) { console.error("!!! Calculated lookAt NaN!", lookAtTarget); camera.lookAt(playerPosition); return; }
    camera.lookAt(lookAtTarget);
}

// --- Game Loop ---
function animate() {
    requestAnimationFrame(animate);
    const deltaTime = Math.min(clock.getDelta(), 0.1); // Capped delta time

    try {
        // --- ORDER CHANGE: Update Game Logic FIRST ---
        // This allows scheduling removals BEFORE the physics step that might crash
        if (playerController) { playerController.update(deltaTime); }
        // Update Enemies
        if (dynamicEntities.enemies) { const playerPosCannon = playerController?.player?.body?.position; for (let i = dynamicEntities.enemies.length - 1; i >= 0; i--) { const enemy = dynamicEntities.enemies[i]; if (enemy.isDestroyed) { dynamicEntities.enemies.splice(i, 1); } else if (playerPosCannon){ enemy.update(deltaTime, playerPosCannon); } } }
        // Update Jewels
        if (dynamicEntities.jewels) { for (let i = dynamicEntities.jewels.length - 1; i >= 0; i--) { const jewel = dynamicEntities.jewels[i]; if (jewel.isCollected) { dynamicEntities.jewels.splice(i, 1); } else { jewel.update(deltaTime); } } }
        // Update Clouds
        if (dynamicEntities.clouds) { dynamicEntities.clouds.forEach(cloudMesh => { if (cloudMesh.userData?.update) { cloudMesh.userData.update(deltaTime); } }); }


        // --- Physics Update ---
        physicsManager.update(deltaTime); // Executes world.step()

        // --- Process Removals AFTER physics step ---
        physicsManager.processRemovals();


        // --- Update Camera ---
        updateCamera();

    } catch (e) { console.error("!!! ERROR DURING Game Loop (animate):", e); }

    // Debug Logging...
    logCounter++;
    // if (logCounter >= LOG_FREQUENCY) { /* ... periodic logs ... */ logCounter = 0; }

    // Render Scene
    try { renderer.render(scene, camera); }
    catch (e) { console.error("!!! ERROR DURING RENDER:", e); }
}

// --- Start ---
init();
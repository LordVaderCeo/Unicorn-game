import { createNoise2D } from 'simplex-noise';

// Initialize the noise function with a random generator
// Use Math.random() for simplicity here, or pass a seeded random function for deterministic worlds
export const noise2D = createNoise2D(Math.random);

// You could export createNoise3D etc. similarly if needed
// import { createNoise3D } from 'simplex-noise';
// export const noise3D = createNoise3D(Math.random);

console.log("Noise utility loaded.");
// audioUtils.js

// Function to play a gunshot sound using Web Audio API
export async function playShootingSound() {
    // Create an audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create an oscillator node (generates a sound)
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(100, audioContext.currentTime); // Lower frequency for a deeper sound

    // Create a noise buffer (for the "bang" part of the gunshot)
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i++) {
        output[i] = Math.random() * 2 - 1; // White noise
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    // Create a gain node to control volume
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.01, audioContext.currentTime); // Lower gain value to reduce volume

    // Connect nodes
    noise.connect(gainNode);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Start noise and oscillator
    noise.start();
    oscillator.start();

    // Schedule the noise and oscillator to stop quickly for a short burst sound
    noise.stop(audioContext.currentTime + 0.1);
    oscillator.stop(audioContext.currentTime + 0.1);

    // Schedule the gain to decrease quickly
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
}

// audioUtils.js

// Function to play an explosion sound using Web Audio API
export async function playExplosionSound() {
    // Create an audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create a noise buffer (for the "explosion" sound)
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i++) {
        output[i] = Math.random() * 2 - 1; // White noise
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    // Create a gain node to control volume
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.04, audioContext.currentTime); // Set initial volume

    // Connect nodes
    noise.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Create an oscillator for the rumble effect
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(50, audioContext.currentTime); // Low frequency for rumble

    const oscGainNode = audioContext.createGain();
    oscGainNode.gain.setValueAtTime(0.02, audioContext.currentTime); // Set initial volume for rumble

    // Connect oscillator nodes
    oscillator.connect(oscGainNode);
    oscGainNode.connect(audioContext.destination);

    // Start noise and oscillator
    noise.start();
    oscillator.start();

    // Schedule the noise to stop after 0.5 seconds
    noise.stop(audioContext.currentTime + 0.5);
    // Schedule the oscillator to stop after 1 second
    oscillator.stop(audioContext.currentTime + 1);

    // Schedule the gain to decrease gradually for the noise
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
    // Schedule the gain to decrease gradually for the oscillator
    oscGainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);
}

// Your AudioContext setup
let audioContext;

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Function to resume the AudioContext
function resumeAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// Event listener to handle user gesture
document.addEventListener('click', () => {
    initAudioContext();
    resumeAudioContext();
}, { once: true });

// Your interval code or other logic
let intervalId;

function startInterval() {
    // Ensure AudioContext is resumed before starting the interval
    resumeAudioContext();

    if (intervalId) {
        clearInterval(intervalId);
    }


}

function stopInterval() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}



// Example usage
startInterval();

// After some time, restart the interval
setTimeout(() => {
    startInterval();
}, 5000);

// ========================================
// Text-to-Speech App
// Using Browser Web Speech API
// ========================================

// DOM Element References
const textInput = document.getElementById("text-input");
const voiceSelect = document.getElementById("voice-select");
const speedSlider = document.getElementById("speed-slider");
const pitchSlider = document.getElementById("pitch-slider");
const speedValue = document.getElementById("speed-value");
const pitchValue = document.getElementById("pitch-value");
const speakBtn = document.getElementById("speak-btn");
const stopBtn = document.getElementById("stop-btn");
const charCount = document.getElementById("char-count");
const status = document.getElementById("status");
const statusText = document.getElementById("status-text");

// Web Speech API
const synth = window.speechSynthesis;
let voices = [];

// Step 3: Load available voices
// Get voices from the browser and populate the dropdown
function loadVoices() {
    voices = synth.getVoices();
    if (voices.length === 0) {
        return;
    }
    voiceSelect.innerHTML = "";

    voices.forEach((voice, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });

    console.log(`Loaded ${voices.length} voices`);
}

// Step 4: Update character counter
// Show how many characters the user has typed
function updateCharCount() {
    const count = textInput.value.length;
    charCount.textContent = count;
}

// Step 5: Implement speech synthesis
// The main speak() function that converts text to speech
function speak() {
    if (synth.speaking) {
        synth.cancel;
    }

    const text = textInput.value.trim();

    if (!text) {
        alert("Please enter some text to speak");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    const selectedVoiceIndex = voiceSelect.value;
    if (selectedVoiceIndex !== "") {
        utterance.voice = voices[selectedVoiceIndex];
    }

    utterance.rate = parseFloat(speedSlider.value);
    utterance.pitch = parseFloat(pitchSlider.value);
    utterance.volume = 1.0;

    utterance.onstart = () => {
        status.classList.add("speaking");
        statusText.textContent = "Speaking...";
        speakBtn.disabled = true;
        stopBtn.disabled = false;
    };

    utterance.onend = () => {
        status.classList.remove("speaking");
        statusText.textContent = "Ready";
        speakBtn.disabled = false;
        stopBtn.disabled = true;
    }

    utterance.onerror = () => {
        console.error("Speech synthesis error", event);
        statusText.textContent = "Error occurred";
        speakBtn.disabled = false;
        stopBtn.disabled = true;
    };
    
    synth.speak(utterance);
}

// Stop speaking
// Cancel any ongoing speech
function stop() {
    synth.cancel;
    status.classList.remove("speaking");
    statusText.textContent = "Stopped";
    speakBtn.disabled = false;
    stopBtn.disabled = true;
}

// Initialize the app
// Set up all event listeners when DOM is ready
function init() {
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
    textInput.addEventListener("input", updateCharCount);

    speedSlider.addEventListener("input", () => {
        speedValue.textContent = speedSlider.value;
    });

    pitchSlider.addEventListener("input", () => {
        pitchValue.textContent = pitchSlider.value;
    });

    speakBtn.addEventListener("click", speak);
    stopBtn.addEventListener("click", stop);

    updateCharCount();
    stopBtn.disabled=true;
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", init);
import { soundCatalog } from "./soundCatalog.jsx";

const AUDIO_POOL_SIZE = 3;
const audioCache = new Map();
const audioPoolIndex = new Map();

function createAudioPool(src) {
    return Array.from({ length: AUDIO_POOL_SIZE }, () => {
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.load();
        return audio;
    });
}

for (const [name, sound] of Object.entries(soundCatalog)) {
    audioCache.set(name, createAudioPool(sound.src));
    audioPoolIndex.set(name, 0);
}

// No ear rape
function clampVolume(value) {
    return Math.max(0, Math.min(1, value));
}

function getNextAudio(name, src) {
    let audioPool = audioCache.get(name);

    if (audioPool == null) {
        audioPool = createAudioPool(src);
        audioCache.set(name, audioPool);
        audioPoolIndex.set(name, 0);
    }

    const nextIndex = audioPoolIndex.get(name) ?? 0;
    audioPoolIndex.set(name, (nextIndex + 1) % audioPool.length);

    return audioPool[nextIndex];
}

/**
 * Plays a UI sound effect by name.
 *
 * @param {"buttonDown" | "buttonUp" | "keyStroke"} name The sound effect to play.
 * @param {number} [volumeOverride] Optional volume override from 0 to 1. If omitted,
 *                                  uses the default volume from `soundCatalog`.
 */
export function playSound(name, volumeOverride) {
    const sound = soundCatalog[name];
    if (!sound) return;

    const audio = getNextAudio(name, sound.src);

    audio.volume = clampVolume(volumeOverride ?? sound.volume ?? 1);
    audio.currentTime = 0;

    void audio.play().catch(() => {});
}

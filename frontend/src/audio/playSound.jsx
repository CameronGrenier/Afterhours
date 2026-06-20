import { soundCatalog } from "./soundCatalog.jsx";

const audioCache = new Map()

// No ear rape
function clampVolume(value) {
    return Math.max(0, Math.min(1, value));
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

    let audio = audioCache.get(name);

    if (audio == null) {
        audio = new Audio(sound.src);
        audio.preload = "auto"
        audioCache.set(name, audio);
    }

    audio.volume = clampVolume(volumeOverride ?? sound.volume, 1);
    audio.currentTime = 0;

    void audio.play().catch(() => {});
}
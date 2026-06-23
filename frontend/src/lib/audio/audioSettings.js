const DEFAULT_SFX_VOLUME = 0.5;
const DEFAULT_MUSIC_VOLUME = 0.5;

let sfxVolume = DEFAULT_SFX_VOLUME;
let musicVolume = DEFAULT_MUSIC_VOLUME;

const musicVolumeListeners = new Set();

export function clampVolume(value) {
  return Math.max(0, Math.min(1, value));
}

export function getSfxVolume() {
  return sfxVolume;
}

export function setSfxVolume(nextVolume) {
  sfxVolume = clampVolume(nextVolume);
}

export function getMusicVolume() {
  return musicVolume;
}

export function setMusicVolume(nextVolume) {
  musicVolume = clampVolume(nextVolume);

  for (const listener of musicVolumeListeners) {
    listener(musicVolume);
  }
}

export function subscribeToMusicVolume(listener) {
  musicVolumeListeners.add(listener);
  listener(musicVolume);

  return () => {
    musicVolumeListeners.delete(listener);
  };
}

import {
  clampVolume,
  getMusicVolume,
  subscribeToMusicVolume,
} from "./audioSettings.js";
import { musicCatalog } from "./musicCatalog.js";

const FADE_IN_DURATION_MS = 1600;
const FADE_OUT_DURATION_MS = 3200;
const FADE_STEP_MS = 40;

let playlist = musicCatalog.lobby;
let currentTrackIndex = -1;
let currentTrackState = null;
let transitionTimeoutId = null;
let fadeIntervalId = null;
let unsubscribeFromMusicVolume = null;
let isStarted = false;
let isTransitioning = false;
let playbackSessionId = 0;

function getRandomTrackIndex() {
  if (!playlist.length) return 0;

  return Math.floor(Math.random() * playlist.length);
}

function clearTransitionTimeout() {
  if (transitionTimeoutId != null) {
    window.clearTimeout(transitionTimeoutId);
    transitionTimeoutId = null;
  }
}

function clearFadeInterval() {
  if (fadeIntervalId != null) {
    window.clearInterval(fadeIntervalId);
    fadeIntervalId = null;
  }
}

function syncTrackVolume(trackState) {
  if (!trackState) return;

  trackState.audio.volume = clampVolume(
    trackState.track.volume * trackState.fadeLevel * getMusicVolume(),
  );
}

function resetTrackState(trackState) {
  if (!trackState) return;

  trackState.audio.pause();
  trackState.audio.currentTime = 0;
  trackState.hasScheduledFade = false;
}

function createTrackState(track) {
  const audio = new Audio(track.src);
  audio.preload = "auto";
  audio.loop = false;

  return {
    audio,
    fadeLevel: 1,
    hasScheduledFade: false,
    track,
  };
}

function scheduleFadeOut(trackState) {
  if (!trackState || trackState.hasScheduledFade) return;

  const { audio } = trackState;
  const durationSeconds = audio.duration;

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return;
  }

  const durationMs = durationSeconds * 1000;
  const fadeStartMs = Math.max(0, durationMs - FADE_OUT_DURATION_MS);

  trackState.hasScheduledFade = true;
  clearTransitionTimeout();

  transitionTimeoutId = window.setTimeout(() => {
    if (currentTrackState !== trackState || isTransitioning) return;

    fadeTrackTo(trackState, 0, FADE_OUT_DURATION_MS);
  }, fadeStartMs);
}

function fadeTrackTo(trackState, targetFadeLevel, durationMs, onComplete) {
  clearFadeInterval();

  const startFadeLevel = trackState.fadeLevel;
  const fadeDifference = targetFadeLevel - startFadeLevel;

  if (durationMs <= 0 || fadeDifference === 0) {
    trackState.fadeLevel = targetFadeLevel;
    syncTrackVolume(trackState);
    onComplete?.();
    return;
  }

  const totalSteps = Math.max(1, Math.ceil(durationMs / FADE_STEP_MS));
  let currentStep = 0;

  fadeIntervalId = window.setInterval(() => {
    currentStep += 1;
    trackState.fadeLevel =
      startFadeLevel + (fadeDifference * currentStep) / totalSteps;
    syncTrackVolume(trackState);

    if (currentStep >= totalSteps) {
      clearFadeInterval();
      trackState.fadeLevel = targetFadeLevel;
      syncTrackVolume(trackState);
      onComplete?.();
    }
  }, FADE_STEP_MS);
}

async function playTrack(trackState, { fadeIn = false, sessionId } = {}) {
  trackState.fadeLevel = fadeIn ? 0 : 1;
  syncTrackVolume(trackState);

  try {
    await trackState.audio.play();
  } catch {
    return false;
  }

  if (
    sessionId !== playbackSessionId ||
    currentTrackState !== trackState
  ) {
    resetTrackState(trackState);
    return false;
  }

  if (fadeIn) {
    fadeTrackTo(trackState, 1, FADE_IN_DURATION_MS);
  }

  return true;
}

function attachTrackEvents(trackState) {
  const { audio } = trackState;

  audio.addEventListener("loadedmetadata", () => {
    if (currentTrackState === trackState) {
      scheduleFadeOut(trackState);
    }
  });

  audio.addEventListener("ended", () => {
    if (currentTrackState === trackState) {
      void advanceToNextTrack();
    }
  });
}

async function advanceToNextTrack() {
  if (!playlist.length || isTransitioning) return;

  isTransitioning = true;
  const sessionId = playbackSessionId;

  const previousTrackState = currentTrackState;
  if (previousTrackState) {
    resetTrackState(previousTrackState);
  }

  currentTrackIndex = (currentTrackIndex + 1) % playlist.length;

  const nextTrackState = createTrackState(playlist[currentTrackIndex]);
  attachTrackEvents(nextTrackState);
  currentTrackState = nextTrackState;
  clearTransitionTimeout();

  const didPlay = await playTrack(nextTrackState, {
    fadeIn: true,
    sessionId,
  });

  if (didPlay) {
    scheduleFadeOut(nextTrackState);
  }

  isTransitioning = false;
}

export async function startLobbyMusic() {
  if (!playlist.length) return false;
  const sessionId = playbackSessionId;

  if (unsubscribeFromMusicVolume == null) {
    unsubscribeFromMusicVolume = subscribeToMusicVolume(() => {
      syncTrackVolume(currentTrackState);
    });
  }

  if (currentTrackState) {
    if (!currentTrackState.audio.paused && !currentTrackState.audio.ended) {
      return true;
    }

    const didPlay = await playTrack(currentTrackState, { sessionId });

    if (didPlay) {
      scheduleFadeOut(currentTrackState);
    } else {
      currentTrackState = null;
      currentTrackIndex = -1;
      isStarted = false;
    }

    return didPlay;
  }

  currentTrackIndex = getRandomTrackIndex();
  const trackState = createTrackState(playlist[currentTrackIndex]);
  attachTrackEvents(trackState);
  currentTrackState = trackState;
  isStarted = true;

  const didPlay = await playTrack(trackState, { sessionId });

  if (didPlay) {
    scheduleFadeOut(trackState);
  } else {
    currentTrackState = null;
    currentTrackIndex = -1;
    isStarted = false;
  }

  return didPlay;
}

export function stopLobbyMusic() {
  playbackSessionId += 1;
  clearTransitionTimeout();
  clearFadeInterval();

  if (currentTrackState) {
    resetTrackState(currentTrackState);
    currentTrackState = null;
  }

  if (unsubscribeFromMusicVolume) {
    unsubscribeFromMusicVolume();
    unsubscribeFromMusicVolume = null;
  }

  currentTrackIndex = -1;
  isStarted = false;
  isTransitioning = false;
}

export function setLobbyPlaylist(nextPlaylist) {
  if (!Array.isArray(nextPlaylist) || nextPlaylist.length === 0) return;

  playlist = nextPlaylist;
  currentTrackIndex = -1;

  if (!isStarted) return;

  stopLobbyMusic();
  void startLobbyMusic();
}

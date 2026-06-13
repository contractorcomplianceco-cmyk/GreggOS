import { useCallback, useMemo, useState } from 'react';

const REPEAT_SUFFIX_RE = /_r[12]$/;

export function stripRepeatSuffix(key: string): string {
  return key.replace(REPEAT_SUFFIX_RE, '');
}

function rotateFromIndex(
  durations: Record<string, number>,
  startIndex: number,
): Record<string, number> {
  const keys = Object.keys(durations);
  if (startIndex <= 0) return durations;
  const result: Record<string, number> = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[(startIndex + i) % keys.length];
    result[key] = durations[key];
  }
  return result;
}

function buildLockedDurations(key: string, duration: number): Record<string, number> {
  return { [`${key}_r1`]: duration, [`${key}_r2`]: duration };
}

const PAUSE_DURATION_MS = 10_000_000;

export function useSceneControls(baseDurations: Record<string, number>) {
  const sceneKeys = useMemo(() => Object.keys(baseDurations), [baseDurations]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mountKey, setMountKey] = useState(0);
  const [tick, setTick] = useState(0);

  const durations = useMemo(() => {
    if (paused) {
      const key = sceneKeys[activeIndex];
      return { [key]: PAUSE_DURATION_MS };
    }
    if (locked) {
      const key = sceneKeys[activeIndex];
      return buildLockedDurations(key, baseDurations[key]);
    }
    return rotateFromIndex(baseDurations, activeIndex);
  }, [paused, locked, activeIndex, sceneKeys, baseDurations]);

  const onSceneChange = useCallback(
    (rawKey: string) => {
      const clean = stripRepeatSuffix(rawKey);
      const idx = sceneKeys.indexOf(clean);
      if (idx >= 0) setActiveIndex(idx);
      setTick((t) => t + 1);
    },
    [sceneKeys],
  );

  const jumpTo = useCallback((index: number) => {
    setActiveIndex(index);
    setMountKey((k) => k + 1);
    setTick((t) => t + 1);
  }, []);

  const toggleLock = useCallback(() => {
    setLocked((prev) => !prev);
    setMountKey((k) => k + 1);
    setTick((t) => t + 1);
  }, []);

  const togglePause = useCallback(() => {
    setPaused((prev) => !prev);
    setMountKey((k) => k + 1);
    setTick((t) => t + 1);
  }, []);

  return {
    sceneKeys,
    activeIndex,
    locked,
    paused,
    mountKey,
    tick,
    durations,
    activeDuration: baseDurations[sceneKeys[activeIndex]] ?? 0,
    onSceneChange,
    jumpTo,
    toggleLock,
    togglePause,
  };
}

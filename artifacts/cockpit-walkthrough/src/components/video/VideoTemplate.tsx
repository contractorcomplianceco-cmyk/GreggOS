import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';

export const SCENE_DURATIONS = {
  open: 4000,
  commandCenter: 6000,
  processor: 5000,
  expansion: 5500,
  advisory: 5000,
  close: 4000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  open: Scene1,
  commandCenter: Scene2,
  processor: Scene3,
  expansion: Scene4,
  advisory: Scene5,
  close: Scene6,
};

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let cumulativeMs = 0;
  for (const [key, ms] of Object.entries(SCENE_DURATIONS)) {
    out[key] = cumulativeMs / 1000;
    cumulativeMs += ms;
  }
  return out;
})();

const AUDIO_SEEK_EPSILON_SEC = 0.18;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = false,
  paused = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  paused?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.85;
    if (paused) {
      audio.pause();
      return;
    }
    const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted, paused]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-primary data-grid-bg">

      {/* Persistent Background Video Loop */}
      <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen">
        <video
          src={`${import.meta.env.BASE_URL}videos/data-grid.mp4`}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      </div>

      {/* Persistent Glows */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, var(--color-accent), transparent)' }}
        animate={{
          x: sceneIndex === 0 ? '-20%' : sceneIndex === 1 ? '50%' : sceneIndex === 3 ? '80%' : '10%',
          y: sceneIndex === 0 ? '10%' : sceneIndex === 2 ? '-40%' : sceneIndex === 4 ? '50%' : '20%',
          scale: [1, 1.2, 0.9, 1.1, 1]
        }}
        transition={{ duration: 8, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none opacity-10"
        style={{ background: 'radial-gradient(circle, var(--color-success), transparent)' }}
        animate={{
          x: sceneIndex === 1 ? '80%' : sceneIndex === 2 ? '20%' : sceneIndex === 4 ? '-10%' : '50%',
          y: sceneIndex === 1 ? '50%' : sceneIndex === 3 ? '80%' : sceneIndex === 5 ? '10%' : '-20%',
        }}
        transition={{ duration: 10, ease: 'easeInOut' }}
      />

      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/composite_audio.mp3`}
        preload="auto"
        autoPlay
        muted={muted}
      />
    </div>
  );
}

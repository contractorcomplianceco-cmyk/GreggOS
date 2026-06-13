import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      
      {/* Scanning Line */}
      <motion.div 
        className="absolute top-1/2 left-0 w-full h-[1px] bg-accent opacity-50"
        initial={{ top: '0%' }}
        animate={{ top: '100%' }}
        transition={{ duration: 4, ease: 'linear' }}
      />

      <div className="relative z-10 text-center flex flex-col items-center">
        <motion.div
          className="text-accent text-lg font-mono mb-6 tracking-[0.3em] uppercase"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          [ INITIALIZING SYSTEM ]
        </motion.div>

        <motion.div
          className="relative overflow-hidden"
        >
          <motion.h1 
            className="text-[6vw] font-display font-black leading-none text-white tracking-tight glow-text"
            initial={{ y: '100%' }}
            animate={phase >= 2 ? { y: '0%' } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            CURRENT CLIENT
          </motion.h1>
        </motion.div>
        
        <motion.div
          className="relative overflow-hidden mt-2"
        >
          <motion.h1 
            className="text-[6vw] font-display font-black leading-none text-white tracking-tight glow-text"
            initial={{ y: '100%' }}
            animate={phase >= 2 ? { y: '0%' } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
          >
            COCKPIT
          </motion.h1>
        </motion.div>

        <motion.p
          className="mt-8 text-[1.5vw] font-body text-text-secondary max-w-[40vw]"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.8 }}
        >
          The operational center for Contractor Compliance Authority.
        </motion.p>
      </div>

    </motion.div>
  );
}

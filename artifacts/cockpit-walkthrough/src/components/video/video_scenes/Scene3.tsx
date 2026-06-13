import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => setPhase(4), 3200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0"
      initial={{ scale: 1.1, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ y: '-100%', opacity: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        >
          <h2 className="text-[3.5vw] font-display font-bold text-white glow-text">Call Note Processor</h2>
          <p className="text-xl text-text-secondary mt-2">Raw signals → Reviewed CRM Drafts</p>
        </motion.div>

        <div className="flex items-center gap-8 w-full max-w-5xl">
          {/* Raw Input */}
          <motion.div 
            className="flex-1 bg-secondary/50 rounded-lg p-6 border border-white/5 border-dashed"
            initial={{ opacity: 0, x: -50 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <div className="text-xs font-mono text-text-muted mb-4 uppercase">Raw Transcript</div>
            <div className="text-sm text-text-secondary space-y-2 font-mono">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.2 }}
              >
                &gt; "Client mentioned they are opening a new office in TX next month..."
              </motion.div>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.6 }}
              >
                &gt; "Need to check compliance requirements there."
              </motion.div>
            </div>
          </motion.div>

          {/* Processing Arrow */}
          <motion.div 
            className="w-16 h-[2px] bg-accent relative"
            initial={{ scaleX: 0 }}
            animate={phase >= 3 ? { scaleX: 1 } : { scaleX: 0 }}
            style={{ transformOrigin: 'left' }}
          >
            <motion.div 
              className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-accent rounded-full shadow-[0_0_10px_#00f0ff]"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>

          {/* Structured Output */}
          <motion.div 
            className="flex-1 bg-primary border border-accent/30 rounded-lg p-6 shadow-[0_0_30px_rgba(0,240,255,0.1)]"
            initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
            animate={phase >= 4 ? { opacity: 1, x: 0, filter: 'blur(0px)' } : { opacity: 0, x: 50, filter: 'blur(10px)' }}
            transition={{ type: 'spring', stiffness: 150 }}
          >
            <div className="text-xs font-mono text-accent mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              STRUCTURED DRAFT
            </div>
            <div className="space-y-4">
              <div className="bg-white/5 p-3 rounded text-sm">
                <span className="text-success text-xs font-bold block mb-1">NEW OPPORTUNITY</span>
                TX Expansion Compliance
              </div>
              <div className="bg-white/5 p-3 rounded text-sm">
                <span className="text-warning text-xs font-bold block mb-1">TASK</span>
                Review TX requirements by Friday
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

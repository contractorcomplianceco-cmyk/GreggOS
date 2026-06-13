import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 2000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col justify-center items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ scale: 1.2, opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="w-full max-w-6xl px-12 grid grid-cols-2 gap-12">
        {/* Expansion Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="text-sm font-mono text-accent mb-2 tracking-wider">EXPANSION PIPELINE</div>
          <h3 className="text-3xl font-display font-bold text-white mb-6">Auto-Prioritized Board</h3>
          
          <div className="flex gap-2 mb-4">
             {['Identified', 'Qualified', 'Proposal', 'Live'].map((stage, i) => (
               <motion.div 
                 key={i} 
                 className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden"
               >
                 <motion.div 
                   className="h-full bg-accent"
                   initial={{ width: 0 }}
                   animate={phase >= 2 ? { width: i <= 2 ? '100%' : '30%' } : { width: 0 }}
                   transition={{ duration: 1, delay: i * 0.2 }}
                 />
               </motion.div>
             ))}
          </div>

          <div className="space-y-3">
            <motion.div 
              className="bg-secondary p-4 rounded border-l-4 border-warning flex justify-between items-center"
              initial={{ x: -20, opacity: 0 }}
              animate={phase >= 3 ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
            >
              <div>
                <div className="font-medium text-white">Project Delta</div>
                <div className="text-xs text-text-muted mt-1">Stalled - 14 Days</div>
              </div>
              <div className="text-warning font-mono">$45k</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Relationships Radar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          <div className="text-sm font-mono text-accent mb-2 tracking-wider">RELATIONSHIPS</div>
          <h3 className="text-3xl font-display font-bold text-white mb-6">Warmth & Cadence</h3>
          
          <div className="relative w-full aspect-square max-w-sm mx-auto bg-primary/50 rounded-full border border-white/10 flex items-center justify-center overflow-hidden">
            {/* Radar Sweep */}
            <motion.div 
              className="absolute inset-0"
              style={{
                background: 'conic-gradient(from 0deg, transparent 70%, rgba(0,240,255,0.4) 100%)',
                borderRadius: '50%'
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            {/* Rings */}
            <div className="absolute w-3/4 h-3/4 border border-white/5 rounded-full" />
            <div className="absolute w-1/2 h-1/2 border border-white/5 rounded-full" />

            {/* Nodes */}
            {phase >= 2 && [
              { top: '30%', left: '40%', color: 'bg-success', label: 'Warm' },
              { top: '60%', left: '70%', color: 'bg-warning', label: 'Due' },
              { top: '20%', left: '70%', color: 'bg-error', label: 'Cold' },
            ].map((node, i) => (
              <motion.div
                key={i}
                className="absolute flex flex-col items-center gap-1"
                style={{ top: node.top, left: node.left }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', delay: i * 0.3 }}
              >
                <div className={`w-3 h-3 rounded-full ${node.color} shadow-[0_0_10px_currentColor]`} />
                <div className="text-[10px] text-white/70 font-mono">{node.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

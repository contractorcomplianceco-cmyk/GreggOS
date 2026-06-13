import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 2500),
      setTimeout(() => setPhase(5), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: '0%', opacity: 1 }}
      exit={{ x: '-20%', opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-1/3 flex flex-col justify-center pl-16 z-20">
        <motion.div
          className="w-12 h-1 bg-accent mb-6"
          initial={{ scaleX: 0, originX: 0 }}
          animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.4 }}
        />
        <motion.h2 
          className="text-[4vw] font-display font-bold leading-tight text-white glow-text"
          initial={{ opacity: 0, x: -30 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.6 }}
        >
          GreggOS Command Center
        </motion.h2>
        <motion.p
          className="mt-6 text-xl text-text-secondary"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          High-density layout. Risk pulse indicator. Anomaly detection. Client health map.
        </motion.p>
      </div>

      <div className="w-2/3 relative flex items-center justify-center p-12">
        <motion.div 
          className="w-full h-[70vh] bg-secondary/80 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md p-6 flex flex-col gap-4 relative"
          initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.9, rotateY: 20 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ perspective: 1000 }}
        >
          <div className="flex justify-between items-center pb-4 border-b border-white/5">
             <div className="text-sm font-mono text-text-secondary">SYSTEM.STATUS</div>
             <motion.div 
               className="flex items-center gap-2 text-success font-mono text-sm"
               animate={{ opacity: [1, 0.5, 1] }}
               transition={{ duration: 2, repeat: Infinity }}
             >
               <div className="w-2 h-2 rounded-full bg-success"></div>
               OPTIMAL
             </motion.div>
          </div>

          <div className="flex gap-4 h-full">
            <div className="w-1/3 flex flex-col gap-4">
               {/* Pulse Indicator */}
               <motion.div 
                 className="flex-1 bg-primary/50 rounded-lg border border-white/5 p-4"
                 initial={{ opacity: 0, y: 20 }}
                 animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
               >
                 <div className="text-xs text-text-muted mb-2">RISK PULSE</div>
                 <div className="text-4xl font-display text-warning glow-text mb-4">42</div>
                 <div className="h-20 flex items-end gap-1">
                   {[40, 60, 30, 80, 50, 90, 40].map((h, i) => (
                     <motion.div 
                       key={i} 
                       className="flex-1 bg-accent/40 rounded-t-sm" 
                       initial={{ height: '0%' }}
                       animate={phase >= 4 ? { height: `${h}%` } : { height: '0%' }}
                       transition={{ duration: 0.5, delay: i * 0.05 }}
                     />
                   ))}
                 </div>
               </motion.div>
               <motion.div 
                 className="h-32 bg-primary/50 rounded-lg border border-error/20 p-4 relative overflow-hidden"
                 initial={{ opacity: 0, y: 20 }}
                 animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
               >
                 <div className="absolute inset-0 bg-error/5" />
                 <div className="text-xs text-error font-mono mb-2">RED FLAGS</div>
                 <div className="text-sm text-text-secondary">Client ACME renewal at risk.</div>
               </motion.div>
            </div>
            
            <div className="w-2/3 flex flex-col gap-4">
               <motion.div 
                 className="flex-1 bg-primary/50 rounded-lg border border-white/5 p-4"
                 initial={{ opacity: 0, x: 20 }}
                 animate={phase >= 5 ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
               >
                 <div className="text-xs text-text-muted mb-4">CLIENT NURTURING CENTER</div>
                 <div className="space-y-3">
                   {[
                     { name: 'Apex Corp', score: 92, risk: 'Low' },
                     { name: 'Vertex Inc', score: 75, risk: 'Med' },
                     { name: 'Nova LLC', score: 40, risk: 'High' }
                   ].map((c, i) => (
                     <div key={i} className="flex justify-between items-center p-2 rounded bg-white/5">
                       <div className="text-sm font-medium">{c.name}</div>
                       <div className="flex gap-4 items-center">
                         <div className="text-xs text-accent">{c.score} ENG</div>
                         <div className={`text-xs px-2 py-1 rounded ${c.risk === 'High' ? 'bg-error/20 text-error' : 'bg-success/20 text-success'}`}>{c.risk}</div>
                       </div>
                     </div>
                   ))}
                 </div>
               </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}

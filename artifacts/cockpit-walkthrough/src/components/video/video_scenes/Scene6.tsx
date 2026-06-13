import { motion } from 'framer-motion';

export function Scene6() {
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-primary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className="w-full max-w-4xl text-center"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1, type: "spring" }}
      >
        <div className="text-accent tracking-[0.4em] font-mono text-sm mb-6 uppercase">
          Contractor Compliance Authority
        </div>
        
        <h1 className="text-[5vw] font-display font-black text-white leading-none tracking-tight">
          STAY AHEAD.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-white glow-text">
            STAY IN CONTROL.
          </span>
        </h1>
      </motion.div>

      <motion.div 
        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[40vw] h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.5 }}
        transition={{ delay: 1.5, duration: 1.5 }}
      />
    </motion.div>
  );
}

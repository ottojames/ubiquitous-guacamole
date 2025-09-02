import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  show: boolean;
  children: React.ReactNode;
}

export default function Reveal({ show, children }: Props) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

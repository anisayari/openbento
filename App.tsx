import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Builder from './components/Builder';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [page, setPage] = useState<'landing' | 'builder'>('landing');

  return (
    <AnimatePresence mode="wait">
      {page === 'landing' ? (
        <motion.div 
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LandingPage onStart={() => setPage('builder')} />
        </motion.div>
      ) : (
        <motion.div
          key="builder"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
        >
          <Builder onBack={() => setPage('landing')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
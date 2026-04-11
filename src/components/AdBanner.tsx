import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export function AdBanner() {
  const [ads, setAds] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'ads'), (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ads');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (ads.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [ads.length]);

  if (ads.length === 0) return null;

  return (
    <div className="w-full py-8 px-4 border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="relative w-full h-48 sm:h-64 md:h-80 rounded-3xl overflow-hidden shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.a
              key={ads[currentIndex].id}
              href={ads[currentIndex].link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 block"
            >
              <img
                src={ads[currentIndex].image}
                alt={`Ad ${ads[currentIndex].id}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.a>
          </AnimatePresence>
          
          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {ads.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-6' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

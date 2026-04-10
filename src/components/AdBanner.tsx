import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const ADS = [
  {
    id: 1,
    image: 'https://picsum.photos/seed/ad1/1200/300',
    link: 'https://google.com'
  },
  {
    id: 2,
    image: 'https://picsum.photos/seed/ad2/1200/300',
    link: 'https://facebook.com'
  },
  {
    id: 3,
    image: 'https://picsum.photos/seed/ad3/1200/300',
    link: 'https://youtube.com'
  }
];

export function AdBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ADS.length);
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full py-8 px-4 border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="relative w-full h-48 sm:h-64 md:h-80 rounded-3xl overflow-hidden shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.a
              key={ADS[currentIndex].id}
              href={ADS[currentIndex].link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 block"
            >
              <img
                src={ADS[currentIndex].image}
                alt={`Ad ${ADS[currentIndex].id}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.a>
          </AnimatePresence>
          
          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {ADS.map((_, index) => (
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

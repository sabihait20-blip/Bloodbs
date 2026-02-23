import { motion } from 'motion/react';
import { ExternalLink, Sparkles } from 'lucide-react';

export function AdBanner() {
  return (
    <div className="w-full bg-slate-50 py-8 px-4 border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative group cursor-pointer"
        >
          {/* Animated Background Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
          
          <div className="relative bg-white rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-100 shadow-xl overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-red-50 rounded-full blur-3xl opacity-50" />
            
            <div className="flex items-center gap-6 relative z-10">
              <motion.div 
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200 shrink-0"
              >
                <Sparkles size={32} />
              </motion.div>
              
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                  Sponsored Ad
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  আপনার ব্যবসার প্রচার করুন এখানে!
                </h3>
                <p className="text-slate-500 mt-1 font-medium">
                  হাজার হাজার মানুষের কাছে পৌঁছে দিন আপনার পণ্য বা সেবা।
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full md:w-auto">
              <div className="text-center md:text-right hidden sm:block">
                <p className="text-xs text-slate-400 font-bold uppercase">বিজ্ঞাপন দিতে যোগাযোগ করুন</p>
                <p className="text-lg font-bold text-slate-900">+৮৮০ ১৭০০-০০০০০০</p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all group"
              >
                বিস্তারিত দেখুন
                <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </motion.button>
            </div>
          </div>
        </motion.div>
        
        <p className="text-center text-[10px] text-slate-400 mt-4 font-medium uppercase tracking-widest">
          Advertisement Space • Monetize Your App
        </p>
      </div>
    </div>
  );
}

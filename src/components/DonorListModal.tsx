import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, MapPin, Droplets, Search } from 'lucide-react';
import { Donor } from '../types';

interface DonorListModalProps {
  isOpen: boolean;
  onClose: () => void;
  donors: Donor[];
  onDonorClick: (donorId: string) => void;
}

export const DonorListModal: React.FC<DonorListModalProps> = ({ isOpen, onClose, donors, onDonorClick }) => {
  const [search, setSearch] = React.useState('');

  const filteredDonors = donors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.location.toLowerCase().includes(search.toLowerCase()) ||
    d.bloodGroup.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-red-600 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <User size={24} />
                নিবন্ধিত দাতাদের তালিকা
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="নাম, এলাকা বা রক্তের গ্রুপ দিয়ে খুঁজুন..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredDonors.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <User size={48} className="mx-auto mb-4 opacity-20" />
                  <p>কোনো দাতা পাওয়া যায়নি</p>
                </div>
              ) : (
                filteredDonors.map((donor) => (
                  <button
                    key={donor.id}
                    onClick={() => {
                      onDonorClick(donor.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-red-200 hover:shadow-md transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-100 shrink-0">
                      <img src={donor.image} alt={donor.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate">{donor.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin size={12} /> {donor.location}
                        </span>
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          {donor.bloodGroup}
                        </span>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${donor.available ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

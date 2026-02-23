import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Droplets, MapPin, Phone } from 'lucide-react';
import { BloodGroup } from '../types';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: { bloodGroup: BloodGroup; location: string; phone: string }) => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function RequestModal({ isOpen, onClose, onSubmit }: RequestModalProps) {
  const [formData, setFormData] = useState({
    bloodGroup: 'A+' as BloodGroup,
    location: '',
    phone: '',
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                  <Droplets size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">রক্তের অনুরোধ</h3>
                  <p className="text-slate-500 text-sm">জরুরি প্রয়োজনে রক্তের অনুরোধ করুন</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              onSubmit(formData);
              onClose();
            }} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">রক্তের গ্রুপ</label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setFormData({ ...formData, bloodGroup: group })}
                      className={`py-3 rounded-xl font-bold text-sm transition-all ${
                        formData.bloodGroup === group
                          ? 'bg-orange-600 text-white shadow-lg shadow-orange-200'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    required
                    placeholder="হাসপাতাল বা এলাকার নাম"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="tel"
                    required
                    placeholder="যোগাযোগের নম্বর"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-[0.98]"
              >
                অনুরোধ পাঠান
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

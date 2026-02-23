import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, LogIn, UserPlus, Droplets, MapPin, Phone, Calendar, Facebook, MessageCircle, Camera } from 'lucide-react';
import { User as UserType, BloodGroup } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserType) => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    bloodGroup: 'A+' as BloodGroup,
    location: '',
    phone: '',
    lastDonated: 'কখনো না',
    image: '',
    facebookUrl: '',
    whatsappNumber: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    // For registration, ensure we send all fields
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        onAuthSuccess(data);
        onClose();
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

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
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-red-600 text-white shrink-0">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {isLogin ? <LogIn size={24} /> : <UserPlus size={24} />}
                  {isLogin ? 'লগইন করুন' : 'দাতা হিসেবে নিবন্ধন করুন'}
                </h3>
                {!isLogin && <p className="text-xs text-red-100 mt-1">নিবন্ধন করলেই আপনার দাতা প্রোফাইল তৈরি হয়ে যাবে</p>}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              {/* Basic Account Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <User size={16} className="text-red-500" />
                      আপনার নাম
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="নাম লিখুন"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Mail size={16} className="text-red-500" />
                    ইমেইল
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="example@mail.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Lock size={16} className="text-red-500" />
                    পাসওয়ার্ড
                  </label>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-6 pt-4 border-t border-slate-100"
                >
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <Droplets size={18} className="text-red-600" />
                    দাতা প্রোফাইল তথ্য
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Droplets size={16} className="text-red-500" />
                        রক্তের গ্রুপ
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                      >
                        {BLOOD_GROUPS.map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Phone size={16} className="text-red-500" />
                        ফোন নম্বর
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="01xxxxxxxxx"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <MapPin size={16} className="text-red-500" />
                        বর্তমান ঠিকানা
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="শহর, জেলা"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Calendar size={16} className="text-red-500" />
                        সর্বশেষ রক্তদানের সময়
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="যেমন: ৩ মাস আগে"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        value={formData.lastDonated}
                        onChange={(e) => setFormData({ ...formData, lastDonated: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Camera size={16} className="text-red-500" />
                        প্রোফাইল ছবি (URL)
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/photo.jpg"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <MessageCircle size={16} className="text-red-500" />
                        হোয়াটসঅ্যাপ নম্বর
                      </label>
                      <input
                        type="tel"
                        placeholder="01xxxxxxxxx"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Facebook size={16} className="text-red-500" />
                        ফেসবুক প্রোফাইল লিংক
                      </label>
                      <input
                        type="url"
                        placeholder="https://facebook.com/yourprofile"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        value={formData.facebookUrl}
                        onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="shrink-0 pt-4">
                <button
                  disabled={isLoading}
                  type="submit"
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-red-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'প্রসেসিং হচ্ছে...' : (isLogin ? 'লগইন' : 'নিবন্ধন ও প্রোফাইল তৈরি')}
                </button>

                <p className="text-center text-slate-500 text-sm mt-4">
                  {isLogin ? 'অ্যাকাউন্ট নেই?' : 'ইতিমধ্যে অ্যাকাউন্ট আছে?'}
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="ml-2 text-red-600 font-bold hover:underline"
                  >
                    {isLogin ? 'নিবন্ধন করুন' : 'লগইন করুন'}
                  </button>
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

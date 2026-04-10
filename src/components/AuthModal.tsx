import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, LogIn, UserPlus, Droplets, MapPin, Phone, Calendar, Facebook, MessageCircle, Camera, Heart } from 'lucide-react';
import { User as UserType, BloodGroup } from '../types';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserType) => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'edit'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    newPassword: '',
    bloodGroup: 'A+' as BloodGroup,
    location: '',
    phone: '',
    lastDonated: 'কখনো না',
    image: '',
    facebookUrl: '',
    whatsappNumber: '',
    donationCount: 0,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('ছবির সাইজ ২ মেগাবাইটের বেশি হওয়া যাবে না');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Initialize form if editing
  React.useEffect(() => {
    const savedUser = localStorage.getItem('blood_user');
    if (savedUser && mode === 'edit') {
      const user = JSON.parse(savedUser);
      setFormData(prev => ({ 
        ...prev, 
        name: user.name, 
        email: user.email,
        donationCount: user.donationCount || 0
      }));
    }
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (userDoc.exists()) {
          onAuthSuccess({ id: result.user.uid, ...userDoc.data() } as UserType);
        }
        onClose();
      } else if (mode === 'register') {
        const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const userData = {
          uid: result.user.uid,
          name: formData.name,
          email: formData.email,
          role: 'user'
        };
        
        // Create user doc
        await setDoc(doc(db, 'users', result.user.uid), userData);
        
        // Create donor doc
        const donorData = {
          userId: result.user.uid,
          name: formData.name,
          bloodGroup: formData.bloodGroup,
          location: formData.location,
          phone: formData.phone,
          lastDonated: formData.lastDonated,
          image: formData.image,
          available: true,
          facebookUrl: formData.facebookUrl,
          whatsappNumber: formData.whatsappNumber,
          donationCount: formData.donationCount
        };
        await setDoc(doc(db, 'donors', result.user.uid), donorData);
        
        onAuthSuccess({ id: result.user.uid, ...userData } as UserType);
        onClose();
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, formData.email);
        setSuccess('পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে!');
        setMode('login');
      } else if (mode === 'edit') {
        const user = auth.currentUser;
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), {
            name: formData.name,
            email: formData.email
          });
          onAuthSuccess({ id: user.uid, name: formData.name, email: formData.email } as UserType);
          setSuccess('প্রোফাইল আপডেট হয়েছে!');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'লগইন করুন';
      case 'register': return 'দাতা হিসেবে নিবন্ধন করুন';
      case 'forgot': return 'পাসওয়ার্ড রিসেট';
      case 'edit': return 'প্রোফাইল এডিট';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'login': return <LogIn size={24} />;
      case 'register': return <UserPlus size={24} />;
      case 'forgot': return <Lock size={24} />;
      case 'edit': return <User size={24} />;
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
                  {getIcon()}
                  {getTitle()}
                </h3>
                {mode === 'register' && <p className="text-xs text-red-100 mt-1">নিবন্ধন করলেই আপনার দাতা প্রোফাইল তৈরি হয়ে যাবে</p>}
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
              {success && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-xl border border-emerald-100">
                  {success}
                </div>
              )}

              {/* Basic Account Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(mode === 'register' || mode === 'edit') && (
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

                {mode !== 'forgot' && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Lock size={16} className="text-red-500" />
                      {mode === 'edit' ? 'নতুন পাসওয়ার্ড (ঐচ্ছিক)' : 'পাসওয়ার্ড'}
                    </label>
                    <input
                      required={mode !== 'edit'}
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}

                {mode === 'forgot' && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Lock size={16} className="text-red-500" />
                      নতুন পাসওয়ার্ড
                    </label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {mode === 'register' && (
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
                        প্রোফাইল ছবি
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                          {formData.image ? (
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <Camera size={24} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="cursor-pointer inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-colors">
                            ছবি আপলোড করুন
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageChange}
                            />
                          </label>
                          <p className="text-[10px] text-slate-400 mt-1">JPG, PNG (সর্বোচ্চ ২MB)</p>
                        </div>
                      </div>
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

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Heart size={16} className="text-red-500" />
                        রক্তদানের সংখ্যা
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="০"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        value={formData.donationCount}
                        onChange={(e) => setFormData({ ...formData, donationCount: parseInt(e.target.value) || 0 })}
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
                  {isLoading ? 'প্রসেসিং হচ্ছে...' : (
                    mode === 'login' ? 'লগইন' : 
                    mode === 'register' ? 'নিবন্ধন ও প্রোফাইল তৈরি' :
                    mode === 'forgot' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'আপডেট করুন'
                  )}
                </button>

                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const result = await signInWithPopup(auth, googleProvider);
                        const user = result.user;
                        
                        // Check if user exists in Firestore
                        const userDoc = await getDoc(doc(db, 'users', user.uid));
                        if (!userDoc.exists()) {
                          const userData = {
                            uid: user.uid,
                            name: user.displayName || 'User',
                            email: user.email || '',
                            role: 'user'
                          };
                          await setDoc(doc(db, 'users', user.uid), userData);
                          onAuthSuccess({ id: user.uid, ...userData } as UserType);
                        } else {
                          onAuthSuccess({ id: user.uid, ...userDoc.data() } as UserType);
                        }
                        onClose();
                      } catch (error: any) {
                        console.error('Google login error:', error);
                        setError('Google login failed: ' + error.message);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="w-full mt-4 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google দিয়ে লগইন করুন
                  </button>
                )}

                <div className="flex flex-col gap-2 mt-4">
                  <p className="text-center text-slate-500 text-sm">
                    {mode === 'login' ? 'অ্যাকাউন্ট নেই?' : 'ইতিমধ্যে অ্যাকাউন্ট আছে?'}
                    <button
                      type="button"
                      onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                      className="ml-2 text-red-600 font-bold hover:underline"
                    >
                      {mode === 'login' ? 'নিবন্ধন করুন' : 'লগইন করুন'}
                    </button>
                  </p>
                  
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-center text-slate-400 text-xs hover:text-red-500 transition-colors"
                    >
                      পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                  )}
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

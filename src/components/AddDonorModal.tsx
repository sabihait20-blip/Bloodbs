import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, MapPin, Phone, Droplets, Calendar, Camera } from 'lucide-react';
import { BloodGroup, Donor } from '../types';

interface AddDonorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (donor: Donor) => void;
  onEdit?: (donor: Donor) => void;
  editDonor?: Donor | null;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const AddDonorModal: React.FC<AddDonorModalProps> = ({ isOpen, onClose, onAdd, onEdit, editDonor }) => {
  const [formData, setFormData] = useState({
    name: '',
    bloodGroup: 'O+' as BloodGroup,
    location: '',
    phone: '',
    lastDonated: 'কখনো না',
    image: '',
    facebookUrl: '',
    whatsappNumber: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('ছবির সাইজ ২ মেগাবাইটের বেশি হওয়া যাবে না');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  React.useEffect(() => {
    if (editDonor) {
      setFormData({
        name: editDonor.name,
        bloodGroup: editDonor.bloodGroup,
        location: editDonor.location,
        phone: editDonor.phone,
        lastDonated: editDonor.lastDonated,
        image: editDonor.image || '',
        facebookUrl: editDonor.facebookUrl || '',
        whatsappNumber: editDonor.whatsappNumber || '',
      });
    } else {
      setFormData({
        name: '',
        bloodGroup: 'O+' as BloodGroup,
        location: '',
        phone: '',
        lastDonated: 'কখনো না',
        image: '',
        facebookUrl: '',
        whatsappNumber: '',
      });
    }
  }, [editDonor, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editDonor && onEdit) {
      onEdit({
        ...editDonor,
        ...formData,
        image: formData.image || editDonor.image,
        facebookUrl: formData.facebookUrl || undefined,
        whatsappNumber: formData.whatsappNumber || undefined,
      });
    } else {
      const newDonor: Donor = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        image: formData.image || `https://picsum.photos/seed/${Math.random()}/400/400`,
        available: true,
        facebookUrl: formData.facebookUrl || undefined,
        whatsappNumber: formData.whatsappNumber || undefined,
      };
      onAdd(newDonor);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-red-600 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Droplets size={24} />
                {editDonor ? 'তথ্য পরিবর্তন করুন' : 'নতুন দাতা যোগ করুন'}
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User size={16} className="text-red-500" />
                  পুরো নাম
                </label>
                <input
                  required
                  type="text"
                  placeholder="উদা: আরিফ হোসেন"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Blood Group */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Droplets size={16} className="text-red-500" />
                    রক্তের গ্রুপ
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all appearance-none"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                  >
                    {BLOOD_GROUPS.map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Phone size={16} className="text-red-500" />
                    ফোন নম্বর
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="017XXXXXXXX"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <MapPin size={16} className="text-red-500" />
                  বর্তমান ঠিকানা
                </label>
                <input
                  required
                  type="text"
                  placeholder="উদা: ঢাকা, বাংলাদেশ"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              {/* Last Donated */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar size={16} className="text-red-500" />
                  শেষ রক্তদানের সময়
                </label>
                <input
                  type="text"
                  placeholder="উদা: ৩ মাস আগে বা কখনো না"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  value={formData.lastDonated}
                  onChange={(e) => setFormData({ ...formData, lastDonated: e.target.value })}
                />
              </div>

              {/* Profile Image */}
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

              <div className="grid grid-cols-2 gap-4">
                {/* Facebook URL */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-blue-600 font-bold">f</span>
                    ফেসবুক লিঙ্ক (ঐচ্ছিক)
                  </label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={formData.facebookUrl}
                    onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                  />
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-green-600 font-bold">W</span>
                    হোয়াটসঅ্যাপ (ঐচ্ছিক)
                  </label>
                  <input
                    type="tel"
                    placeholder="017XXXXXXXX"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-red-200 transition-all active:scale-95 mt-4"
              >
                নিবন্ধন সম্পন্ন করুন
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ isOpen, onClose, userId, onSuccess }) => {
  const [nidUrl, setNidUrl] = useState('');
  const [medicalReportUrl, setMedicalReportUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nidUrl || !medicalReportUrl) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'donors', userId), {
        nidUrl,
        medicalReportUrl,
        verificationStatus: 'pending'
      });
      onSuccess();
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `donors/${userId}`);
    } finally {
      setIsSubmitting(false);
    }
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
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">ভেরিফিকেশন</h2>
                    <p className="text-slate-500 text-sm">আপনার তথ্য যাচাই করুন</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3">
                  <AlertCircle className="text-blue-600 shrink-0" size={20} />
                  <p className="text-sm text-blue-800">
                    আপনার এনআইডি এবং মেডিকেল রিপোর্টের ছবির লিংক প্রদান করুন। অ্যাডমিন এটি যাচাই করে আপনাকে ভেরিফাইড ব্যাজ প্রদান করবেন।
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <FileText size={16} className="text-blue-600" />
                      এনআইডি ছবির লিংক (URL)
                    </label>
                    <input
                      required
                      type="url"
                      placeholder="https://example.com/nid.jpg"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                      value={nidUrl}
                      onChange={(e) => setNidUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Upload size={16} className="text-blue-600" />
                      মেডিকেল রিপোর্ট ছবির লিংক (URL)
                    </label>
                    <input
                      required
                      type="url"
                      placeholder="https://example.com/report.jpg"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                      value={medicalReportUrl}
                      onChange={(e) => setMedicalReportUrl(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      আবেদন জমা দিন
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

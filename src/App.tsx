import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Heart, Droplets, Users, Plus, MapPin, Settings, Shield, ShieldOff, LogIn, LogOut, User as UserIcon, Bell, X, Check, Phone, LayoutDashboard, Image as ImageIcon, Trash2 } from 'lucide-react';
import { DonorCard } from './components/DonorCard';
import { AddDonorModal } from './components/AddDonorModal';
import { AuthModal } from './components/AuthModal';
import { RequestModal } from './components/RequestModal';
import { AdBanner } from './components/AdBanner';
import { BloodGroup, Donor, User, Request } from './types';
import { db, auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, deleteDoc, getDocs, orderBy, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function App() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot' | 'edit'>('login');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'donors' | 'admin'>('donors');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const [notifications, setNotifications] = useState<Request[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<Request[]>([]);
  const [stats, setStats] = useState({
    totalDonors: 0,
    donationsCompleted: 0,
    urgentRequests: 0,
    activeDistricts: 0
  });

  const userDonorProfile = useMemo(() => {
    if (!currentUser) return null;
    return donors.find(d => d.userId === currentUser.id);
  }, [currentUser, donors]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = { id: firebaseUser.uid, ...userDoc.data() } as User;
          setCurrentUser(userData);
          // Check role from Firestore
          if (userData.role === 'admin' || userData.email === 'sabihait20@gmail.com') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setCurrentUser({ id: firebaseUser.uid, name: firebaseUser.displayName || 'User', email: firebaseUser.email || '' });
          if (firebaseUser.email === 'sabihait20@gmail.com') {
            setIsAdmin(true);
          }
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setActiveTab('donors');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Remove the second useEffect for isAdmin as it's now handled in the auth listener

  // Firestore Listeners
  useEffect(() => {
    const donorsUnsubscribe = onSnapshot(collection(db, 'donors'), (snapshot) => {
      const donorsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donor));
      setDonors(donorsList);
      
      const uniqueDistricts = new Set(donorsList.map(d => d.location)).size;
      const totalDonations = donorsList.reduce((acc, curr) => acc + (curr.donationCount || 0), 0);
      setStats(prev => ({
        ...prev,
        totalDonors: donorsList.length,
        donationsCompleted: totalDonations,
        activeDistricts: uniqueDistricts
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'donors');
    });

    const requestsUnsubscribe = onSnapshot(collection(db, 'requests'), (snapshot) => {
      const allRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request));
      setNotifications(allRequests.filter(r => r.status === 'pending'));
      setAcceptedRequests(allRequests.filter(r => r.status === 'accepted'));
      setStats(prev => ({
        ...prev,
        urgentRequests: allRequests.filter(r => r.status === 'pending').length
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'requests');
    });

    return () => {
      donorsUnsubscribe();
      requestsUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleAddRequest = async (request: { requesterName: string; bloodGroup: BloodGroup; location: string; phone: string }) => {
    try {
      await addDoc(collection(db, 'requests'), {
        ...request,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      showToast('আপনার অনুরোধটি সফলভাবে গ্রহণ করা হয়েছে। এটি অনুমোদনের জন্য অপেক্ষমান।');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'requests');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'accepted' | 'rejected', phone?: string) => {
    try {
      await updateDoc(doc(db, 'requests', id), { status });
      if (status === 'accepted' && phone) {
        window.location.href = `tel:${phone}`;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `requests/${id}`);
    }
  };

  const handleLogDonation = async () => {
    if (!userDonorProfile) {
      showToast('অনুগ্রহ করে আগে দাতা হিসেবে নিবন্ধন করুন।', 'error');
      return;
    }
    try {
      const donorRef = doc(db, 'donors', userDonorProfile.id);
      await updateDoc(donorRef, {
        donationCount: (userDonorProfile.donationCount || 0) + 1,
        lastDonated: new Date().toLocaleDateString('bn-BD')
      });
      showToast('অভিনন্দন! আপনার রক্তদান সফলভাবে রেকর্ড করা হয়েছে।');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `donors/${userDonorProfile.id}`);
    }
  };

  const handleAddDonor = async (donorData: Omit<Donor, 'id'>) => {
    try {
      if (editingDonor) {
        await updateDoc(doc(db, 'donors', editingDonor.id), donorData);
        setEditingDonor(null);
      } else {
        // Use userId as doc ID if available
        const docId = currentUser?.id || doc(collection(db, 'donors')).id;
        await setDoc(doc(db, 'donors', docId), {
          ...donorData,
          userId: currentUser?.id || null
        });
      }
      setIsModalOpen(false);
      showToast('তথ্য সফলভাবে সংরক্ষিত হয়েছে।');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, editingDonor ? `donors/${editingDonor.id}` : 'donors');
    }
  };

  const handleDeleteDonor = async (id: string) => {
    setConfirmAction({
      message: 'আপনি কি নিশ্চিতভাবে এই দাতা প্রোফাইলটি ডিলিট করতে চান?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'donors', id));
          showToast('দাতা প্রোফাইলটি ডিলিট করা হয়েছে।');
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `donors/${id}`);
        }
        setConfirmAction(null);
      }
    });
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const filteredDonors = useMemo(() => {
    return donors.filter(donor => {
      const matchesGroup = selectedGroup === 'All' || donor.bloodGroup === selectedGroup;
      const matchesSearch = donor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           donor.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [donors, selectedGroup, searchQuery]);

  const filteredRequests = useMemo(() => {
    return acceptedRequests.filter(req => {
      const matchesGroup = selectedGroup === 'All' || req.bloodGroup === selectedGroup;
      const matchesSearch = req.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           req.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [acceptedRequests, selectedGroup, searchQuery]);

  return (
    <div className="min-h-screen">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl font-bold text-white flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? <Check size={20} /> : <X size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmAction(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-4">
                <ShieldOff size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">নিশ্চিত করুন</h3>
              <p className="text-slate-500 mb-8">{confirmAction.message}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  onClick={confirmAction.onConfirm}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                  হ্যাঁ, ডিলিট করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications Overlay */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-red-100 p-4 w-80 overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                  <Bell size={20} className="animate-bounce" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 text-sm">জরুরি রক্তের অনুরোধ!</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-bold text-red-600">{notif.bloodGroup}</span> রক্তের প্রয়োজন
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin size={10} /> {notif.location}
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <UserIcon size={10} /> {notif.requesterName}
                  </p>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleUpdateStatus(notif.id, 'accepted', notif.phone)}
                      className="flex-1 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <Check size={14} /> গ্রহণ করুন
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(notif.id, 'rejected')}
                      className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200"
            >
              <Heart className="text-white fill-current" size={24} />
            </motion.div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
              রক্তদান
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={() => setActiveTab(activeTab === 'donors' ? 'admin' : 'donors')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors ${
                  activeTab === 'admin' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {activeTab === 'donors' ? <LayoutDashboard size={20} /> : <Users size={20} />}
                {activeTab === 'donors' ? 'অ্যাডমিন ড্যাশবোর্ড' : 'হোম'}
              </button>
            )}
            
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setAuthModalMode('edit');
                    setIsAuthModalOpen(true);
                  }}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <UserIcon size={16} className="text-red-500" />
                  <span className="text-sm font-medium">{currentUser.name}</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                  title="লগআউট"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-full font-semibold hover:bg-slate-200 transition-colors"
              >
                <LogIn size={20} />
                <span className="hidden sm:inline">লগইন</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={handleAuthSuccess} 
        initialMode={authModalMode}
      />

      {activeTab === 'admin' && isAdmin ? (
        <AdminDashboard setConfirmAction={setConfirmAction} showToast={showToast} />
      ) : (
        <>
          {/* User Dashboard Section */}
      {currentUser && (
        <section className="max-w-7xl mx-auto px-4 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-red-600 to-red-700 rounded-[2rem] p-8 text-white shadow-2xl shadow-red-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              {/* User Card */}
              <div className="w-full md:w-80 shrink-0">
                <div className="bg-white rounded-3xl p-6 text-slate-900 shadow-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 font-bold text-2xl">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-tight">{currentUser.name}</h4>
                      <p className="text-slate-500 text-sm">{currentUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-500 text-sm">স্ট্যাটাস</span>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-xs font-bold rounded-lg">সক্রিয় দাতা</span>
                    </div>
                    <button 
                      onClick={() => {
                        setAuthModalMode('edit');
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <UserIcon size={16} />
                      প্রোফাইল এডিট
                    </button>
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-3xl font-bold mb-4">স্বাগতম, {currentUser.name}!</h3>
                <p className="text-red-100 mb-8 max-w-xl">
                  আপনার রক্তদান ড্যাশবোর্ডে আপনাকে স্বাগতম। এখান থেকে আপনি আপনার তথ্য আপডেট করতে পারেন এবং আপনার রক্তদানের ইতিহাস দেখতে পারেন।
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                    <p className="text-red-100 text-xs mb-1">মোট রক্তদান</p>
                    <p className="text-2xl font-bold">{userDonorProfile?.donationCount || 0} বার</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                    <p className="text-red-100 text-xs mb-1">পরবর্তী রক্তদান</p>
                    <p className="text-2xl font-bold">এখনই সম্ভব</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                    <p className="text-red-100 text-xs mb-1">গৃহীত অনুরোধ</p>
                    <p className="text-2xl font-bold">{acceptedRequests.length} টি</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                    <p className="text-red-100 text-xs mb-1">পয়েন্টস</p>
                    <p className="text-2xl font-bold">{(userDonorProfile?.donationCount || 0) * 50 + 50}</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button 
                    onClick={handleLogDonation}
                    className="px-6 py-3 bg-white text-red-600 rounded-2xl font-bold shadow-xl hover:bg-red-50 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Heart size={18} className="fill-current" />
                    রক্তদান সম্পন্ন করেছি
                  </button>
                  <div className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium border border-white/30">
                    রক্তের গ্রুপ: <span className="font-bold">{userDonorProfile?.bloodGroup || 'নির্ধারিত নয়'}</span>
                  </div>
                  <div className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium border border-white/30">
                    অবস্থান: <span className="font-bold">{userDonorProfile?.location || 'নির্ধারিত নয়'}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      <RequestModal 
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmit={handleAddRequest}
      />

      <AddDonorModal 
        isOpen={isModalOpen || !!editingDonor} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingDonor(null);
        }} 
        onAdd={handleAddDonor}
        onEdit={handleAddDonor}
        editDonor={editingDonor}
        showToast={showToast}
      />

      {/* Hero Section */}
      <section className="relative py-12 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-red-500/5 blur-[120px] rounded-full" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight"
          >
            এক ব্যাগ রক্ত, <span className="text-red-600">একটি জীবন</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto"
          >
            আপনার রক্তদান হতে পারে কারো বেঁচে থাকার শেষ আশা। আজই রক্তদাতা খুঁজুন অথবা নিজে রক্তদাতা হিসেবে নিবন্ধিত হোন।
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <button 
              onClick={() => setIsRequestModalOpen(true)}
              className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 flex items-center gap-2"
            >
              <Droplets size={20} />
              রক্তের অনুরোধ করুন
            </button>
          </motion.div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="নাম বা এলাকা দিয়ে খুঁজুন..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Blood Group Filter */}
            <div className="flex-1 w-full overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 min-w-max">
                <button
                  onClick={() => setSelectedGroup('All')}
                  className={`px-6 py-2.5 rounded-2xl font-semibold transition-all ${
                    selectedGroup === 'All' 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  সবগুলো
                </button>
                {BLOOD_GROUPS.map((group) => (
                  <button
                    key={group}
                    onClick={() => setSelectedGroup(group)}
                    className={`px-6 py-2.5 rounded-2xl font-semibold transition-all ${
                      selectedGroup === group 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Summary */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'মোট দাতা', value: `${stats.totalDonors}`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'রক্তদান সম্পন্ন', value: `${stats.donationsCompleted}`, icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'জরুরি অনুরোধ', value: `${stats.urgentRequests}`, icon: Droplets, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'সক্রিয় এলাকা', value: `${stats.activeDistricts} জেলা`, icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-red-100 transition-colors group"
            >
              <motion.div 
                animate={stat.icon === Droplets || stat.icon === Heart ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}
              >
                <stat.icon size={24} />
              </motion.div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Urgent Blood Requests */}
      {filteredRequests.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Droplets className="text-red-600 animate-pulse" />
              জরুরি রক্তের অনুরোধ
              <span className="text-sm font-normal text-slate-500 bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                {filteredRequests.length} টি সক্রিয়
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode='popLayout'>
              {filteredRequests.map((req) => (
                <motion.div
                  key={req.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-[2rem] p-6 border-2 border-red-50 shadow-xl shadow-red-100/50 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-200">
                        {req.bloodGroup}
                      </div>
                      <div className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        Urgent
                      </div>
                    </div>

                    <h4 className="text-xl font-bold text-slate-900 mb-1">{req.requesterName}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <MapPin size={16} className="text-red-400" />
                        {req.location}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Phone size={16} className="text-red-400" />
                        {req.phone}
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <a
                        href={`tel:${req.phone}`}
                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                      >
                        <Phone size={16} /> কল করুন
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Donor List */}
      <main className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            রক্তদাতাদের তালিকা
            <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredDonors.length} জন পাওয়া গেছে
            </span>
          </h3>
        </div>

        {filteredDonors.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode='popLayout'>
              {filteredDonors.map((donor) => (
                <DonorCard 
                  key={donor.id} 
                  donor={donor} 
                  isAdmin={isAdmin}
                  currentUserId={currentUser?.id}
                  onEdit={(d) => setEditingDonor(d)}
                  onDelete={handleDeleteDonor}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-slate-300" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800">কোনো দাতা পাওয়া যায়নি</h4>
            <p className="text-slate-500 mt-1">অনুগ্রহ করে অন্য কোনো গ্রুপ বা এলাকা দিয়ে চেষ্টা করুন।</p>
          </motion.div>
        )}
      </main>
        </>
      )}

      {/* Footer / Contact */}
      <AdBanner />
      <footer className="mt-20 border-t border-slate-100 pt-12 pb-8 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="text-red-600 fill-current" size={20} />
            <span className="font-bold text-white">রক্তদান ডট কম</span>
          </div>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
            আমাদের লক্ষ্য প্রতিটি মুমূর্ষু রোগীর জন্য সঠিক সময়ে রক্তের ব্যবস্থা করা। আপনার একটি মহৎ কাজ বাঁচাতে পারে একটি প্রাণ।
          </p>
          
          <div className="py-6">
            <p className="text-slate-500 text-xs">
              © {new Date().getFullYear()} রক্তদান। সর্বস্বত্ব সংরক্ষিত।
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AdminDashboard({ setConfirmAction, showToast }: { setConfirmAction: (action: any) => void; showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [ads, setAds] = useState<any[]>([]);
  const [newAd, setNewAd] = useState({ image: '', link: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'ads'), (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ads');
    });
    return () => unsubscribe();
  }, []);

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAd.image || !newAd.link) return;
    try {
      await addDoc(collection(db, 'ads'), newAd);
      setNewAd({ image: '', link: '' });
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'ads');
    }
  };

  const handleDeleteAd = async (id: string) => {
    setConfirmAction({
      message: 'আপনি কি নিশ্চিতভাবে এই বিজ্ঞাপনটি ডিলিট করতে চান?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'ads', id));
          showToast('বিজ্ঞাপনটি ডিলিট করা হয়েছে।');
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `ads/${id}`);
        }
        setConfirmAction(null);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold mb-8">অ্যাডমিন ড্যাশবোর্ড</h2>
      
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ImageIcon /> বিজ্ঞাপন ম্যানেজমেন্ট
          </h3>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
          >
            {isAdding ? 'বাতিল করুন' : '+ নতুন বিজ্ঞাপন'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddAd} className="mb-8 p-6 bg-slate-50 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">ছবির লিংক (URL)</label>
                <input
                  required
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  value={newAd.image}
                  onChange={(e) => setNewAd({ ...newAd, image: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">বিজ্ঞাপনের লিংক (URL)</label>
                <input
                  required
                  type="url"
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  value={newAd.link}
                  onChange={(e) => setNewAd({ ...newAd, link: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
              বিজ্ঞাপন যোগ করুন
            </button>
          </form>
        )}
        
        <div className="space-y-4">
          {ads.length === 0 ? (
            <p className="text-center py-8 text-slate-400">কোনো বিজ্ঞাপন পাওয়া যায়নি</p>
          ) : (
            ads.map((ad, index) => (
              <div key={ad.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                <img src={ad.image} alt="Ad" className="w-20 h-20 object-cover rounded-xl" />
                <div className="flex-1">
                  <p className="font-bold">বিজ্ঞাপন {index + 1}</p>
                  <p className="text-sm text-slate-500 truncate max-w-xs md:max-w-md">{ad.link}</p>
                </div>
                <button 
                  onClick={() => handleDeleteAd(ad.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

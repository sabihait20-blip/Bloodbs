import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Heart, Droplets, Users, Plus, MapPin, Settings, Shield, ShieldOff } from 'lucide-react';
import { DonorCard } from './components/DonorCard';
import { AddDonorModal } from './components/AddDonorModal';
import { MOCK_DONORS } from './constants';
import { BloodGroup, Donor } from './types';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function App() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);

  // Fetch donors from API on mount
  const fetchDonors = async () => {
    try {
      const response = await fetch('/api/donors');
      if (response.ok) {
        const data = await response.json();
        setDonors(data);
      }
    } catch (error) {
      console.error('Failed to fetch donors:', error);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const handleAddDonor = async (newDonor: Donor) => {
    try {
      const response = await fetch('/api/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDonor),
      });
      if (response.ok) {
        fetchDonors();
      }
    } catch (error) {
      console.error('Failed to add donor:', error);
    }
  };

  const handleEditDonor = async (updatedDonor: Donor) => {
    try {
      const response = await fetch(`/api/donors/${updatedDonor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDonor),
      });
      if (response.ok) {
        fetchDonors();
      }
    } catch (error) {
      console.error('Failed to edit donor:', error);
    }
    setEditingDonor(null);
  };

  const handleDeleteDonor = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে আপনি এই দাতার তথ্য মুছে ফেলতে চান?')) {
      try {
        const response = await fetch(`/api/donors/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchDonors();
        }
      } catch (error) {
        console.error('Failed to delete donor:', error);
      }
    }
  };

  const toggleAdmin = () => {
    if (!isAdmin) {
      const pass = window.prompt('অ্যাডমিন পাসওয়ার্ড দিন (ডিফল্ট: admin):');
      if (pass === 'admin') {
        setIsAdmin(true);
      } else {
        alert('ভুল পাসওয়ার্ড!');
      }
    } else {
      setIsAdmin(false);
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

  return (
    <div className="min-h-screen pb-20">
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
            <button 
              onClick={toggleAdmin}
              className={`p-2 rounded-full transition-colors ${isAdmin ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              title={isAdmin ? "অ্যাডমিন মোড বন্ধ করুন" : "অ্যাডমিন মোড চালু করুন"}
            >
              {isAdmin ? <ShieldOff size={20} /> : <Shield size={20} />}
            </button>
            <button 
              onClick={() => {
                setEditingDonor(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full font-semibold hover:bg-red-100 transition-colors"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">দাতা হিসেবে যোগ দিন</span>
            </button>
          </div>
        </div>
      </header>

      <AddDonorModal 
        isOpen={isModalOpen || !!editingDonor} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingDonor(null);
        }} 
        onAdd={handleAddDonor}
        onEdit={handleEditDonor}
        editDonor={editingDonor}
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
            { label: 'মোট দাতা', value: '১২৫০+', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'রক্তদান সম্পন্ন', value: '৪৫০০+', icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'জরুরি অনুরোধ', value: '১২', icon: Droplets, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'সক্রিয় এলাকা', value: '৬৪ জেলা', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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

      {/* Footer / Contact */}
      <footer className="mt-20 border-t border-slate-100 pt-12 pb-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="text-red-600 fill-current" size={20} />
            <span className="font-bold text-slate-900">রক্তদান ডট কম</span>
          </div>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
            আমাদের লক্ষ্য প্রতিটি মুমূর্ষু রোগীর জন্য সঠিক সময়ে রক্তের ব্যবস্থা করা। আপনার একটি মহৎ কাজ বাঁচাতে পারে একটি প্রাণ।
          </p>
          <div className="flex items-center justify-center gap-6 text-slate-400">
            <a href="#" className="hover:text-red-600 transition-colors">ফেসবুক</a>
            <a href="#" className="hover:text-red-600 transition-colors">টুইটার</a>
            <a href="#" className="hover:text-red-600 transition-colors">ইনস্টাগ্রাম</a>
          </div>
          <p className="mt-12 text-xs text-slate-400">
            © ২০২৬ রক্তদান - জীবন বাঁচান। সকল অধিকার সংরক্ষিত।
          </p>
        </div>
      </footer>
    </div>
  );
}

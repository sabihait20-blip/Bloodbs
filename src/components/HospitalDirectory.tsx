import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Hospital } from '../types';
import { MapPin, Phone, Building2, Droplets } from 'lucide-react';

export const HospitalDirectory: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'hospitals'), (snapshot) => {
      setHospitals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hospital)));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Building2 className="text-red-600" /> হাসপাতাল ও ব্লাড ব্যাংক
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals.map(h => (
          <div key={h.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${h.type === 'hospital' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
              {h.type === 'hospital' ? <Building2 size={24} /> : <Droplets size={24} />}
            </div>
            <h3 className="font-bold text-lg text-slate-900">{h.name}</h3>
            <p className="text-slate-500 text-sm flex items-center gap-1 mt-2">
              <MapPin size={16} /> {h.location}
            </p>
            <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
              <Phone size={16} /> {h.phone}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

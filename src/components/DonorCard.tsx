import React from 'react';
import { motion } from 'motion/react';
import { Phone, MapPin, Calendar, Droplets, Facebook, MessageCircle, Edit2, Trash2 } from 'lucide-react';
import { Donor } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DonorCard: React.FC<{ 
  donor: Donor; 
  isAdmin?: boolean;
  onEdit?: (donor: Donor) => void;
  onDelete?: (id: string) => void;
}> = ({ donor, isAdmin, onEdit, onDelete }) => {
  const whatsappUrl = donor.whatsappNumber 
    ? `https://wa.me/${donor.whatsappNumber.replace(/\D/g, '')}` 
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-100 group"
    >
      {/* Admin Controls */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            onClick={() => onEdit?.(donor)}
            className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-full text-slate-600 hover:text-blue-600 hover:bg-white transition-all"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete?.(donor.id)}
            className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-full text-slate-600 hover:text-red-600 hover:bg-white transition-all"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
      
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Profile Image */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-red-100 shadow-inner">
              <img
                src={donor.image}
                alt={donor.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className={cn(
              "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white",
              donor.available ? "bg-emerald-500" : "bg-slate-300"
            )} />
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 pr-12">{donor.name}</h3>
              {!isAdmin && (
                <motion.div 
                  animate={{ 
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 10px 15px -3px rgba(220, 38, 38, 0.1), 0 4px 6px -2px rgba(220, 38, 38, 0.05)",
                      "0 20px 25px -5px rgba(220, 38, 38, 0.3), 0 10px 10px -5px rgba(220, 38, 38, 0.1)",
                      "0 10px 15px -3px rgba(220, 38, 38, 0.1), 0 4px 6px -2px rgba(220, 38, 38, 0.05)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center justify-center w-12 h-12 bg-red-600 rounded-lg shadow-lg"
                >
                  <span className="text-white font-bold text-lg">{donor.bloodGroup}</span>
                </motion.div>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
              <MapPin size={14} />
              {donor.location}
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3 mt-3">
              {donor.facebookUrl && (
                <a 
                  href={donor.facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                  title="Facebook Profile"
                >
                  <Facebook size={16} />
                </a>
              )}
              {whatsappUrl && (
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                  title="WhatsApp Chat"
                >
                  <MessageCircle size={16} />
                </a>
              )}
              {isAdmin && (
                <div className="ml-auto bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-bold">
                  {donor.bloodGroup}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Details (Visiting Card Style) */}
        <div className="mt-6 space-y-3 border-t border-slate-50 pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar size={16} className="text-red-500" />
              <span>শেষ রক্তদান:</span>
            </div>
            <span className="font-medium text-slate-800">{donor.lastDonated}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Droplets size={16} className="text-red-500" />
              <span>অবস্থা:</span>
            </div>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-semibold",
              donor.available ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
            )}>
              {donor.available ? 'রক্ত দিতে পারবেন' : 'এখন পারবেন না'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <a
          href={`tel:${donor.phone}`}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-200 group/btn"
        >
          <Phone size={18} className="group-hover/btn:animate-bounce" />
          কল করুন
        </a>
      </div>
    </motion.div>
  );
}

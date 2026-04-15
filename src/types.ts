export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin';
  isVerified?: boolean;
  points?: number;
  badges?: string[];
}

export interface Request {
  id: string;
  requesterName: string;
  bloodGroup: BloodGroup;
  location: string;
  phone: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Donor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  location: string;
  phone: string;
  lastDonated: string;
  image: string;
  available: boolean;
  donationCount?: number;
  facebookUrl?: string;
  whatsappNumber?: string;
  userId?: string;
  isVerified?: boolean;
  points?: number;
  badges?: string[];
  nidUrl?: string;
  medicalReportUrl?: string;
}

export interface Hospital {
  id: string;
  name: string;
  location: string;
  phone: string;
  type: 'hospital' | 'blood_bank';
}

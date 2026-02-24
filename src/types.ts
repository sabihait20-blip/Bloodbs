export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface User {
  id: string;
  name: string;
  email: string;
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
  facebookUrl?: string;
  whatsappNumber?: string;
  userId?: string;
}

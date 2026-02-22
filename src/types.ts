export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

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
}

import { createClient } from '@supabase/supabase-js';
import { Donor } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// This client will be used to interact with your Supabase database
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const donorService = {
  async fetchDonors(): Promise<Donor[]> {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('donors')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching donors:', error);
      return [];
    }
    return data as Donor[];
  },

  async addDonor(donor: Donor) {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('donors')
      .insert([donor]);
      
    if (error) throw error;
  },

  async updateDonor(donor: Donor) {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('donors')
      .update(donor)
      .eq('id', donor.id);
      
    if (error) throw error;
  },

  async deleteDonor(id: string) {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('donors')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
};

import { getToken } from 'firebase/messaging';
import { messaging, db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export const requestNotificationPermission = async (userId: string) => {
  if (!messaging) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BLce4XUlnXEsVdq8QNQXq10LtlFrmsIdys3ymDdAGKXPkL_RS4hTtCb_q2kcuFldQGCs6KabBsRN9or4CTH_5To'
      });

      if (token) {
        // Store token in user's document
        await updateDoc(doc(db, 'users', userId), {
          fcmTokens: arrayUnion(token)
        });
        return token;
      }
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
  }
  return null;
};

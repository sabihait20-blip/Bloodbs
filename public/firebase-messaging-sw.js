importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// These values must match your firebase-applet-config.json
firebase.initializeApp({
  apiKey: "AIzaSyAk9vWC9WXVVzuGTR8BjHDwXPnQzzaNHAw",
  authDomain: "gen-lang-client-0513016851.firebaseapp.com",
  projectId: "gen-lang-client-0513016851",
  storageBucket: "gen-lang-client-0513016851.firebasestorage.app",
  messagingSenderId: "189713485292",
  appId: "1:189713485292:web:f3f7102d311d7d70c3c4c9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

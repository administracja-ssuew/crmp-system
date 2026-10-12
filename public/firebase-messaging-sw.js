/* Service worker CRA: odbiór powiadomień push w tle (Firebase Cloud Messaging).
   Konfiguracja Firebase przychodzi w query stringu rejestracji (pliki z public/ nie przechodzą przez Vite).
   Powiadomienia z polem webpush.notification wyświetla SDK; kliknięcie otwiera fcmOptions.link. */
importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-messaging-compat.js');

const config = Object.fromEntries(new URL(self.location.href).searchParams.entries());
firebase.initializeApp(config);
firebase.messaging();

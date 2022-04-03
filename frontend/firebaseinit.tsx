// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import * as Analytics from 'expo-firebase-analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "YOUR_GOOGLE_API_KEY",
  authDomain: "your-firebase-project.firebaseapp.com",
  databaseURL: "https://your-firebase-project-default-rtdb.firebaseio.com",
  projectId: "your-firebase-project",
  storageBucket: "your-firebase-project.appspot.com",
  messagingSenderId: "YOUR_FIREBASE_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
initializeApp(firebaseConfig);

Analytics.logEvent('pageview');
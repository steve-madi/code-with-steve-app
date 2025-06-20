import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBBFia2vvkPuLOmrONtD82Cnr3jPYz4iNA",
    authDomain: "code-with-steve-4e57e.firebaseapp.com",
    projectId: "code-with-steve-4e57e",
    storageBucket: "code-with-steve-4e57e.firebasestorage.app",
    messagingSenderId: "577891729527",
    appId: "1:577891729527:web:0bcdaec6a1e80db28d0672"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };


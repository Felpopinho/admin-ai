import admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json' with { type: 'json' };

const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
export { firebaseApp, db };
import credentials from './src/firebase/credentials.json' assert { type: 'json' };
import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

initializeApp(credentials);

const functions = getFunctions();
const setup = httpsCallable(functions, 'setup');

try {
    const response = await setup();

    if ('data' in response && response.data !== null && 'error' in response.data) {
        console.log("Failed to set up Firestore.");
        console.log(`Error: ${response.data.error}`);
    }

    console.log("Success!");
} catch (error) {
    if ('code' in error && error.code === 'functions/not-found') {
        console.log("Failed to set up Firestore.");
        console.log("Make sure you have run `npm run deploy` to deploy serverless cloud functions.");
    } else {
        throw error;
    }
}
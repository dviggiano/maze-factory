import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { HttpsCallableResult, getFunctions, httpsCallable } from 'firebase/functions';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth/react-native';
import credentials from './credentials.json'
import { MazeDocument, MazeTemplate, UserDocument } from '../types/firebase';

const app = initializeApp(credentials);
const functions = getFunctions();
export const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

/**
 * Detects errors from a cloud function response,
 * and throws an error if one is found.
 * @param {HttpsCallableResult} response the response from the cloud function
 * @param {string} message the error message
 */
function handleError(response: HttpsCallableResult, message: string) {
    if (typeof response.data === 'object' && 'error' in response.data) {
        console.log(response.data.error);
        throw new Error(message);
    }
}

/**
 * Retreives maze data from Cloud Firestore.
 * @param {string} id the maze document ID
 * @return {Promise<MazeDocument>} the maze data
 */
export async function getMaze(id: string): Promise<MazeDocument> {
    const fn = httpsCallable(functions, 'getMaze');
    const response = await fn({ id: id });
    handleError(response, 'Failed to get maze data.');
    return response.data as MazeDocument;
}

/**
 * Sets a new record for a maze in Cloud Firestore.
 * @param {string} uid the new recordholder's UID
 * @param {string} mazeId the maze document ID
 * @param {number} time the new record time
 */
export async function beatRecord(uid: string, mazeId: string, time: number) {
    const fn = httpsCallable(functions, 'beatRecord');
    const response = await fn({ uid: uid, mazeId: mazeId, time: time });
    handleError(response, 'Failed to set record.');
}

/**
 * Retrieves user data from Cloud Firestore.
 * @param {string} uid the user's UID
 * @return {Promise<UserDocument>} the user data
 */
export async function getUser(uid: string): Promise<UserDocument> {
    const fn = httpsCallable(functions, 'getUser');
    const response = await fn({ uid: uid });
    handleError(response, `Failed to get user data for ${uid}.`);
    return response.data as UserDocument;
}

/**
 * Retrieves all mazes from Cloud Firestore.
 * @return {Promise<MazeDocument[]>} an array of maze data
 */
export async function getMazes(): Promise<MazeDocument[]> {
    const fn = httpsCallable(functions, 'getMazes');
    const response = await fn();
    handleError(response, 'Failed to get mazes.');
    return response.data as MazeDocument[];
}

/**
 * Retrieves mazes from Cloud Firestore that match a certain search query.
 * @param {string} query the search query
 * @return {Promise<MazeDocument[]>} the search results
 */
export async function searchMazes(query: string): Promise<MazeDocument[]> {
    const fn = httpsCallable(functions, 'searchMazes');
    const response = await fn({ query: query });
    handleError(response, 'Failed to get mazes.');
    return response.data as MazeDocument[];
}

/**
 * Creates a new maze document in Cloud Firestore.
 * @param {string} name the name of the maze
 * @param {string} uid the UID of the maze's creator
 * @param {string} color the maze's color
 * @param {MazeTemplate} template the maze's template
 * @return {Promise<MazeDocument>} the maze data
 */
export async function createMaze(name: string, uid: string, color: string, template: MazeTemplate): Promise<MazeDocument> {
    const fn = httpsCallable(functions, 'createMaze');
    const response = await fn({ name: name, uid: uid, color: color, template: template });
    handleError(response, 'Failed to create maze.');
    return response.data as MazeDocument;
}

/**
 * Adds a maze to the user's favorite list.
 * @param uid the user's UID
 * @param mazeId the maze document ID
 */
export async function setFavorite(uid: string, mazeId: string) {
    const fn = httpsCallable(functions, 'setFavorite');
    const response = await fn({ uid: uid, mazeId: mazeId });
    handleError(response, 'Failed to set favorite.');
}

/**
 * Removes a maze from the user's favorite list.
 * @param uid the user's UID
 * @param mazeId the maze document ID
 */
export async function removeFavorite(uid: string, mazeId: string) {
    const fn = httpsCallable(functions, 'removeFavorite');
    const response = await fn({ uid: uid, mazeId: mazeId });
    handleError(response, 'Failed to remove favorite.');
}

/**
 * Creates a new user document in Cloud Firestore.
 * @param {string} uid the user's UID
 * @param {string} email the user's email
 * @return {Promise<UserDocument>} the user data
 */
export async function createUser(uid: string, email: string): Promise<UserDocument> {
    const fn = httpsCallable(functions, 'createUser');
    const response = await fn({ uid: uid, email: email });
    handleError(response, 'Failed to create user.');
    return response.data as UserDocument;
}

/**
 * Resets a user's play count of a maze in Cloud Firestore.
 * @param {string} uid the user's UID
 * @param {string} id the maze document ID
 */
export async function resetPlays(uid: string, id: string) {
    const fn = httpsCallable(functions, 'resetPlays');
    const response = await fn({ uid: uid, id: id });
    handleError(response, 'Failed to reset plays.');
}

/**
 * Increments the play count of a maze in Cloud Firestore.
 * @param {string} uid the user's UID
 * @param {string} id the maze document ID
 */
export async function registerPlay(uid: string, id: string) {
    const fn = httpsCallable(functions, 'registerPlay');
    const response = await fn({ uid: uid, id: id });
    handleError(response, 'Failed to register play.');
}

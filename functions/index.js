const admin = require('firebase-admin');
const functions = require('firebase-functions');
const BadWordsFilter = require('bad-words');

admin.initializeApp();

const success = { message: 'Document written successfully.' };
const db = admin.firestore();
const filter = new BadWordsFilter();

function verify(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Caller is unauthenticated.');
    }
}

async function username(uid) {
    try {
        const doc = await db.collection('users').doc(uid).get();
        const user = doc.data();
        return user.email.slice(0, user.email.indexOf('@'));
    } catch (_) {
        return 'some maze maker';
    }
}

exports.setup = functions.https.onCall(async () => {
   try {
       await db.collection('popular').doc('0').set({ plays: 0 });
       await db.collection('popular').doc('1').set({ plays: 0 });
       await db.collection('popular').doc('2').set({ plays: 0 });
       await db.collection('maze-collection').doc('data').set({ size: 0 });
   } catch (error) {
       console.error(error);
       return { error: error.message };
   }
});

exports.getMaze = functions.https.onCall(async (data, context) => {
    try {
        verify(context);
        const docRef = db.collection('mazes').doc(data.id);
        const docSnap = await docRef.get();
        const maze = docSnap.data();
        maze.recordTime = maze.recordTime === Infinity ? Math.pow(2, 53) - 1 : maze.recordTime;
        return maze;
    } catch (error) {
        console.error(error);
        return { error: error.message };
    }
});

exports.beatRecord = functions.https.onCall(async (data, context) => {
    try {
        verify(context);
        const docRef = db.collection('mazes').doc(data.mazeId);
        const oldUser = (await docRef.get()).data().recordHolder;

        if (oldUser !== null) {
            const oldUserRef = db.collection('users').doc(oldUser);
            await oldUserRef.update({ records: admin.firestore.FieldValue.increment(-1) });
        }

        await docRef.update({
            recordTime: data.time,
            recordHolder: data.uid
        });

        const oldUserRef = db.collection('users').doc(data.uid);
        await oldUserRef.update({ records: admin.firestore.FieldValue.increment(1) });

        return success;
    } catch (error) {
        console.error(error);
        return { error: error.message };
    }
});

exports.getUser = functions.https.onCall(async (data, context) => {
    try {
        verify(context);
        const users = db.collection('users');
        const snapshot = await users.orderBy('records', 'desc').get();
        const userRef = users.doc(data.uid);
        const user = (await userRef.get()).data();
        user['rank'] = snapshot.docs.findIndex(doc => doc.id === user.id) + 1;
        delete user.records;

        const mazes = [];

        for (const id of user.mazes.reverse()) {
            const mazeRef = db.collection('mazes').doc(id);
            const maze = (await mazeRef.get()).data();

            if (maze.created) {
                const created = new Date(maze.created).toLocaleDateString();
                maze.created = created === 'Invalid Date' ? null : created;
            }

            if (maze.creator) {
                maze.creator = await username(maze.creator);
            }

            maze.recordTime = maze.recordTime === Infinity ? Math.pow(2, 53) - 1 : maze.recordTime;
            maze.recordHolder = maze.recordHolder ? await username(maze.recordHolder) : null;
            mazes.push(maze);
        }

        user.mazes = mazes;
        const favorites = [];

        for (const id of user.favorites.reverse()) {
            const mazeRef = db.collection('mazes').doc(id);
            const maze = (await mazeRef.get()).data();

            if (maze.created) {
                const created = new Date(maze.created).toLocaleDateString();
                maze.created = created === 'Invalid Date' ? null : created;
            }

            if (maze.creator) {
                maze.creator = await username(maze.creator);
            }

            maze.recordTime = maze.recordTime === Infinity ? Math.pow(2, 53) - 1 : maze.recordTime;
            maze.recordHolder = maze.recordHolder ? await username(maze.recordHolder) : null;
            favorites.push(maze);
        }

        user.favorites = favorites;

        return user;
    } catch (error) {
        console.error(error);
        return { error: error.message };
    }
});

exports.getMazes = functions.https.onCall(async (_, context) => {
    try {
        verify(context);
        const collectionSnap = await db.collection('maze-collection').doc('data').get();
        const totalMazes = collectionSnap.data().size;

        if (totalMazes === 0) {
            return [];
        }

        const selectedMazeCount = Math.min(12, totalMazes);
        const mazesRef = db.collection('mazes');
        const popularRef = db.collection('popular');
        const docs = [];
        const selected = new Set();

        async function loadPopularMaze(id) {
            const popularMaze = (await popularRef.doc(id).get()).data();

            if ('id' in popularMaze) {
                const mazeId = popularMaze.id;
                const mazeSnap = await mazesRef.doc(mazeId).get();
                const maze = mazeSnap.data();
                docs.push(maze);
                selected.add(maze.id);
            }
        }

        await loadPopularMaze('0');
        await loadPopularMaze('1');
        await loadPopularMaze('2');

        while (selected.size < selectedMazeCount) {
            const index = Math.floor(Math.random() * totalMazes);
            const querySnap = await mazesRef.limit(1).offset(index).get();
            const maze = querySnap.docs.pop().data();

            if (!selected.has(maze.id)) {
                docs.push(maze);
                selected.add(maze.id);
            }
        }

        const mazes = [];

        for (const maze of docs) {
            if (maze.created) {
                const created = new Date(maze.created).toLocaleDateString();
                maze.created = created === 'Invalid Date' ? null : created;
            }

            if (maze.creator) {
                maze.creator = await username(maze.creator);
            }

            maze.recordTime = maze.recordTime === Infinity ? Math.pow(2, 53) - 1 : maze.recordTime;
            maze.recordHolder = maze.recordHolder ? await username(maze.recordHolder) : null;
            mazes.push(maze);
        }

        return mazes;
    } catch (error) {
        console.error(error);
        return { error: error.message };
    }
});

exports.searchMazes = functions.https.onCall(async (data, context) => {
    try {
        verify(context);
        const querySnapshot = await db.collection('mazes').get();
        const docs = [];
        
        for (const doc of querySnapshot.docs) {
            const maze = doc.data();

            if (maze.name.toLowerCase().includes(data.query.toLowerCase())) {
                docs.push(doc.data());
            }
        }

        docs.sort((a, b) => {
            if (a.created !== b.created && typeof a.created === 'number' && typeof b.created === 'number') {
                return b.created - a.created;
            } else {
                return b.plays - a.plays;
            }
        });

        const mazes = [];

        for (const maze of docs) {
            if (maze.created) {
                const created = new Date(maze.created).toLocaleDateString();
                maze.created = created === 'Invalid Date' ? null : created;
            }

            if (maze.creator) {
                maze.creator = await username(maze.creator);
            }
            
            maze.recordTime = maze.recordTime === Infinity ? Math.pow(2, 53) - 1 : maze.recordTime;
            maze.recordHolder = maze.recordHolder ? await username(maze.recordHolder) : null;
            mazes.push(maze);
        }

        return mazes;
    } catch (error) {
        console.error(error);
        return { error: error.message };
    }
});

exports.createMaze = functions.https.onCall(async (data, context) => {
    try {
        verify(context);
        
        const testName = data.name.split(/\s+/).join('');

        for (let i = 0; i < testName.length; i++) {
            for (let j = i; j <= testName.length; j++) {
                if (filter.isProfane(testName.slice(i, j))) {
                    return { error: 'Please do not use inappropriate language.' };
                }
            }
        }

        const collectionDataRef = db.collection('maze-collection').doc('data');
        const collectionData = (await collectionDataRef.get()).data();
        const id = collectionData.size.toString().padStart(7, '0');
        const docRef = db.collection('mazes').doc(id);
        const maze = {
            id: id,
            name: data.name,
            creator: data.uid,
            created: Date.now(),
            plays: 0,
            recordTime: Math.pow(2, 53) - 1,
            recordHolder: null,
            template: data.template,
            color: data.color,
        };
        await docRef.create(maze);
        await collectionDataRef.update({ size: admin.firestore.FieldValue.increment(1) });
        const user = db.collection('users').doc(data.uid);
        await user.update({ mazes: admin.firestore.FieldValue.arrayUnion(id) });
        maze.created = new Date(maze.created).toLocaleDateString();
        maze.creator = await username(maze.creator);
        return maze;
    } catch (error) {
        console.error(error);
        return { error: error.message };
    }
});

exports.createUser = functions.https.onCall(async (data, context) => {
    try {
        verify(context);

        const username = data.email.slice(0, data.email.indexOf('@'));

        for (let i = 0; i < username.length; i++) {
            for (let j = i; j <= username.length; j++) {
                if (filter.isProfane(username.slice(i, j))) {
                    return { error: 'Please do not use an email address containing inappropriate language.' };
                }
            }
        }

        const docRef = db.collection('users').doc(data.uid);
        const doc = {
            id: data.uid,
            email: data.email,
            plays: {},
            mazes: [],
            favorites: [],
            records: 0,
        };
        await docRef.set(doc);
        return doc;
    } catch (error) {
        console.error(error);
        return { error: error.message };
    }
});

exports.setFavorite = functions.https.onCall(async (data, context) => {
    try {
        verify(context);
        const user = db.collection('users').doc(data.uid);
        await user.update({ favorites: admin.firestore.FieldValue.arrayUnion(data.mazeId) });
        return success;
    } catch (error) {
        console.error(error);
        return { error: error.message };
    }
});

exports.removeFavorite = functions.https.onCall(async (data, context) => {
    try {
        verify(context);
        const user = db.collection('users').doc(data.uid);
        await user.update({ favorites: admin.firestore.FieldValue.arrayRemove(data.mazeId) });
        return success;
    } catch (error) {
        console.error(error);
        return { error: error.message };
    }
});

exports.registerPlay = functions.https.onCall(async (data, context) => {
    try {
        verify(context);
        const popular = db.collection('popular');
        const firstRef = await popular.doc('0');
        const secondRef = await popular.doc('1');
        const thirdRef = await popular.doc('2');
        const mazeRef = db.collection('mazes').doc(data.id);
        const first = (await firstRef.get()).data();
        const second = (await secondRef.get()).data();
        const third = (await thirdRef.get()).data();
        const maze = (await mazeRef.get()).data();
        const plays = maze.plays + 1;

        if (plays > first.plays) {
            await firstRef.set({
                id: maze.id,
                plays: plays,
            });
            await secondRef.set(first);
            await thirdRef.set(second);
        } else if (plays > second.plays) {
            await secondRef.set({
                id: maze.id,
                plays: plays,
            });
            await thirdRef.set(second);
        } else if (plays > third.plays) {
            await thirdRef.set({
                id: maze.id,
                plays: plays,
            });
        }

        await mazeRef.update({ plays: admin.firestore.FieldValue.increment(1) });

        const userRef = db.collection('users').doc(data.uid);
        const userPlays = (await userRef.get()).data().plays;

        if (data.id in userPlays) {
            await userRef.update({ [`plays.${data.id}`]: admin.firestore.FieldValue.increment(-1) });
        } else {
            await userRef.set({ plays: { ...userPlays, [data.id]: 2 } }, { merge: true });
        }

        return success;
    } catch (error) {
        console.error(error);
        return { error: error.message };
    }
});

exports.resetPlays = functions.https.onCall(async (data, context) => {
    try {
        verify(context);
        const user = db.collection('users').doc(data.uid);
        const plays = (await user.get()).data().plays;
        await user.set({ plays: { ...plays, [data.id]: 3 } }, { merge: true });
        return success;
    } catch (error) {
        console.error(error);
        return { error: error.message };
    }
});

exports.deleteAccount = functions.https.onCall(async (_, context) => {
    try {
        verify(context);
        const uid = context.auth.uid;
        await db.collection('users').doc(uid).delete();
        await admin.auth().deleteUser(uid);
        return success;
    } catch (error) {
        console.error(error);
        return { error: error.message };
    }
});


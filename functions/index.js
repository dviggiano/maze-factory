const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config()

admin.initializeApp();

const success = { message: 'Document written successfully.' };
const db = admin.firestore();
const auth = admin.auth();

/*
 * To add additional filtering to ensure user-generated content complies with terms of use,
 * generate an Open AI API key (see https://www.howtogeek.com/885918/how-to-get-an-openai-api-key/.)
 * Then, create a .env file in this directory with the following contents:
 * OPENAI_API_KEY=your-api-key
 */

const configuration = process.env.OPENAI_API_KEY ? new Configuration({ apiKey: process.env.OPENAI_API_KEY }) : null;
const openai = configuration ? new OpenAIApi(configuration) : null;

function verify(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Caller is not authenticated.');
    }
}

async function filter(name) {
    if (openai === null) {
        return false;
    }

    const prompt = `The name "${name}" is a username or the name of a maze submitted to an maze sharing service. The user agreed to the following terms of use regarding maze name and username submission:

a) Content must not violate any applicable laws, regulations, or third-party rights.
b) Content must not contain defamatory, abusive, threatening, or harassing language.
c) Content must not be hateful, discriminatory, or promote violence or illegal activities.
d) Content must not include sexually explicit material.
e) Content must not infringe upon intellectual property rights, including copyrights or trademarks.
    
Does the submitted name (${name}) violate the described terms of use? [yes/no]`;

    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: prompt,
        max_tokens: 3,
        temperature: 0.2
    });

    return response.data.choices[0].text.toLowerCase().includes('yes');
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
        const maze = db.collection('mazes').doc(data.mazeId);
        const oldUserSnap = await maze.get();
        const oldUser = oldUserSnap.data().recordHolder;

        if (oldUser !== null) {
            const oldUserRef = db.collection('users').doc(oldUser);
            const oldUserSnap = await oldUserRef.get();

            if (oldUserSnap.exists) {
                await oldUserRef.update({ records: admin.firestore.FieldValue.increment(-1) });
            }
        }

        await maze.update({
            recordTime: data.time,
            recordHolder: data.uid
        });

        const userRef = db.collection('users').doc(data.uid);
        await userRef.update({ records: admin.firestore.FieldValue.increment(1) });

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
        const userSnap = await userRef.get();
        const user = userSnap.data();
        user['rank'] = snapshot.docs.findIndex(doc => doc.id === user.id) + 1;
        delete user.records;

        const mazes = [];

        for (const id of user.mazes.reverse()) {
            const mazeRef = db.collection('mazes').doc(id);
            const mazeSnap = await mazeRef.get();
            const maze = mazeSnap.data();

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
            const mazeSnap = await mazeRef.get();
            const maze = mazeSnap.data();

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
        const docs = [];
        const selected = new Set();
        const mazesSnap = await mazesRef.get();
        const popular = mazesSnap.docs.map(doc => doc.data());
        popular.sort((a, b) => b.plays - a.plays);

        for (let i = 0; i < 3; i++) {
            const maze = popular[i];
            docs.push(maze);
            selected.add(maze.id);
        }

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

        const violation = await filter(data.name);

        if (violation) {
            return { error: 'Maze name deemed to violate our terms of use.' };
        }

        const collectionDataRef = db.collection('maze-collection').doc('data');
        const collectionDataSnap = await collectionDataRef.get();
        const collectionData = collectionDataSnap.data();
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

        const violation = await filter(data.email.slice(0, data.email.email.indexOf('@')));

        if (violation) {
            await auth.deleteUser(data.uid);
            return { error: 'Username deemed to violate our terms of use.' };
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
        const firstRef = popular.doc('0');
        const secondRef = popular.doc('1');
        const thirdRef = popular.doc('2');
        const mazeRef = db.collection('mazes').doc(data.id);
        const firstSnap = await firstRef.get();
        const first = firstSnap.data();
        const secondSnap = await secondRef.get();
        const second = secondSnap.data();
        const thirdSnap = await thirdRef.get();
        const third = thirdSnap.data();
        const mazeSnap = await mazeRef.get();
        const maze = mazeSnap.data();
        const plays = maze.plays + 1;

        if (plays >= first.plays) {
            await thirdRef.set({
                id: second.id,
                plays: second.plays,
            });
            await secondRef.set({
                id: first.id,
                plays: first.plays,
            });
            await firstRef.set({
                id: maze.id,
                plays: plays,
            });
        } else if (plays >= second.plays) {
            await thirdRef.set({
                id: second.id,
                plays: second.plays,
            });
            await secondRef.set({
                id: maze.id,
                plays: plays,
            });
        } else if (plays >= third.plays) {
            await thirdRef.set({
                id: maze.id,
                plays: plays,
            });
        }

        await mazeRef.update({ plays: admin.firestore.FieldValue.increment(1) });

        const userRef = db.collection('users').doc(data.uid);
        const userSnap = await userRef.get();
        const userPlays = userSnap.data().plays;

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
        const userSnap = await user.get();
        const plays = userSnap.data().plays;
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
        await auth.deleteUser(uid);
        return success;
    } catch (error) {
        console.error(error);
        return { error: error.message };
    }
});


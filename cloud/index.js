import { collection, doc, setDoc } from 'firebase/firestore';
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('credentials.json');
const db = admin.database();

class Space {
    x; // x coordinate
    y; // y coordinate
    active; // whether the space is inhabited
    connected; // connected spaces

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.active = false;
        this.connected = [];
    }

    addEdge(space) {
        if (this.connected.includes(space)) {
            return false;
        } else {
            this.connected.push(space);
            space.connected.push(this);
            return true;
        }
    }
}

class Maze {
    spaces; // spaces stored as a 2D array so they can be referenced using coordinates
    entrance;
    exit;
    start;
    end;

    constructor(size, random=true) {
        this.spaces = [];

        // create a [size] x [size] grid of spaces
        for (let x = 0; x < size; x++) {
            const column = [];

            for (let y = 0; y < size; y++) {
                column.push(new Space(x, y));
            }

            this.spaces.push(column);
        }

        this.entrance = this.spaces[1][0];
        this.exit = this.spaces[size - 2][size - 1];
        this.start = null;
        this.end = null;

        if (random) {
            this.randomize();
        }
    }

    adjacentTo(space) {
        const adjacent = [];

        const leftIndex = space.x - 1;

        if (leftIndex > -1) {
            adjacent.push(this.spaces[leftIndex][space.y]);
        }

        const rightIndex = space.x + 1;

        if (rightIndex < this.spaces.length) {
            adjacent.push(this.spaces[rightIndex][space.y]);
        }

        const downIndex = space.y - 1;

        if (downIndex > -1) {
            adjacent.push(this.spaces[space.x][downIndex]);
        }

        const upIndex = space.y + 1;

        if (upIndex < this.spaces.length) {
            adjacent.push(this.spaces[space.x][upIndex]);
        }

        return adjacent;
    }

    load(template) {
        for (let x = 0; x < this.spaces.length; x++) {
            for (let y = 0; y < this.spaces.length; y++) {
                // @ts-ignore
                if (template[x][y].left) {
                    this.spaces[x][y].addEdge(this.spaces[x - 1][y]);
                }

                // @ts-ignore
                if (template[x][y].right) {
                    this.spaces[x][y].addEdge(this.spaces[x + 1][y]);
                }

                // @ts-ignore
                if (template[x][y].down) {
                    this.spaces[x][y].addEdge(this.spaces[x][y - 1]);
                }

                // @ts-ignore
                if (template[x][y].up) {
                    this.spaces[x][y].addEdge(this.spaces[x][y + 1]);
                }
            }
        }

        return this;
    }

    getTemplate() {
        const template = {};
        const visited = new Set();

        function includeEdge(from, to) {
            return !visited.has(to) && from.connected.includes(to);
        }

        for (let x = 0; x < this.spaces.length; x++) {
            const column = [];

            for (let y = 0; y < this.spaces.length; y++) {
                const leftIndex = x - 1;
                const rightIndex = x + 1;
                const downIndex = y - 1;
                const upIndex = y + 1;

                const space = {
                    left:
                        leftIndex > -1 &&
                        includeEdge(this.spaces[x][y], this.spaces[leftIndex][y]),
                    right:
                        rightIndex < this.spaces.length &&
                        includeEdge(this.spaces[x][y], this.spaces[rightIndex][y]),
                    down:
                        downIndex > -1 &&
                        includeEdge(this.spaces[x][y], this.spaces[x][downIndex]),
                    up:
                        upIndex < this.spaces.length &&
                        includeEdge(this.spaces[x][y], this.spaces[x][upIndex]),
                };

                column.push(space);
                visited.add(this.spaces[x][y]);
            }

            // @ts-ignore
            template[x] = column;
        }

        return template;
    }

    randomize() {
        // shuffle spaces using the Fisher-Yates algorithm on all spaces other than the entrance and exit
        const spaces = [];

        for (const column of this.spaces) {
            for (const space of column) {
                if (this.entrance !== space && this.exit !== space) {
                    spaces.push(space);
                }
            }
        }

        let i = spaces.length;

        while (i > 0) {
            const j = Math.floor(Math.random() * i--);
            spaces[i], spaces[j] = spaces[j], spaces[i];
        }

        spaces.push(this.entrance); // add the entrance to the end of the array so the helper method grabs it first

        // call recursive helper method to build maze, starting by attempting to connect the entrance to the exit
        this.leavesUp(spaces, new Set([...spaces]), new Set([this.exit]));
    }

    leavesUp(unvisitedStack, unvisited, path) {
        let space;

        // filter the stack of unvisited spaces
        do {
           space = unvisitedStack.pop(); // grabs the entrance on initial call
        } while (!unvisited.has(space));

        const orderedBranch = [];
        const branch = new Set();

        // pick random adjacent spaces to connect to until the final maze is reached
        while (!path.has(space)) {
            unvisited.delete(space);
            orderedBranch.push(space);
            branch.add(space);
            space = this.leavesUpHelper(orderedBranch, branch, path, 1);
        }

        for (const space of branch) {
            path.add(space);
        }

        if (unvisited.size !== 0) {
            this.leavesUp(unvisitedStack, unvisited, path);
        }
    }

    leavesUpHelper(orderedBranch, branch, path, calls) {
        const space = orderedBranch[orderedBranch.length - calls]; // backtrack if calls > 1
        // adjacent spaces are valid if they are not already in the current branch
        // the exit is only valid before any branch has been added to the final maze as it should only connect to 1 space
        let adjacent = this.adjacentTo(space).filter(neighbor =>
            (neighbor !== this.exit || path.size === 1) && !branch.has(neighbor)
        );
        // if no valid adjacent spaces exist, backtrack through the branch and move in another direction
        if (adjacent.length === 0) {
            return this.leavesUpHelper(orderedBranch, branch, path, calls + 1);
        }
        // grab and connect a random space from valid adjacent spaces
        const neighbor = adjacent[Math.floor(Math.random() * adjacent.length)];
        space.addEdge(neighbor);
        return neighbor;
    }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

exports.updateDocumentDaily = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const q = query(collection(db, 'mazes'));
    const querySnapshot = await getDocs(q);
    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayMazes = querySnapshot.docs.filter(doc =>
        doc.data().created.toDate() < yesterday
    );

    if (yesterdayMazes.length === 0) {
        const sizes = [5, 6, 7, 8, 9, 10];
        const maze = new Maze(sizes[Math.floor(Math.random() * sizes.length)], true);

        await setDoc(doc(collection(db, 'mazes', 'TodaysMaze')), {
            name: "Today's Maze",
            recordTime: Infinity,
            plays: 0,
            recordHolder: null,
            creator: 'UYNWjwCj4FYaSccQm2bmRE6F7Pd2',
            created: Date.now(),
            template: maze.getTemplate()
        });
    }
});

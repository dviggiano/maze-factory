import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Space from './Space';

export default class Maze {
    spaces: Space[][]; // spaces stored as a 2D array so they can be referenced using coordinates
    entrance: Space;
    exit: Space;
    start;
    end;

    constructor(size: number, random=false) {
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
    };

    async build(id: string) {
        const mazesRef = collection(db, 'mazes');
        const docRef = doc(mazesRef, id);
        const docSnap = await getDoc(docRef);
        const docData = docSnap.data()!;

        this.load(docData.template);
    };

    adjacentTo(space: Space): Space[] {
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
    };

    load(template: Object) {
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
    };

    getTemplate() {
        const template = {};
        const visited = new Set<Space>();

        function includeEdge(from: Space, to: Space): boolean {
            return !visited.has(to) && from.connected.includes(to);
        };

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
            };

            // @ts-ignore
            template[x] = column;
        }

        return template;
    };

    testRandomize() {
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

        const total = [];

        // call recursive helper method to build maze, starting by attempting to connect the entrance to the exit
        this.testLeavesUp(spaces, new Set([...spaces]), new Set([this.exit]), total);

        return total.length;
    };

    testLeavesUp(unvisitedStack: Space[], unvisited: Set<Space>, path: Set<Space>, total) {
        let space;

        // filter the stack of unvisited spaces
        do {
           space = unvisitedStack.pop()!; // grabs the entrance on initial call
        } while (!unvisited.has(space));

        const orderedBranch: Space[] = [];
        const branch = new Set<Space>();

        // pick random adjacent spaces to connect to until the final maze is reached
        while (!path.has(space)) {
            unvisited.delete(space);
            orderedBranch.push(space);
            branch.add(space);
            space = this.testLeavesUpHelper(orderedBranch, branch, path, 1, total);
        }

        for (const space of branch) {
            path.add(space);
        }

        if (unvisited.size !== 0) {
            this.leavesUp(unvisitedStack, unvisited, path);
        }
    };

    testLeavesUpHelper(orderedBranch: Space[], branch: Set<Space>, path: Set<Space>, calls: number, total): Space {
        total.push(0);
        const space = orderedBranch[orderedBranch.length - calls]; // backtrack if calls > 1
        // adjacent spaces are valid if they are not already in the current branch
        // the exit is only valid before any branch has been added to the final maze as it should only connect to 1 space
        let adjacent: Space[] = this.adjacentTo(space).filter(neighbor =>
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
    };

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
    };

    leavesUp(unvisitedStack: Space[], unvisited: Set<Space>, path: Set<Space>) {
        let space;

        // filter the stack of unvisited spaces
        do {
           space = unvisitedStack.pop()!; // grabs the entrance on initial call
        } while (!unvisited.has(space));

        // all the space in the branch currently being constructed, in order of their addition
        const orderedBranch: Space[] = [];
        // all the space in the branch currently being constructed, unordered
        const branch = new Set<Space>();

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
    };

    leavesUpHelper(orderedBranch: Space[], branch: Set<Space>, path: Set<Space>, calls: number): Space {
        const space = orderedBranch[orderedBranch.length - calls]; // backtrack if calls > 1
        // adjacent spaces are valid if they are not already in the current branch
        // the exit is only valid before any branch has been added to the final maze as it should only connect to 1 space
        let adjacent: Space[] = this.adjacentTo(space).filter(neighbor =>
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
    };

    containsNoCycles(): boolean {
        const visited = new Set<Space>();

        for (const column of this.spaces) {
            for (const space of column) {
                if (!visited.has(space) && space.cycleExists(visited, null)) {
                    return false;
                }
            }
        }

        return true;
    };

    isFullyTraversable(): boolean {
        const toVisit = [this.entrance];
        const visited = new Set<Space>();

        while (toVisit.length > 0) {
            const space = toVisit.pop()!;

            for (const neighbor of space.connected) {
                if (!visited.has(neighbor)) {
                    toVisit.push(neighbor);
                }
            }

            visited.add(space);
        }

        return visited.size === this.spaces.length ** 2;
    }

    isValid(): boolean {
        return this.containsNoCycles() && this.isFullyTraversable() && this.exit.connected.length === 1;
    };
};

// for (let i = 2; i < 50; i++) {
//     const operations = [];
//  
//     for (let j = 0; j < 1024; j++) {
//         const maze = new Maze(i);
//         operations.push(maze.testRandomize());
//     }
//
//     let total = 0;
//
//     for (const operation of operations) {
//         total += operation;
//     }
//
//     console.log(`${i * 2},${total / operations.length}`)
// }
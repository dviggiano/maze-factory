import Space from './space';
import { getMaze } from '../firebase/functions';
import { MazeTemplate } from '../types/firebase';

/**
 * Graph representation of a maze.
 * Valid mazes are acyclic, undirected graphs (trees) where the exit is a leaf.
 * @property {Space[][]} spaces spaces mapped by coordinates
 * @property {Space} entrance the entrance space
 * @property {Space} exit the exit space
 * @property {number} start the time at which the current solve attempt began
 * @property {number} end the time at which the current solve attempt ended
 */
export default class Maze {
    spaces: Space[][];
    entrance: Space;
    exit: Space;
    start: number;
    end: number;

    /**
     * Constructs a new maze.
     * @param {number} size the height/width of the maze (maze is size x size)
     * @param {boolean} random whether the maze should be randomized by default
     */
    constructor(size: number, random: boolean=false) {
        this.spaces = [];

        // create a [size] x [size] grid of spaces
        for (let x = 0; x < size; x++) {
            const column = [];

            for (let y = 0; y < size; y++) {
                column.push(new Space(x, y));
            }

            this.spaces.push(column);
        }

        // TODO take entrance and exit as parameters, so they can be edited/randomized and saved
        this.entrance = this.spaces[1][0];
        this.exit = this.spaces[size - 2][size - 1];
        this.start = 0;
        this.end = 0;

        if (random) {
            this.randomize();
        }
    }

    /**
     * Builds the maze from a Firestore document.
     * @param {string} id the Firestore document ID
     */
    async build(id: string) {
        const doc = await getMaze(id);
        this.load(doc.template);
    }

    /**
     * Returns all spaces adjacent to the provided space.
     * @param {string} space the space whose neighbors are returned
     * @return {Space[]} all spaces adjacent to the provided space
     */
    adjacentTo(space: Space): Space[] {
        return this.spaces.flat().filter(other =>
            Math.abs(space.x - other.x) + Math.abs(space.y - other.y) === 1
        );
    }

    /**
     * Builds the maze from a template.
     * @param {MazeTemplate} template a JSON-formatted representation of a maze
     */
    load(template: MazeTemplate) {
        for (let x = 0; x < this.spaces.length; x++) {
            for (let y = 0; y < this.spaces.length; y++) {
                if (template[x][y].left) {
                    this.spaces[x][y].addEdge(this.spaces[x - 1][y]);
                }

                if (template[x][y].right) {
                    this.spaces[x][y].addEdge(this.spaces[x + 1][y]);
                }

                if (template[x][y].down) {
                    this.spaces[x][y].addEdge(this.spaces[x][y - 1]);
                }

                if (template[x][y].up) {
                    this.spaces[x][y].addEdge(this.spaces[x][y + 1]);
                }
            }
        }

        return this;
    }

    /**
     * Returns a JSON-formatted object that can be used to reconstruct the maze.
     * @return {MazeTemplate} a JSON-formatted object that can be used to reconstruct the maze
     */
    getTemplate(): MazeTemplate {
        const template = {};
        const visited = new Set<Space>();

        /**
         * Whether two spaces should be connected.
         * If ``from`` is already marked as connected to ``to``,
         * an edge indication is not needed, so it is not added.
         */
        function includeEdge(from: Space, to: Space): boolean {
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

            template[x] = column;
        }

        return template;
    }

    /**
     * Randomizes the maze.
     */
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
            const temp = spaces[i];
            spaces[i] = spaces[j];
            spaces[j] = temp;
        }

        // add the entrance to the end of the array so the helper method grabs it first
        spaces.push(this.entrance);
        // initially create a path from the entrance to exit
        const final = new Set([this.exit]);
        const unadded = new Set([...spaces]);

        while (unadded.size !== 0) {
            let space: Space;
            // filter the stack of unvisited spaces
            do {
                space = spaces.pop()!; // grabs the entrance on initial call
            } while (!unadded.has(space));
            // all the space in the branch currently being constructed
            const branch = new Set<Space>();
            // spaces that have been added to the branch,
            // but still have other potential neighbors
            const returnable: Space[] = [];
            // pick random adjacent spaces to advance to until the final maze is reached
            while (!final.has(space)) {
                unadded.delete(space);
                branch.add(space);
                space = this.nextNeighbor(space, branch, final, returnable);
            }
            // record all added spaces
            for (const space of branch) {
                final.add(space);
            }
        }
    }

    /**
     * Recursive helper method that determines the next neighbor
     * to include in the maze and attaches it.
     * @param {Space} last the last space added
     * @param {Set<Space>} branch the branch currently being constructed
     * @param {Set<Space>} final the spaces already included in the maze
     * @param {Space[]} returnable spaces that can be jumped back to if a dead end is hit
     * @return {Space} the next neighbor
     */
    nextNeighbor(last: Space, branch: Set<Space>, final: Set<Space>, returnable: Space[]): Space {
        // adjacent spaces are valid if they are not already in the current branch
        // the exit is only valid before any branch has been added to the final maze
        // as it should only connect to 1 space
        let adjacent: Space[] = this.adjacentTo(last).filter(neighbor =>
            (neighbor !== this.exit || final.size === 1) && !branch.has(neighbor)
        );
        // if no valid adjacent spaces exist,
        // backtrack through the branch and move in another direction
        if (adjacent.length === 0) {
            return this.nextNeighbor(returnable.pop()!, branch, final, returnable);
        // if the space could have other potential neighbors, keep track of it
        } else if (adjacent.length > 1) {
            returnable.push(last);
        }
        // grab and connect a random space from valid adjacent spaces
        const neighbor = adjacent[Math.floor(Math.random() * adjacent.length)];
        last.addEdge(neighbor);
        return neighbor;
    }

    /**
     * Returns whether the maze is acyclic.
     * If false, the maze is invalid.
     * @return {boolean} whether the maze is acyclic
     */
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
    }

    /**
     * Returns whether all spaces have been added to the maze.
     * If false, the maze is invalid.
     * @return {boolean} whether all spaces have been added to the maze
     */
    isFullyTraversable(): boolean {
        const toVisit = [this.entrance];
        const visited = new Set<Space>();

        // traverse the maze using depth-first search
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

    /**
     * Mazes are valid if they have three properties:
     * - acyclic
     * - fully traversable
     * - exit is only connected to one space
     * @return {boolean} whether the maze is valid
     */
    isValid(): boolean {
        return this.exit.connected.length === 1 && this.containsNoCycles() && this.isFullyTraversable();
    }
}

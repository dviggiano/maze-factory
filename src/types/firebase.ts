/**
 * Record of how many remaining plays a user has for each maze
 * as stored in Cloud Firestore.
 */
type MazePlays = {
    [id: string] : 0 | 1 | 2 | 3;
};

/**
 * A JSON-formatted object that can be used to reconstruct a maze.
 *
 * If ``true`` in a given direction, then the space should be connected
 * to the space in that direction. Duplicate edge indications are not included as
 * connecting two spaces is done by adding an undirected edge.
 *
 * @example
 * const maze = new Maze(3);
 * maze.randomize();
 * maze.getTemplate():
 *
 * {
 *   0: [
 *     { left: false, right: true, down: false, up: true },
 *     { left: false, right: false, down: false, up: true },
 *     { left: false, right: false, down: false, up: false }
 *   ],
 *   1: [
 *     { left: false, right: true, down: false, up: false },
 *     { left: false, right: false, down: false, up: false },
 *     { left: false, right: true, down: false, up: false }
 *   ],
 *   2: [
 *     { left: false, right: false, down: false, up: true },
 *     { left: false, right: false, down: false, up: true },
 *     { left: false, right: false, down: false, up: false }
 *   ]
 * }
 */
export type MazeTemplate = {
    [column: number]: Array<{
        left: boolean,
        right: boolean,
        up: boolean,
        down: boolean,
    }>,
};

/**
 * Maze data as stored in Cloud Firestore.
 * @property {string} id document ID
 * @property {string} name name of the maze
 * @property {MazeTemplate} template the maze template in JSON format
 * @property {string} creator UID of the creater
 * @property {number | string} created the creation timestamp
 * @property {number} plays amount of times the maze has been played
 * @property {string | null} recordHolder UID of the recordholder
 * @property {number} recordTime record time in seconds
 * @property {string} color color of activated spaces
 */
export type MazeDocument = {
    id: string,
    name: string,
    template: MazeTemplate,
    creator: string,
    created: number | string,
    plays: number,
    recordHolder: string | null,
    recordTime: number,
    color?: string,
};

/**
* A lookup table with maze IDs as keys and corresponding MazeDocuments as values.
 */
export type MazeCollection = { [id: string]: MazeDocument };

/**
 * User data as stored in Cloud Firestore.
 * @property {string} id document ID and UID
 * @property {string} email email of the user
 * @property {MazePlays} plays all mazes the user has played, and how many times each
 * @property {MazeDocument[]} mazes all mazes the user has created
 * @property {number} rank global rank of the user
 */
export type UserDocument = {
    id: string,
    email: string,
    plays: MazePlays,
    mazes: MazeDocument[],
    favorites: MazeDocument[],
    rank: number,
};
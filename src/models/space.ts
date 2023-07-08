/**
 * A node in a graphical representation of a maze.
 * @property {number} x the space's x coordinate
 * @property {number} y the space's y coordinate
 * @property {boolean} active whether the space has been visited by the solver
 * @property {Space[]} connected spaces that can be reached from this space
 */
export default class Space {
    x: number;
    y: number;
    active: boolean;
    connected: Space[];

    /**
     * Constructs a new space.
     * @param {number} x the x coordinate
     * @param {number} y the y coordinate
     */
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.active = false;
        this.connected = [];
    }

    /**
     * Connects the space to another space
     * and returns whether the spaces were disconnected to begin with.
     * @param {Space} space the other space
     * @return {boolean} whether the spaces were disconnected to begin with
     */
    addEdge(space: Space): boolean {
        if (this.connected.includes(space)) {
            return false;
        } else {
            this.connected.push(space);
            space.connected.push(this);
            return true;
        }
    }

    /**
     * Disconnects the space from another space
     * and returns whether the spaces were connected to begin with.
     * TODO use this in maze builder
     * @param {Space} space the other space
     * @return {boolean} whether the spaces were connected to begin with
     */
    removeEdge(space: Space): boolean {
        if (!this.connected.includes(space)) {
            return false;
        } else {
            this.connected = this.connected.filter(neighbor => neighbor !== space);
            space.connected = space.connected.filter(neighbor => neighbor !== this);
            return true;
        }
    }
    

    /**
     * Recursive method that returns whether this space is a part of a cycle.
     * @param {Set<Space>} visited spaces already visited
     * @param {Space | null} parent the space looked at immediately before (a neighbor of this space)
     * @return {boolean} whether this space is a part of a cycle
     */
    cycleExists(visited: Set<Space>, parent: Space | null): boolean {
        visited.add(this);

        for (const neighbor of this.connected) {
            if (!visited.has(neighbor)) {
                if (neighbor.cycleExists(visited, this)) {
                    return true;
                }
            } else if (parent !== neighbor) {
                // if the space has already been visited
                // and it is not the last looked at space
                return true;
            }
        }

        return false;
    }
}

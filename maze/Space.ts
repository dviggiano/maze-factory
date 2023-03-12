export default class Space {
    x: number; // x coordinate
    y: number; // y coordinate
    active: boolean; // whether the space is inhabited
    connected: Space[]; // connected spaces

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.active = false;
        this.connected = [];
    }

    addEdge(space: Space): boolean {
        if (this.connected.includes(space)) {
            return false;
        } else {
            this.connected.push(space);
            space.connected.push(this);
            return true;
        }
    }

    removeEdge(space: Space): boolean {
        if (!this.connected.includes(space)) {
            return false;
        } else {
            this.connected = this.connected.filter(neighbor => neighbor !== space);
            space.connected = space.connected.filter(neighbor => neighbor !== this);
            return true;
        }
    }

    pathExists(destination: Space): boolean {
        const toVisit = [...this.connected];
        const visited = new Set<Space>();

        while (toVisit.length > 0) {
            const space = toVisit.pop()!;

            for (const neighbor of space.connected) {
                if (neighbor === destination) {
                    return true;
                } else if (!visited.has(neighbor)) {
                    toVisit.push(neighbor);
                }
            }

            visited.add(space);
        }

        return false;
    }

    cycleExists(visited: Set<Space>, parent: Space | null) {
        visited.add(this);

        for (const neighbor of this.connected) {
            if (!visited.has(neighbor)) {
                if (neighbor.cycleExists(visited, this)) {
                    return true;
                }
            } else if (parent !== neighbor) {
                return true;
            }
        }

        return false;
    }
}

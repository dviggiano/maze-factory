import React, { createContext, useState } from 'react';
import Maze from '../models/maze';

/**
 * Data structure for the previous and future states of the maze builder.
 */
class History {
    maze: Maze;
    setMaze: (Maze) => void;
    previous: Maze[];
    future: Maze[];

    constructor(maze: Maze = null) {
        this.maze = maze;
        this.setMaze = null;
        this.previous = [];
        this.future = [];
    }

    modify() {
        this.future = [];
        const maze = new Maze(this.maze.spaces.length);
        maze.load(this.maze.getTemplate());
        this.previous.push(maze);

        if (this.previous.length > 16) {
            this.previous.shift();
        }
    }

    undo() {
        const maze = new Maze(this.maze.spaces.length);
        maze.load(this.maze.getTemplate());
        this.future.push(maze);
        this.setMaze(this.previous.pop()!);
        return this.deepcopy();
    }

    redo() {
        const maze = new Maze(this.maze.spaces.length);
        maze.load(this.maze.getTemplate());
        this.previous.push(maze);
        this.setMaze(this.future.pop()!);
        return this.deepcopy();
    }

    deepcopy() {
        const copy = new History(this.maze);
        copy.setMaze = this.setMaze;
        copy.previous = [...this.previous];
        copy.future = [...this.future];
        return copy;
    }
}

/**
 * Context for the build tab.
 * @property {Maze} maze the maze within the current canvas
 * @property {(to: Maze) => void} setMaze function for setting the maze within the current canvas
 * @property {number[]} sizes allowed sizes for the maze within the canvas
 * @property {History} data structure for the previous and future states of the maze builder
 * @property {(to: History) => void} setHistory function for setting the data structure for the previous and future states of the maze builder
 * @property {string} color the color of the maze within the current canvas
 * @property {(to: string) => void} setColor function for setting the color of the maze within the current canvas
 */
type MazeContextType = {
    maze: Maze;
    setMaze: (to: Maze) => void;
    sizes: number[],
    history: History,
    setHistory: (to: History) => void,
    color: string,
    setColor: (to: string) => void,
};

export const MazeContext = createContext<MazeContextType>({
    maze: null,
    setMaze: () => {},
    sizes: [],
    history: new History(null),
    setHistory: () => {},
    color: null,
    setColor: () => {},
});

export const MazeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const sizes = Array.from({ length: 8 }, (_, i) => i + 5);
    const initialSize = sizes[Math.floor(Math.random() * sizes.length)];
    const [maze, setMaze] = useState<Maze>(new Maze(initialSize, true));
    const [history, setHistory] = useState(new History(maze));
    const [color, setColor] = useState('#a3abcc');

    function mazeCallback(to: Maze) {
        setMaze(to);
        history.maze = maze;
    }

    function historyCallback(to: History) {
        setHistory(to);
    }

    function colorCallback(to: string) {
        setColor(to);
    }

    history.setMaze = mazeCallback;

    return (
        <MazeContext.Provider value={{ maze, setMaze: mazeCallback, sizes, history, setHistory: historyCallback, color, setColor: colorCallback }}>
            {children}
        </MazeContext.Provider>
    );
};

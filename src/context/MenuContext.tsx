import React, { createContext, useState } from 'react';
import { MazeCollection } from '../types/firebase';

/**
 * Context of mazes accessible from the home menu.
 * @property {MazeCollection} mazes the mazes accessible from the home menu
 * @property {(to: MazeCollection) => void} setMazes function for setting the mazes accessible from the home menu
 */
type MenuContextType = {
    mazes: MazeCollection;
    setMazes: (to: MazeCollection) => void;
};

export const MenuContext = createContext<MenuContextType>({
    mazes: {},
    setMazes: () => {},
});

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mazes, setMazes] = useState<MazeCollection>({});

    function callback(to: MazeCollection) {
        setMazes(to);
    }

    return (
        <MenuContext.Provider value={{ mazes, setMazes: callback }}>
            {children}
        </MenuContext.Provider>
    );
};

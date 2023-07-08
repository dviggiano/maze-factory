import React, { createContext, useState } from 'react';
import { UserDocument } from '../types/firebase';

/**
 * User data context.
 * @property {UserDocument | null} user the current user
 * @property {(to: UserDocument) => void} setUser function for setting the current user
 */
type UserContextType = {
    user: UserDocument | null;
    setUser: (to: UserDocument) => void;
};

export const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserDocument | null>(null);

    function callback(to: UserDocument) {
        setUser(to);
    }

    return (
        <UserContext.Provider value={{ user, setUser: callback }}>
            {children}
        </UserContext.Provider>
    );
};


import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserContextType {
    user: { name: string; role: 'admin' | 'salesperson' } | null;
    login: (name: string, role: 'admin' | 'salesperson') => void;
    logout: () => void;
    members: string[];
    addMember: (name: string) => void;
    removeMember: (name: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ name: string; role: 'admin' | 'salesperson' } | null>(null);
    const [members, setMembers] = useState<string[]>([]);

    useEffect(() => {
        const storedName = localStorage.getItem('crm_user_name');
        const storedRole = localStorage.getItem('crm_user_role') as 'admin' | 'salesperson';
        if (storedName && storedRole) {
            setUser({ name: storedName, role: storedRole });
        }

        const storedMembers = localStorage.getItem('crm_team_members');
        if (storedMembers) {
            setMembers(JSON.parse(storedMembers));
        }
    }, []);

    const login = (name: string, role: 'admin' | 'salesperson') => {
        localStorage.setItem('crm_user_name', name);
        localStorage.setItem('crm_user_role', role);
        setUser({ name, role });
    };

    const logout = () => {
        localStorage.removeItem('crm_user_name');
        localStorage.removeItem('crm_user_role');
        setUser(null);
    };

    const addMember = (name: string) => {
        if (!members.includes(name)) {
            const newMembers = [...members, name];
            setMembers(newMembers);
            localStorage.setItem('crm_team_members', JSON.stringify(newMembers));
        }
    };

    const removeMember = (name: string) => {
        const newMembers = members.filter(m => m !== name);
        setMembers(newMembers);
        localStorage.setItem('crm_team_members', JSON.stringify(newMembers));
    };

    return (
        <UserContext.Provider value={{ user, login, logout, members, addMember, removeMember }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}

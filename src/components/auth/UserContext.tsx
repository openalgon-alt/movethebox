
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface TeamMember {
    id: string;
    name: string;
    designation: string;
    email: string;
    password?: string;
    role: 'admin' | 'salesperson';
}

interface UserContextType {
    user: { name: string; role: 'admin' | 'salesperson' } | null;
    login: (name: string, role: 'admin' | 'salesperson') => void;
    logout: () => void;
    members: TeamMember[];
    addMember: (member: TeamMember) => void;
    removeMember: (id: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ name: string; role: 'admin' | 'salesperson' } | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);

    useEffect(() => {
        const storedName = localStorage.getItem('crm_user_name');
        const storedRole = localStorage.getItem('crm_user_role') as 'admin' | 'salesperson';
        if (storedName && storedRole) {
            setUser({ name: storedName, role: storedRole });
        }

        const storedMembers = localStorage.getItem('crm_team_members');
        if (storedMembers) {
            try {
                const parsed = JSON.parse(storedMembers);
                // Schema Migration: If array of strings, convert to objects
                if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                    const migrated = parsed.map((name: string) => ({
                        id: Math.random().toString(36).substr(2, 9),
                        name: name,
                        designation: 'Salesperson',
                        email: '',
                        password: '',
                        role: 'salesperson' as const
                    }));
                    setMembers(migrated);
                    localStorage.setItem('crm_team_members', JSON.stringify(migrated));
                } else {
                    setMembers(parsed);
                }
            } catch (e) {
                console.error('Failed to parse team members', e);
                setMembers([]);
            }
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

    const addMember = (member: TeamMember) => {
        const newMembers = [...members, member];
        setMembers(newMembers);
        localStorage.setItem('crm_team_members', JSON.stringify(newMembers));
    };

    const removeMember = (id: string) => {
        const newMembers = members.filter(m => m.id !== id);
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

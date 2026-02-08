
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Legacy TeamMember interface - can be removed later if not used
export interface TeamMember {
    id: string;
    name: string;
    designation: string;
    email: string;
    password?: string;
    role: 'admin' | 'salesperson';
}

interface UserContextType {
    user: { name: string; role: 'admin' | 'salesperson'; email?: string; id?: string } | null;
    login: (name: string, role: 'admin' | 'salesperson') => void; // Deprecated signature kept for compatibility inside components
    logout: () => void;
    members: TeamMember[]; // Deprecated
    addMember: (member: TeamMember) => void; // Deprecated
    removeMember: (id: string) => void; // Deprecated
    session: Session | null;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ name: string; role: 'admin' | 'salesperson'; email?: string; id?: string } | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [members, setMembers] = useState<TeamMember[]>([]);

    useEffect(() => {
        // Get initial session
        const initSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                setSession(initialSession);
                if (initialSession?.user) {
                    mapUser(initialSession.user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Error fetching session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            setSession(currentSession);
            if (currentSession?.user) {
                mapUser(currentSession.user);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const mapUser = (supabaseUser: User) => {
        // In a real app, you'd fetch the user's role/profile from a 'profiles' table
        // For now, we'll derive it or default it, and use metadata if available
        const name = supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User';
        const role = supabaseUser.user_metadata?.role || 'salesperson'; // Default to salesperson

        setUser({
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: name,
            role: role as 'admin' | 'salesperson'
        });
    };

    // Deprecated: kept for API compatibility with existing components
    const login = async () => {
        console.warn('UserContext.login() is deprecated. Use supabase.auth.signInWithPassword() instead.');
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    // Deprecated member management stubs
    const addMember = (member: TeamMember) => { console.log('addMember deprecated', member); };
    const removeMember = (id: string) => { console.log('removeMember deprecated', id); };

    return (
        <UserContext.Provider value={{ user, login, logout, members, addMember, removeMember, session, isLoading }}>
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

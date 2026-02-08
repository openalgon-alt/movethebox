
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from './UserContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Key } from 'lucide-react';

export function LoginDialog() {
    const { user, login, members } = useUser();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'salesperson'>('salesperson');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        if (role === 'salesperson') {
            const member = members.find(m => m.name.toLowerCase() === name.trim().toLowerCase());

            if (!member) {
                setError('Access Denied: User not found in team list.');
                return;
            }

            if (member.password && member.password !== password) {
                setError('Invalid password');
                return;
            }
        }

        login(name.trim(), role);
    };

    return (
        <Dialog open={!user} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Welcome to CRM</DialogTitle>
                    <DialogDescription>
                        Please sign in to access your dashboard.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Username / Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. John Doe"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                        />
                    </div>

                    {role === 'salesperson' && (
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    className="pl-9"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {error && <p className="text-sm text-destructive font-medium">{error}</p>}

                    <div className="space-y-2 pt-2">
                        <Label>Role</Label>
                        <RadioGroup value={role} onValueChange={(v) => {
                            setRole(v as any);
                            setError('');
                        }} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="salesperson" id="r-sales" />
                                <Label htmlFor="r-sales">Salesperson</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="admin" id="r-admin" />
                                <Label htmlFor="r-admin">Admin</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <Button type="submit" className="w-full">
                        Login
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

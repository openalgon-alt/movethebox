
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

export function LoginDialog() {
    const { user, login } = useUser();
    const [name, setName] = useState('');
    const [role, setRole] = useState<'admin' | 'salesperson'>('salesperson');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Name is required');
            return;
        }
        login(name.trim(), role);
    };

    return (
        <Dialog open={!user} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Welcome Salesperson</DialogTitle>
                    <DialogDescription>
                        Please enter your name to access your leads.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. John Doe"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Role</Label>
                        <RadioGroup value={role} onValueChange={(v) => setRole(v as any)} className="flex gap-4">
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
                        Enter Dashboard
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

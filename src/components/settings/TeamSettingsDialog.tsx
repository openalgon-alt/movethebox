
import { useState, useEffect } from 'react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useUser, TeamMember } from '@/components/auth/UserContext';
import { Plus, Trash2, Users, ArrowLeft, Save, Mail, Key, Hash, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface TeamSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TeamSettingsDialog({ open, onOpenChange }: TeamSettingsDialogProps) {
    const { user } = useUser();
    const [isAdding, setIsAdding] = useState(false);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<TeamMember>>({
        name: '',
        designation: '',
        id: '', // Employee ID
        email: '',
        password: '',
        role: 'salesperson' // Default role
    });

    // Fetch Members
    const fetchMembers = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/users');
            setMembers(res.data);
        } catch (error) {
            console.error('Failed to fetch members', error);
            // toast.error('Failed to load team members'); 
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open && user?.role === 'admin') {
            fetchMembers();
        }
    }, [open, user]);

    const resetForm = () => {
        setFormData({
            name: '',
            designation: '',
            id: '',
            email: '',
            password: '',
            role: 'salesperson'
        });
        setIsAdding(false);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.name?.trim() || !formData.id?.trim() || !formData.email?.trim() || !formData.password?.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            await api.post('/users', {
                name: formData.name,
                designation: formData.designation,
                id: formData.id,
                email: formData.email,
                password: formData.password
            });

            toast.success("Team member created successfully");
            resetForm();
            fetchMembers();
        } catch (error: any) {
            console.error('Add Member Error', error);
            toast.error(error.response?.data?.error || "Failed to create user");
        }
    };

    const handleDelete = async (userId: string, name: string) => {
        if (confirm(`Are you sure you want to remove ${name} from the team?`)) {
            try {
                await api.delete(`/users/${userId}`);
                toast.success("Member removed");
                fetchMembers();
            } catch (error: any) {
                console.error('Delete Member Error', error);
                toast.error("Failed to remove member");
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) setIsAdding(false);
        }}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Management
                    </DialogTitle>
                    <DialogDescription>
                        Manage your team members and their access.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {isAdding ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="p-0 h-auto hover:bg-transparent">
                                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to List
                                </Button>
                                <h3 className="font-medium text-lg ml-auto">Add New Member</h3>
                            </div>

                            <form onSubmit={handleAdd} className="space-y-4 border p-4 rounded-md">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name *</Label>
                                        <div className="relative">
                                            <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="name"
                                                placeholder="John Doe"
                                                className="pl-9"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="designation">Designation</Label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="designation"
                                                placeholder="Sales Executive"
                                                className="pl-9"
                                                value={formData.designation}
                                                onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="id">Employee ID *</Label>
                                        <div className="relative">
                                            <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="id"
                                                placeholder="EMP001"
                                                className="pl-9"
                                                value={formData.id}
                                                onChange={e => setFormData({ ...formData, id: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address *</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="john@example.com"
                                                className="pl-9"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="password">Password *</Label>
                                        <div className="relative">
                                            <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="Set a password for login"
                                                className="pl-9"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Used for login access.</p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="mr-2">Cancel</Button>
                                    <Button type="submit">
                                        <Save className="h-4 w-4 mr-2" />
                                        Create User
                                    </Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    Total Members: {members.length}
                                </h3>
                                <Button onClick={() => setIsAdding(true)} size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Member
                                </Button>
                            </div>

                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Designation</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="w-[80px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    Loading team...
                                                </TableCell>
                                            </TableRow>
                                        ) : members.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No team members found. Add one to get started.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            members.map((member) => (
                                                <TableRow key={member.id}>
                                                    <TableCell className="font-medium">{member.name}</TableCell>
                                                    <TableCell className="capitalize">{member.role}</TableCell>
                                                    <TableCell>{member.designation}</TableCell>
                                                    <TableCell>{member.email}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDelete(member.id, member.name)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

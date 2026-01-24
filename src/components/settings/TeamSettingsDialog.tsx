
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
import { useUser } from '@/components/auth/UserContext';
import { Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface TeamSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TeamSettingsDialog({ open, onOpenChange }: TeamSettingsDialogProps) {
    const { members, addMember, removeMember } = useUser();
    const [newName, setNewName] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        if (members.includes(newName.trim())) {
            toast.error('Member already exists');
            return;
        }

        addMember(newName.trim());
        setNewName('');
        toast.success('Member added');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Manage Team
                    </DialogTitle>
                    <DialogDescription>
                        Add or remove team members. These names will be available for lead assignment.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Add Member Form */}
                    <form onSubmit={handleAdd} className="flex gap-2 items-end">
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="new-member">New Member Name</Label>
                            <Input
                                id="new-member"
                                placeholder="e.g. Sarah Jones"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <Button type="submit" size="icon">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </form>

                    {/* Members List */}
                    <div className="space-y-2">
                        <Label>Current Members</Label>
                        <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto">
                            {members.length === 0 ? (
                                <p className="p-4 text-sm text-center text-muted-foreground">
                                    No members added yet. Add your first salesperson!
                                </p>
                            ) : (
                                members.map((member) => (
                                    <div key={member} className="p-2 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-green-500" />
                                            <span className="text-sm font-medium">{member}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => {
                                                if (confirm(`Remove ${member} from team?`)) {
                                                    removeMember(member);
                                                    toast.success('Member removed');
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

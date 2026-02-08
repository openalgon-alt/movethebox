
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useUser } from '@/components/auth/UserContext';
import { useState } from 'react';
import { Users } from 'lucide-react';
import { toast } from 'sonner';

interface BulkAssignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCount: number;
    onAssign: (memberId: string) => Promise<void>;
}

export function BulkAssignDialog({ open, onOpenChange, selectedCount, onAssign }: BulkAssignDialogProps) {
    const { members } = useUser();
    const [selectedMember, setSelectedMember] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAssign = async () => {
        if (!selectedMember) {
            toast.error("Please select a team member");
            return;
        }

        setIsSubmitting(true);
        try {
            await onAssign(selectedMember);
            onOpenChange(false);
            setSelectedMember('');
        } catch (error) {
            console.error(error);
            toast.error("Failed to assign leads");
        } finally {
            setIsSubmitting(false);
        }
    };

    const memberName = members.find(m => m.name === selectedMember || m.id === selectedMember)?.name || selectedMember;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Assign Leads
                    </DialogTitle>
                    <DialogDescription>
                        Assigning <strong>{selectedCount}</strong> selected leads to a team member.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Select Team Member</Label>
                        <Select
                            value={selectedMember}
                            onValueChange={setSelectedMember}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a salesperson" />
                            </SelectTrigger>
                            <SelectContent>
                                {members.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        No team members found.
                                    </div>
                                ) : (
                                    members.map((member) => (
                                        <SelectItem key={member.id} value={member.name}>
                                            {member.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssign}
                            disabled={!selectedMember || isSubmitting}
                        >
                            {isSubmitting ? 'Assigning...' : 'Assign Leads'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Lead } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { format, parseISO } from 'date-fns';
import { Calendar, Mail, Phone, User, Clock, FileText, Globe } from 'lucide-react';

interface LeadDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lead: Lead | null;
}

export function LeadDetailsDialog({ open, onOpenChange, lead }: LeadDetailsDialogProps) {
    if (!lead) return null;

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        try {
            return format(parseISO(dateStr), 'PPP');
        } catch {
            return dateStr;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-8">
                        <DialogTitle className="text-xl font-bold">{lead.name}</DialogTitle>
                        <StatusBadge status={lead.status} />
                    </div>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Key Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground w-16">Phone:</span>
                            <span className="font-medium">{lead.phone || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground w-16">Email:</span>
                            <span className="font-medium">{lead.email || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground w-16">Source:</span>
                            <span className="font-medium">{lead.source || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground w-16">Assigned:</span>
                            <span className="font-medium">{lead.assigned_to || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground w-16">Created:</span>
                            <span className="font-medium">{formatDate(lead.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground w-16">Follow-up:</span>
                            <span className="font-medium">{formatDate(lead.next_follow_up_date)}</span>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="font-semibold flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4" />
                            History & Notes
                        </h3>
                        <div className="bg-muted/50 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono leading-relaxed border max-h-[300px] overflow-y-auto">
                            {lead.notes ? lead.notes : <span className="text-muted-foreground italic">No notes available.</span>}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

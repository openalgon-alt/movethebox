import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useBulkCreateLeads } from '@/hooks/useLeads';
import { LeadFormData } from '@/types/lead';

interface CSVImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LEAD_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'source', label: 'Source', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'assigned_to', label: 'Assigned To', required: false },
  { key: 'next_follow_up_date', label: 'Next Follow-up Date', required: false },
  { key: 'notes', label: 'Notes', required: false },
];

export function CSVImport({ open, onOpenChange }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkCreate = useBulkCreateLeads();

  const parseCSV = (text: string): { headers: string[]; data: string[][] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = lines.slice(1).map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });

    return { headers, data };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    try {
      const text = await selectedFile.text();
      const { headers, data } = parseCSV(text);
      setCsvHeaders(headers);
      setCsvData(data);

      // Auto-map matching columns
      const autoMapping: Record<string, string> = {};
      LEAD_FIELDS.forEach(field => {
        const matchingHeader = headers.find(
          h => h.toLowerCase() === field.key.toLowerCase() ||
               h.toLowerCase() === field.label.toLowerCase()
        );
        if (matchingHeader) {
          autoMapping[field.key] = matchingHeader;
        }
      });
      setMapping(autoMapping);
      setStep('map');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    }
  };

  const handleImport = async () => {
    if (!mapping.name) {
      setError('Name field mapping is required');
      return;
    }

    const leads: Partial<LeadFormData>[] = csvData
      .filter(row => row.length > 0)
      .map(row => {
        const lead: Partial<LeadFormData> = {};
        LEAD_FIELDS.forEach(field => {
          const csvHeader = mapping[field.key];
          if (csvHeader) {
            const headerIndex = csvHeaders.indexOf(csvHeader);
            if (headerIndex !== -1 && row[headerIndex]) {
              (lead as Record<string, string>)[field.key] = row[headerIndex];
            }
          }
        });
        return lead;
      })
      .filter(lead => lead.name);

    if (leads.length === 0) {
      setError('No valid leads found in CSV');
      return;
    }

    try {
      await bulkCreate.mutateAsync(leads);
      handleClose();
    } catch {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setMapping({});
    setStep('upload');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Leads from CSV
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                CSV files only
              </p>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Map your CSV columns to lead fields. File: <strong>{file?.name}</strong>
            </p>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {LEAD_FIELDS.map(field => (
                <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                  <Label className="text-sm">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Select
                    value={mapping[field.key] || ''}
                    onValueChange={(value) => 
                      setMapping(prev => ({ ...prev, [field.key]: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Skip --</SelectItem>
                      {csvHeaders.map((header, i) => (
                        <SelectItem key={i} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-sm text-muted-foreground">
                Found <strong>{csvData.length}</strong> rows in CSV
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={bulkCreate.isPending}>
                {bulkCreate.isPending ? 'Importing...' : `Import ${csvData.length} Leads`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useProducts } from "@/hooks/useProducts";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface ProductCatalogDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProductCatalogDialog({ open, onOpenChange }: ProductCatalogDialogProps) {
    const { products, addProduct, updateProduct, deleteProduct, toggleProductStatus } = useProducts();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newIncentive, setNewIncentive] = useState('');
    const [isCustomizable, setIsCustomizable] = useState(false);

    const handleAddOrUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newPrice) return;

        const incentive = newIncentive ? parseFloat(newIncentive) : 0;

        if (editingId) {
            updateProduct(editingId, {
                name: newName,
                price: parseFloat(newPrice),
                incentive_percentage: incentive,
                is_incentive_customizable: isCustomizable
            });
            setEditingId(null);
            toast.success("Product updated successfully");
        } else {
            addProduct(newName, parseFloat(newPrice), incentive, isCustomizable);
        }

        resetForm();
    };

    const startEdit = (product: any) => {
        setEditingId(product.id);
        setNewName(product.name);
        setNewPrice(String(product.price));
        setNewIncentive(String(product.incentive_percentage || ''));
        setIsCustomizable(!!product.is_incentive_customizable);
    };

    const resetForm = () => {
        setEditingId(null);
        setNewName('');
        setNewPrice('');
        setNewIncentive('');
        setIsCustomizable(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this product?")) {
            deleteProduct(id);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetForm();
            onOpenChange(val);
        }}>
            <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Product Catalog</DialogTitle>
                    <DialogDescription>
                        Manage your products and standard pricing. Salespeople can select these when managing leads.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <form onSubmit={handleAddOrUpdate} className="grid grid-cols-12 gap-3 bg-muted/40 p-4 rounded-lg items-end">
                        <div className="col-span-3 space-y-2">
                            <Label htmlFor="prod-name">Product Name</Label>
                            <Input
                                id="prod-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Premium Plan"
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="prod-price">Price</Label>
                            <Input
                                id="prod-price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="prod-incentive">Incentive (%)</Label>
                            <Input
                                id="prod-incentive"
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={newIncentive}
                                onChange={(e) => setNewIncentive(e.target.value)}
                                placeholder="10"
                            />
                        </div>
                        <div className="col-span-3 flex items-center space-x-2 pb-2">
                            <Switch
                                id="customizable-mode"
                                checked={isCustomizable}
                                onCheckedChange={setIsCustomizable}
                            />
                            <Label htmlFor="customizable-mode" className="text-xs">Custom Value</Label>
                        </div>
                        <div className="col-span-2 flex gap-2">
                            <Button type="submit" className="w-full">
                                {editingId ? 'Update' : <><Plus className="h-4 w-4 mr-2" /> Add</>}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="outline" size="icon" onClick={resetForm}>
                                    <Trash2 className="h-4 w-4 rotate-45" />
                                </Button>
                            )}
                        </div>
                    </form>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Active</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Incentive</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                            No products added yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.map((product) => (
                                        <TableRow key={product.id} className={!product.active ? 'opacity-50 bg-muted/50' : ''}>
                                            <TableCell>
                                                <Switch
                                                    checked={product.active}
                                                    onCheckedChange={() => toggleProductStatus(product.id)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>${product.price.toLocaleString()}</TableCell>
                                            <TableCell>
                                                {product.is_incentive_customizable ? (
                                                    <span className="text-sm font-medium text-primary">Custom (Fixed Value)</span>
                                                ) : (
                                                    <span>{product.incentive_percentage || 0}%</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => startEdit(product)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(product.id)}>
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
            </DialogContent>
        </Dialog>
    );
}

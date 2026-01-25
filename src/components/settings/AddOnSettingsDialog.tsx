import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAddOns } from "./AddOnContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

interface AddOnSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddOnSettingsDialog({ open, onOpenChange }: AddOnSettingsDialogProps) {
    const { isProductsEnabled, isIncentivesEnabled, toggleProducts, toggleIncentives } = useAddOns();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add-ons & Modules</DialogTitle>
                    <DialogDescription>
                        Enable optional features to extend your CRM capabilities.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                <CardTitle className="text-base">Product Catalog</CardTitle>
                            </div>
                            <Switch
                                checked={isProductsEnabled}
                                onCheckedChange={toggleProducts}
                            />
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                Enable product management features:
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Define products and pricing</li>
                                    <li>Associate products with leads</li>
                                    <li>Track expected deal values</li>
                                </ul>
                            </CardDescription>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-purple-600" />
                                <CardTitle className="text-base">Incentive Tracking</CardTitle>
                            </div>
                            <Switch
                                checked={isIncentivesEnabled}
                                onCheckedChange={toggleIncentives}
                            />
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                Advanced commission tracking:
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Automated incentive calculations</li>
                                    <li>Salesperson performance dashboards</li>
                                    <li>Fixed or percentage-based rules</li>
                                </ul>
                            </CardDescription>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}

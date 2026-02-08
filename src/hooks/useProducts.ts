import { useState, useEffect } from 'react';
import { Product } from '@/types/lead';
import { toast } from 'sonner';

const STORAGE_KEY = 'crm_products';

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProducts = () => {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    setProducts(JSON.parse(saved));
                }
            } catch (error) {
                console.error('Failed to load products', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadProducts();
    }, []);

    const saveProducts = (newProducts: Product[]) => {
        setProducts(newProducts);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newProducts));
    };

    const addProduct = (name: string, price: number, incentive_percentage: number = 0, is_incentive_customizable: boolean = false) => {
        const newProduct: Product = {
            id: crypto.randomUUID(),
            name,
            price,
            active: true,
            incentive_percentage,
            is_incentive_customizable,
        };
        const updated = [...products, newProduct];
        saveProducts(updated);
        toast.success('Product added successfully');
        return newProduct;
    };

    const updateProduct = (id: string, updates: Partial<Product>) => {
        const updated = products.map(p =>
            p.id === id ? { ...p, ...updates } : p
        );
        saveProducts(updated);
        toast.success('Product updated');
    };

    const toggleProductStatus = (id: string) => {
        const product = products.find(p => p.id === id);
        if (!product) return;
        updateProduct(id, { active: !product.active });
    };

    const deleteProduct = (id: string) => {
        const updated = products.filter(p => p.id !== id);
        saveProducts(updated);
        toast.success('Product deleted');
    };

    return {
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStatus,
        isLoading,
        activeProducts: products.filter(p => p.active)
    };
}

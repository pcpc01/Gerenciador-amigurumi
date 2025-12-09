import { supabase } from './supabaseClient';
import { Product, Order, Client, Category } from '../types';

// --- Products ---

export const getProducts = async (): Promise<Product[]> => {
    if (!supabase) {
        console.warn('Supabase client not initialized. Returning empty products list.');
        throw new Error('Supabase client not initialized');
    }
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        photoUrl: p.photo_url,
        additionalImages: p.additional_images || [],
        description: p.description,
        weight: p.weight,
        height: p.height,
        width: p.width,
        length: p.length,
        basePrice: p.base_price,
        pdfLink: p.pdf_link,
        recipeText: p.recipe_text,
        category: p.category,
        categoryId: p.category_id,
        createdAt: p.created_at ? new Date(p.created_at).getTime() : undefined,
        shopeeLink: p.shopee_link,
        elo7Link: p.elo7_link,
        nuvemshopLink: p.nuvemshop_link,
        showInCatalog: p.show_in_catalog !== false, // Default to true if null/undefined
    }));
};

export const saveProduct = async (product: Product): Promise<void> => {
    if (!supabase) {
        console.warn('Supabase client not initialized. Cannot save product.');
        throw new Error('Supabase client not initialized');
    }
    const dbProduct = {
        id: product.id,
        name: product.name,
        photo_url: product.photoUrl,
        additional_images: product.additionalImages || [],
        description: product.description,
        weight: product.weight,
        height: product.height,
        width: product.width,
        length: product.length,
        base_price: product.basePrice,
        pdf_link: product.pdfLink,
        recipe_text: product.recipeText,
        category: product.category,
        category_id: product.categoryId || null,
        created_at: product.createdAt ? new Date(product.createdAt).toISOString() : new Date().toISOString(),
        shopee_link: product.shopeeLink,
        elo7_link: product.elo7Link,
        nuvemshop_link: product.nuvemshopLink,
        show_in_catalog: product.showInCatalog,
    };

    const { error } = await supabase
        .from('products')
        .upsert(dbProduct);

    if (error) {
        console.error('Error saving product:', error);
        console.log('Product data being saved:', dbProduct);
        throw error;
    }
};

export const deleteProduct = async (id: string): Promise<void> => {
    if (!supabase) {
        console.warn('Supabase client not initialized. Cannot delete product.');
        throw new Error('Supabase client not initialized');
    }
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
    if (!supabase) return undefined;
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching product by id:', error);
        return undefined;
    }

    if (!data) return undefined;

    return {
        id: data.id,
        name: data.name,
        photoUrl: data.photo_url,
        additionalImages: data.additional_images || [],
        description: data.description,
        weight: data.weight,
        height: data.height,
        width: data.width,
        length: data.length,
        basePrice: data.base_price,
        pdfLink: data.pdf_link,
        recipeText: data.recipe_text,
        category: data.category,
        categoryId: data.category_id,
        createdAt: data.created_at ? new Date(data.created_at).getTime() : undefined,
        shopeeLink: data.shopee_link,
        elo7Link: data.elo7_link,
        nuvemshopLink: data.nuvemshop_link,
        showInCatalog: data.show_in_catalog !== false,
    };
};

// --- Categories ---

export const getCategories = async (): Promise<Category[]> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return data || [];
};

export const saveCategory = async (category: Category): Promise<void> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase
        .from('categories')
        .upsert(category);

    if (error) {
        console.error('Error saving category:', error);
        throw error;
    }
};

// --- Clients ---

export const getClients = async (): Promise<Client[]> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }

    return data || [];
};

export const saveClient = async (client: Client): Promise<void> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase
        .from('clients')
        .upsert(client);

    if (error) {
        console.error('Error saving client:', error);
        throw error;
    }
};

export const deleteClient = async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting client:', error);
        throw error;
    }
};

export const getClientById = async (id: string): Promise<Client | undefined> => {
    if (!supabase) return undefined;
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching client by id:', error);
        return undefined;
    }

    return data || undefined;
};

// --- Orders ---

export const getOrders = async (): Promise<Order[]> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    return (data || []).map((o: any) => ({
        id: o.id,
        clientName: o.client_name,
        whatsapp: o.whatsapp,
        clientId: o.client_id,
        productId: o.product_id,
        orderDate: o.order_date,
        deliveryDate: o.delivery_date,
        finalPrice: o.final_price,
        status: o.status,
        progressNotes: o.progress_notes,
        currentStep: o.current_step,
        orderSource: o.order_source,
        paymentStatus: o.payment_status || 'pending',
        depositValue: o.deposit_value,
        notes: o.notes,
        quantity: o.quantity || 1
    }));
};

export const saveOrder = async (order: Order): Promise<void> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const dbOrder = {
        id: order.id,
        client_id: order.clientId,
        product_id: order.productId,
        client_name: order.clientName,
        whatsapp: order.whatsapp,
        order_date: order.orderDate,
        delivery_date: order.deliveryDate,
        final_price: order.finalPrice,
        status: order.status,
        progress_notes: order.progressNotes,
        current_step: order.currentStep,
        order_source: order.orderSource,
        payment_status: order.paymentStatus,
        deposit_value: order.depositValue,
        notes: order.notes,
        quantity: order.quantity
    };

    const { error } = await supabase
        .from('orders')
        .upsert(dbOrder);

    if (error) {
        console.error('Error saving order:', error);
        throw error;
    }
};

export const deleteOrder = async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting order:', error);
        throw error;
    }
};

export const getOrderById = async (id: string): Promise<Order | undefined> => {
    if (!supabase) return undefined;
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching order by id:', error);
        return undefined;
    }

    if (!data) return undefined;

    return {
        id: data.id,
        clientName: data.client_name,
        whatsapp: data.whatsapp,
        clientId: data.client_id,
        productId: data.product_id,
        orderDate: data.order_date,
        deliveryDate: data.delivery_date,
        finalPrice: data.final_price,
        status: data.status,
        progressNotes: data.progress_notes,
        currentStep: data.current_step,
        orderSource: data.order_source,
        paymentStatus: data.payment_status || 'pending',
        depositValue: data.deposit_value,
        notes: data.notes,
        quantity: data.quantity || 1
    };
};

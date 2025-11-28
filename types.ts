export interface Product {
  id: string;
  name: string;
  photoUrl: string;
  description: string;
  weight: string;
  height: string;
  width: string;
  length: string;
  basePrice: number;
  pdfLink: string;
  recipeText: string;
  createdAt?: number;
}

export interface Client {
  id: string;
  name: string;
  whatsapp: string;
  // source removed here
  address: string;
  notes: string;
}

export type OrderStatus = 'pending' | 'in_progress' | 'done' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  clientName: string;
  whatsapp: string;
  clientId?: string; // Optional reference to client ID
  productId: string; // Relation to Product
  orderDate: string; // Data em que o pedido foi feito
  deliveryDate: string;
  finalPrice: number;
  status: OrderStatus;
  progressNotes: string; // Persisted progress specific to this order
  currentStep: number; // Optional numeric step tracking
  orderSource: string; // Added here (Forma de encomenda)
}

export type ViewState = 'dashboard' | 'catalog' | 'orders' | 'calculator' | 'production_mode' | 'clients';

export interface PricingResult {
  nuvemshop: number;
  shopee: number;
  elo7: number;
}
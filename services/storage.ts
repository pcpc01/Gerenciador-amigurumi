import { Product, Order, Client } from '../types';

const PRODUCTS_KEY = 'atelie_products';
const ORDERS_KEY = 'atelie_orders';
const CLIENTS_KEY = 'atelie_clients';

const SAMPLE_PRODUCT: Product = {
  id: 'sample-bruxinha',
  name: 'Bruxinha',
  basePrice: 150.00,
  weight: '150g',
  height: '25cm',
  width: '',
  length: '',
  photoUrl: 'https://i.ibb.co/7xyHPbZh/IMG-20230929-144712.jpg',
  description: 'Leve um toque de magia e fofura para casa com esta encantadora boneca bruxinha em amigurumi! Totalmente artesanal, ela é perfeita para decorar um cantinho especial, presentear quem você ama ou para se tornar a companheira de aventuras da criançada.',
  pdfLink: 'https://drive.google.com/file/d/10wIhtvaq7ufoUI_7BfCz7cz8Op_z-UU9/view?usp=sharing',
  recipeText: '1. Primeiro Passo\n2. Segundo Passo\n3. Terceiro Passo',
  createdAt: Date.now()
};

const SAMPLE_CLIENT: Client = {
  id: 'sample-maria',
  name: 'Maria Aparecida dos Santos',
  whatsapp: '12988228365',
  address: '',
  notes: 'Cliente exemplo'
};

// --- Products ---

export const getProducts = (): Product[] => {
  const data = localStorage.getItem(PRODUCTS_KEY);
  if (!data) {
    // Initialize with sample data if storage is completely empty (first run)
    const initialProducts = [SAMPLE_PRODUCT];
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(initialProducts));
    return initialProducts;
  }
  
  const products = JSON.parse(data);
  
  // Optional: If array is empty (user deleted everything or previous version), 
  // we could force add it, but usually we respect the empty state after deletion.
  // However, for this specific request to "Create a product", if the list is empty we will add it 
  // to ensure the user sees it immediately.
  if (products.length === 0) {
      products.push(SAMPLE_PRODUCT);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }
  
  return products;
};

export const saveProduct = (product: Product): void => {
  const products = getProducts();
  const existingIndex = products.findIndex((p) => p.id === product.id);
  
  // Ensure createdAt exists
  if (!product.createdAt) {
    product.createdAt = Date.now();
  }
  
  if (existingIndex >= 0) {
    // Preserve original creation date if editing
    product.createdAt = products[existingIndex].createdAt || product.createdAt;
    products[existingIndex] = product;
  } else {
    products.push(product);
  }
  
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

export const deleteProduct = (id: string): void => {
  const products = getProducts().filter((p) => p.id !== id);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

// --- Clients ---

export const getClients = (): Client[] => {
  const data = localStorage.getItem(CLIENTS_KEY);
  if (!data) {
    const initialClients = [SAMPLE_CLIENT];
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(initialClients));
    return initialClients;
  }

  const clients = JSON.parse(data);
  
  // Ensure sample client exists if list is empty
  if (clients.length === 0) {
    clients.push(SAMPLE_CLIENT);
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  }

  return clients;
};

export const saveClient = (client: Client): void => {
  const clients = getClients();
  const existingIndex = clients.findIndex((c) => c.id === client.id);
  
  if (existingIndex >= 0) {
    clients[existingIndex] = client;
  } else {
    clients.push(client);
  }
  
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
};

export const deleteClient = (id: string): void => {
  const clients = getClients().filter((c) => c.id !== id);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
};

export const getClientById = (id: string): Client | undefined => {
  const clients = getClients();
  return clients.find(c => c.id === id);
};

// --- Orders ---

export const getOrders = (): Order[] => {
  const data = localStorage.getItem(ORDERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveOrder = (order: Order): void => {
  const orders = getOrders();
  const existingIndex = orders.findIndex((o) => o.id === order.id);
  
  if (existingIndex >= 0) {
    orders[existingIndex] = order;
  } else {
    orders.push(order);
  }
  
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const deleteOrder = (id: string): void => {
  const orders = getOrders().filter((o) => o.id !== id);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const getProductById = (id: string): Product | undefined => {
  const products = getProducts();
  return products.find(p => p.id === id);
};

export const getOrderById = (id: string): Order | undefined => {
  const orders = getOrders();
  return orders.find(o => o.id === id);
};
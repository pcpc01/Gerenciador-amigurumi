import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, ChevronRight, ChevronDown, Image as ImageIcon, FileText, Package, UserPlus, MapPin, MessageSquare, Megaphone, Filter, Edit, Trash2 } from 'lucide-react';
import { Order, Product, Client } from '../types';
import * as storage from '../services/storage_supabase';

interface Props {
  onSelectOrder: (orderId: string) => void;
}

export const Orders: React.FC<Props> = ({ onSelectOrder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [statusMenuOpenId, setStatusMenuOpenId] = useState<string | null>(null);

  // Create Order Form State
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '', // Fallback/Display
    whatsapp: '',   // Fallback/Display
    productId: '',
    orderDate: new Date().toISOString().split('T')[0], // Default to today
    deliveryDate: '',
    finalPrice: '',
    orderSource: ''
  });

  // Quick Create Product State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProductData, setNewProductData] = useState<Partial<Product>>({
    name: '',
    basePrice: 0,
    photoUrl: '',
    description: '',
    recipeText: '',
    pdfLink: '',
    weight: '',
    height: '',
    width: '',
    length: ''
  });

  // Quick Create Client State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState<Partial<Client>>({
    name: '',
    whatsapp: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedOrders = await storage.getOrders();
    setOrders(loadedOrders.sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()));
    setProducts(await storage.getProducts());
    setClients(await storage.getClients());
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      clientName: '',
      whatsapp: '',
      productId: '',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      finalPrice: '',
      orderSource: ''
    });
    setEditingOrderId(null);
  };

  const handleEditOrder = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingOrderId(order.id);
    setFormData({
      clientId: order.clientId || '',
      clientName: order.clientName,
      whatsapp: order.whatsapp,
      productId: order.productId,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      finalPrice: order.finalPrice.toString(),
      orderSource: order.orderSource || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta encomenda?')) {
      await storage.deleteOrder(orderId);
      loadData();
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedOrder = { ...order, status: newStatus };
    await storage.saveOrder(updatedOrder);
    loadData();
    setStatusMenuOpenId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === formData.productId);

    // Ensure we have client info either from ID or manual entry (though manual is removed from UI now)
    const client = clients.find(c => c.id === formData.clientId);
    const clientName = client ? client.name : formData.clientName;
    const whatsapp = client ? client.whatsapp : formData.whatsapp;

    if (!product || !clientName) return;

    // Preserve existing order data if editing
    let existingOrder: Order | undefined;
    if (editingOrderId) {
      existingOrder = orders.find(o => o.id === editingOrderId);
    }

    const newOrder: Order = {
      id: editingOrderId || crypto.randomUUID(),
      clientName: clientName,
      whatsapp: whatsapp,
      clientId: formData.clientId,
      productId: formData.productId,
      orderDate: formData.orderDate,
      deliveryDate: formData.deliveryDate,
      finalPrice: parseFloat(formData.finalPrice),
      status: existingOrder ? existingOrder.status : 'pending',
      progressNotes: existingOrder ? existingOrder.progressNotes : '',
      currentStep: existingOrder ? existingOrder.currentStep : 0,
      orderSource: formData.orderSource
    };

    await storage.saveOrder(newOrder);
    setIsModalOpen(false);
    resetForm();
    loadData();
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productToSave: Product = {
      id: crypto.randomUUID(),
      name: newProductData.name || 'Sem nome',
      basePrice: Number(newProductData.basePrice) || 0,
      photoUrl: newProductData.photoUrl || 'https://picsum.photos/200',
      description: newProductData.description || '',
      recipeText: newProductData.recipeText || '',
      pdfLink: newProductData.pdfLink || '',
      weight: newProductData.weight || '',
      height: newProductData.height || '',
      width: newProductData.width || '',
      length: newProductData.length || ''
    };

    await storage.saveProduct(productToSave);

    // Refresh products list
    const updatedProducts = await storage.getProducts();
    setProducts(updatedProducts);

    // Select the new product in the order form
    setFormData(prev => ({
      ...prev,
      productId: productToSave.id,
      finalPrice: productToSave.basePrice.toString()
    }));

    // Reset and close product modal
    setNewProductData({
      name: '',
      basePrice: 0,
      photoUrl: '',
      description: '',
      recipeText: '',
      pdfLink: '',
      weight: '',
      height: '',
      width: '',
      length: ''
    });
    setIsProductModalOpen(false);
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientToSave: Client = {
      id: crypto.randomUUID(),
      name: newClientData.name || 'Sem nome',
      whatsapp: newClientData.whatsapp || '',
      address: newClientData.address || '',
      notes: newClientData.notes || ''
    };

    await storage.saveClient(clientToSave);

    // Refresh clients list
    const updatedClients = await storage.getClients();
    setClients(updatedClients);

    // Select the new client
    setFormData(prev => ({
      ...prev,
      clientId: clientToSave.id,
      clientName: clientToSave.name,
      whatsapp: clientToSave.whatsapp
    }));

    // Reset and close
    setNewClientData({
      name: '',
      whatsapp: '',
      address: '',
      notes: ''
    });
    setIsClientModalOpen(false);
  };

  const getProductDetails = (id: string) => products.find(p => p.id === id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Aguardando Início';
      case 'in_progress': return 'Em Produção';
      case 'done': return 'Concluído';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getDaysRemaining = (dateString: string) => {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parsing manual para evitar problemas de timezone com UTC
    const [year, month, day] = dateString.split('-').map(Number);
    const delivery = new Date(year, month - 1, day);

    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Atrasado ${Math.abs(diffDays)} dias`, color: 'text-rose-600 font-bold' };
    if (diffDays === 0) return { text: 'Entrega hoje!', color: 'text-amber-600 font-bold' };
    if (diffDays === 1) return { text: 'Falta 1 dia', color: 'text-amber-600' };
    return { text: `Faltam ${diffDays} dias`, color: 'text-stone-400' };
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Encomendas</h2>
          <p className="text-stone-500 text-sm">Organize sua fila de produção</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
              <Filter size={14} />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-stone-300 text-stone-700 py-2 pl-9 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Aguardando Início</option>
              <option value="in_progress">Em Produção</option>
              <option value="done">Concluído</option>
              <option value="delivered">Entregue</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>

          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-700 transition shadow-sm whitespace-nowrap"
          >
            <Plus size={18} />
            <span className="hidden md:inline">Nova Encomenda</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredOrders.map(order => {
          const product = getProductDetails(order.productId);
          const daysInfo = getDaysRemaining(order.deliveryDate);

          return (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order.id)}
              className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 cursor-pointer hover:border-rose-300 hover:shadow-md transition group relative"
            >
              <div className="flex items-center gap-4">
                {/* Product Thumb */}
                <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                  {product ? (
                    <img src={product.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-stone-200" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-stone-800 truncate">{order.clientName}</h3>
                    <span className={`md:hidden text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500 truncate">{product?.name || 'Produto desconhecido'}</p>

                  <div className="flex items-center gap-4 mt-2 text-xs text-stone-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
                      {daysInfo && (
                        <span className={`ml-1 ${daysInfo.color}`}>
                          ({daysInfo.text})
                        </span>
                      )}
                    </span>
                    <span className="font-medium text-stone-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.finalPrice)}
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex flex-1 justify-center items-center relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusMenuOpenId(statusMenuOpenId === order.id ? null : order.id);
                    }}
                    className={`px-3 py-1 rounded-full font-medium text-sm ${getStatusColor(order.status)} hover:opacity-80 transition flex items-center gap-1 cursor-pointer`}
                  >
                    {getStatusLabel(order.status)}
                    <ChevronDown size={14} />
                  </button>

                  {statusMenuOpenId === order.id && (
                    <div
                      className="absolute top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-100 z-20 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {['pending', 'in_progress', 'done', 'delivered', 'cancelled'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(order.id, status as any)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-stone-50 flex items-center gap-2 ${order.status === status ? 'bg-stone-50 font-medium text-rose-600' : 'text-stone-600'}`}
                        >
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(status).split(' ')[0]}`} />
                          {getStatusLabel(status)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleEditOrder(order, e)}
                    className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteOrder(order.id, e)}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                  <ChevronRight className="text-stone-300 group-hover:text-rose-500 transition ml-2" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-300">
            <p>Nenhuma encomenda encontrada com este filtro.</p>
            {statusFilter === 'all' && <p className="text-xs mt-1">Clique em "Nova Encomenda" para começar.</p>}
          </div>
        )}
      </div>

      {/* New/Edit Order Modal */}
      {isModalOpen && !isProductModalOpen && !isClientModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">{editingOrderId ? 'Editar Encomenda' : 'Nova Encomenda'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Cliente</label>
                  <select
                    required
                    className="w-full border rounded-lg p-2 bg-white"
                    value={formData.clientId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      const client = clients.find(c => c.id === cid);
                      setFormData(prev => ({
                        ...prev,
                        clientId: cid,
                        clientName: client ? client.name : '',
                        whatsapp: client ? client.whatsapp : ''
                      }));
                    }}
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsClientModalOpen(true)}
                    className="mt-2 text-sm text-rose-600 font-medium hover:text-rose-700 flex items-center gap-1"
                  >
                    <UserPlus size={14} /> Cadastrar novo cliente
                  </button>
                </div>

                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Produto do Catálogo</label>
                  <select
                    required
                    className="w-full border rounded-lg p-2 bg-white"
                    value={formData.productId}
                    onChange={(e) => {
                      const pid = e.target.value;
                      const prod = products.find(p => p.id === pid);
                      setFormData(prev => ({
                        ...prev,
                        productId: pid,
                        finalPrice: prod ? prod.basePrice.toString() : prev.finalPrice
                      }));
                    }}
                  >
                    <option value="">Selecione um produto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - R$ {p.basePrice}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(true)}
                    className="mt-2 text-sm text-rose-600 font-medium hover:text-rose-700 flex items-center gap-1"
                  >
                    <Plus size={14} /> Cadastrar novo produto
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Data do Pedido</label>
                    <input
                      required
                      type="date"
                      className="w-full border rounded-lg p-2"
                      value={formData.orderDate}
                      onChange={e => setFormData({ ...formData, orderDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Data Entrega</label>
                    <input required type="date" className="w-full border rounded-lg p-2" value={formData.deliveryDate} onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Valor Final</label>
                  <input required type="number" step="0.01" className="w-full border rounded-lg p-2" value={formData.finalPrice} onChange={e => setFormData({ ...formData, finalPrice: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Forma de Encomenda / Canal</label>
                  <input
                    placeholder="Ex: Instagram, Elo7, Whatsapp..."
                    className="w-full border rounded-lg p-2"
                    value={formData.orderSource}
                    onChange={e => setFormData({ ...formData, orderSource: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4 mt-2">
                  <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 py-2 border rounded-lg hover:bg-stone-50">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">{editingOrderId ? 'Salvar Alterações' : 'Criar Pedido'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Quick Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Novo Produto (Rápido)</h3>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
                    <input required className="w-full border rounded-lg p-2" value={newProductData.name} onChange={e => setNewProductData({ ...newProductData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Preço Base (R$)</label>
                    <input type="number" step="0.01" className="w-full border rounded-lg p-2" value={newProductData.basePrice} onChange={e => setNewProductData({ ...newProductData, basePrice: parseFloat(e.target.value) })} />
                  </div>
                </div>

                {/* Dimensions Section */}
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                  <h4 className="text-xs font-semibold text-stone-500 uppercase mb-2 flex items-center gap-1">
                    <Package size={14} /> Dimensões & Peso
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">Peso (g)</label>
                      <input className="w-full border rounded-lg p-2 text-sm" placeholder="ex: 150g" value={newProductData.weight} onChange={e => setNewProductData({ ...newProductData, weight: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">Altura</label>
                      <input className="w-full border rounded-lg p-2 text-sm" placeholder="ex: 20cm" value={newProductData.height} onChange={e => setNewProductData({ ...newProductData, height: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">Largura</label>
                      <input className="w-full border rounded-lg p-2 text-sm" placeholder="ex: 10cm" value={newProductData.width} onChange={e => setNewProductData({ ...newProductData, width: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">Comp.</label>
                      <input className="w-full border rounded-lg p-2 text-sm" placeholder="ex: 10cm" value={newProductData.length} onChange={e => setNewProductData({ ...newProductData, length: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">URL da Foto</label>
                  <div className="flex gap-2">
                    <input className="w-full border rounded-lg p-2 flex-1" value={newProductData.photoUrl} onChange={e => setNewProductData({ ...newProductData, photoUrl: e.target.value })} placeholder="https://..." />
                    <div className="w-10 h-10 bg-stone-100 rounded border flex items-center justify-center overflow-hidden shrink-0">
                      {newProductData.photoUrl ? (
                        <img src={newProductData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={16} className="text-stone-400" />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Descrição Curta</label>
                  <textarea rows={2} className="w-full border rounded-lg p-2" value={newProductData.description} onChange={e => setNewProductData({ ...newProductData, description: e.target.value })} />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-rose-500" />
                    Dados da Receita
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Link PDF (Drive/Dropbox)</label>
                      <input className="w-full border rounded-lg p-2" value={newProductData.pdfLink} onChange={e => setNewProductData({ ...newProductData, pdfLink: e.target.value })} placeholder="https://" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Receita em Texto (Copie e Cole)</label>
                      <textarea
                        rows={6}
                        className="w-full border rounded-lg p-2 font-mono text-sm"
                        value={newProductData.recipeText}
                        onChange={e => setNewProductData({ ...newProductData, recipeText: e.target.value })}
                        placeholder="R1: 6pb no AM (6)..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 mt-2">
                  <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 py-2 border rounded-lg hover:bg-stone-50">Voltar</button>
                  <button type="submit" className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">Salvar & Selecionar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* New Client Modal (Quick) */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Novo Cliente</h3>
              <form onSubmit={handleClientSubmit} className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Nome Completo</label>
                  <input
                    required
                    className="w-full border rounded-lg p-2"
                    value={newClientData.name}
                    onChange={e => setNewClientData({ ...newClientData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">WhatsApp</label>
                  <input
                    required
                    placeholder="(00) 00000-0000"
                    className="w-full border rounded-lg p-2"
                    value={newClientData.whatsapp}
                    onChange={e => setNewClientData({ ...newClientData, whatsapp: e.target.value })}
                  />
                </div>

                {/* Source removed from Client */}

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-1">
                    <MapPin size={14} /> Endereço
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border rounded-lg p-2"
                    value={newClientData.address}
                    onChange={e => setNewClientData({ ...newClientData, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-1">
                    <MessageSquare size={14} /> Observação
                  </label>
                  <textarea
                    rows={2}
                    className="w-full border rounded-lg p-2"
                    value={newClientData.notes}
                    onChange={e => setNewClientData({ ...newClientData, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4 mt-2">
                  <button type="button" onClick={() => setIsClientModalOpen(false)} className="flex-1 py-2 border rounded-lg hover:bg-stone-50">Voltar</button>
                  <button type="submit" className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">Cadastrar Cliente</button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

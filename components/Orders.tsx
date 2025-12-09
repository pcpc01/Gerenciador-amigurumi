import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, ChevronRight, ChevronDown, Image as ImageIcon, FileText, Package, UserPlus, MapPin, MessageSquare, Megaphone, Filter, Edit, Trash2, X, User, Phone, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Product, Client } from '../types';
import * as storage from '../services/storage_supabase';
import { uploadToImgBB } from '../services/imgbb';

interface Props {
  onSelectOrder: (orderId: string) => void;
}

export const Orders: React.FC<Props> = ({ onSelectOrder }) => {
  // Helper para gerar UUID compatível com todos os navegadores
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  // Status filter removed in favor of split tables
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [statusMenuOpenId, setStatusMenuOpenId] = useState<string | null>(null);
  const [statusMenuPosition, setStatusMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [paymentMenuOpenId, setPaymentMenuOpenId] = useState<string | null>(null);
  const [paymentMenuPosition, setPaymentMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isOpenOrdersListOpen, setIsOpenOrdersListOpen] = useState(false);
  const [isDoneOrdersOpen, setIsDoneOrdersOpen] = useState(false);
  const [isDeliveredOrdersOpen, setIsDeliveredOrdersOpen] = useState(false);
  const [isCancelledOrdersOpen, setIsCancelledOrdersOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (statusMenuOpenId) setStatusMenuOpenId(null);
      if (paymentMenuOpenId) setPaymentMenuOpenId(null);
    };
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [statusMenuOpenId, paymentMenuOpenId]);

  // Create Order Form State
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '', // Fallback/Display
    whatsapp: '',   // Fallback/Display
    productId: '',
    orderDate: new Date().toISOString().split('T')[0], // Default to today
    deliveryDate: '',
    finalPrice: '',
    orderSource: '',
    paymentStatus: 'pending',

    depositValue: '',
    notes: '',
    quantity: 1
  });

  // Quick Create Product State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProductData, setNewProductData] = useState<Partial<Product>>({
    name: '',
    category: '',
    basePrice: 0,
    photoUrl: '',
    description: '',
    recipeText: '',
    pdfLink: '',
    weight: '',
    height: '',
    width: '',
    length: '',
    shopeeLink: '',
    elo7Link: '',
    nuvemshopLink: ''
  });

  // Quick Create Client State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState<Partial<Client>>({
    name: '',
    whatsapp: '',
    address: '',
    notes: ''
  });

  // PDF Generation State
  const [isPdfFilterModalOpen, setIsPdfFilterModalOpen] = useState(false);
  const [pdfSelectedStatuses, setPdfSelectedStatuses] = useState<string[]>(['pending', 'in_progress', 'done', 'delivered', 'cancelled']);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedOrders = await storage.getOrders();
    setOrders(loadedOrders.sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()));

    const loadedProducts = await storage.getProducts();
    setProducts(loadedProducts.sort((a, b) => a.name.localeCompare(b.name)));

    const loadedClients = await storage.getClients();
    setClients(loadedClients.sort((a, b) => a.name.localeCompare(b.name)));
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
      orderSource: '',
      paymentStatus: 'pending',

      depositValue: '',
      notes: '',
      quantity: 1
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
      orderSource: order.orderSource || '',
      paymentStatus: order.paymentStatus || 'pending',
      depositValue: order.depositValue ? order.depositValue.toString() : '',
      notes: order.notes || '',
      quantity: order.quantity || 1
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

  const handlePaymentStatusUpdate = async (orderId: string, newStatus: Order['paymentStatus']) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedOrder = { ...order, paymentStatus: newStatus };
    await storage.saveOrder(updatedOrder);
    loadData();
    setPaymentMenuOpenId(null);
  };

  const handleOpenPdfModal = () => {
    setIsPdfFilterModalOpen(true);
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(225, 29, 72); // Rose-600
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Lista de Encomendas', 14, 20);
    doc.setFontSize(12);
    doc.text('Patty Crochê', 14, 28);

    // Info
    doc.setTextColor(100);
    doc.setFontSize(10);
    const date = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${date}`, 14, 48);

    // Filter to show relevant orders (usually open ones, but lets dump all visible or just open?)
    // User request "baixar as encomendas" implies all active ones probably?
    // Let's print ALL orders sorted by date to be comprehensive, or maybe just Open ones?
    // "Baixar as encomendas" usually implies a report. Let's do ALL currently loaded orders.

    // Filter orders based on selected statuses
    const filteredOrders = orders.filter(order => pdfSelectedStatuses.includes(order.status));

    const tableBody = filteredOrders.map(order => {
      const product = getProductDetails(order.productId);
      return [
        order.clientName,
        product?.name || '?',
        new Date(order.deliveryDate).toLocaleDateString('pt-BR'),
        getStatusLabel(order.status),
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.finalPrice),
        getPaymentStatusLabel(order.paymentStatus)
      ];
    });

    // Table
    autoTable(doc, {
      startY: 55,
      head: [['Cliente', 'Produto', 'Entrega', 'Status', 'Valor', 'Pagamento']],
      body: tableBody,
      headStyles: {
        fillColor: [225, 29, 72],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
    }

    doc.save('encomendas-patty-croche.pdf');
    setIsPdfFilterModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === formData.productId);

    // Ensure we have client info either from ID or manual entry (though manual is removed from UI now)
    const client = clients.find(c => c.id === formData.clientId);
    const clientName = client ? client.name : formData.clientName;
    const whatsapp = client ? client.whatsapp : formData.whatsapp;

    if (!product || !clientName) {
      alert('Por favor, selecione um cliente e um produto.');
      return;
    }

    try {
      // Preserve existing order data if editing
      let existingOrder: Order | undefined;
      if (editingOrderId) {
        existingOrder = orders.find(o => o.id === editingOrderId);
      }

      const newOrder: Order = {
        id: editingOrderId || generateUUID(),
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
        orderSource: formData.orderSource,
        paymentStatus: formData.paymentStatus as any,

        depositValue: formData.depositValue ? parseFloat(formData.depositValue) : undefined,
        notes: formData.notes,
        quantity: formData.quantity
      };

      await storage.saveOrder(newOrder);
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar encomenda:', error);
      if (error.message === 'Supabase client not initialized') {
        alert('Erro de Configuração: O Supabase não foi inicializado. Verifique se as variáveis de ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) estão configuradas corretamente no arquivo .env.local.');
      } else {
        alert(`Ocorreu um erro ao salvar a encomenda: ${error.message || 'Erro desconhecido'}`);
      }
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productToSave: Product = {
      id: generateUUID(),
      name: newProductData.name || 'Sem nome',
      category: newProductData.category || '',
      basePrice: Number(newProductData.basePrice) || 0,
      photoUrl: newProductData.photoUrl || 'https://picsum.photos/200',
      description: newProductData.description || '',
      recipeText: newProductData.recipeText || '',
      pdfLink: newProductData.pdfLink || '',
      weight: newProductData.weight || '',
      height: newProductData.height || '',
      width: newProductData.width || '',
      length: newProductData.length || '',
      shopeeLink: newProductData.shopeeLink || '',
      elo7Link: newProductData.elo7Link || '',
      nuvemshopLink: newProductData.nuvemshopLink || ''
    };

    try {
      await storage.saveProduct(productToSave);

      // Refresh products list
      const updatedProducts = await storage.getProducts();
      setProducts(updatedProducts.sort((a, b) => a.name.localeCompare(b.name)));

      // Select the new product in the order form
      setFormData(prev => ({
        ...prev,
        productId: productToSave.id,
        finalPrice: productToSave.basePrice.toString()
      }));

      // Reset and close product modal
      setNewProductData({
        name: '',
        category: '',
        basePrice: 0,
        photoUrl: '',
        description: '',
        recipeText: '',
        pdfLink: '',
        weight: '',
        height: '',
        width: '',
        length: '',
        shopeeLink: '',
        elo7Link: '',
        nuvemshopLink: ''
      });
      setIsProductModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      if (error.message === 'Supabase client not initialized') {
        alert('Erro de Configuração: O Supabase não foi inicializado. Verifique seu arquivo .env.local.');
      } else {
        alert(`Erro ao salvar produto: ${error.message || 'Erro desconhecido'}`);
      }
    }
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientToSave: Client = {
      id: generateUUID(),
      name: newClientData.name || 'Sem nome',
      whatsapp: newClientData.whatsapp || '',
      address: newClientData.address || '',
      notes: newClientData.notes || ''
    };

    try {
      await storage.saveClient(clientToSave);

      // Refresh clients list
      const updatedClients = await storage.getClients();
      setClients(updatedClients.sort((a, b) => a.name.localeCompare(b.name)));

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
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      if (error.message === 'Supabase client not initialized') {
        alert('Erro de Configuração: O Supabase não foi inicializado. Verifique seu arquivo .env.local.');
      } else {
        alert(`Erro ao salvar cliente: ${error.message || 'Erro desconhecido'}`);
      }
    }
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'deposit': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'pending': return 'bg-stone-100 text-stone-600 border-stone-200';
      default: return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'deposit': return 'Sinal';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-').map(Number);
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${String(day).padStart(2, '0')} ${monthNames[month - 1]} ${year}`;
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
    return { text: `Faltam ${diffDays} dias`, color: 'text-stone-600 font-medium' };
  };

  const openOrders = orders.filter(o => ['pending', 'in_progress'].includes(o.status));
  const doneOrders = orders.filter(o => o.status === 'done');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  const OrderTable = ({ orders, emptyMessage }: { orders: Order[], emptyMessage: string }) => (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-[10px] uppercase tracking-wider border-b border-stone-200">
                <th className="px-4 py-3 font-semibold text-left w-[35%]">Produto</th>
                <th className="px-4 py-3 font-semibold text-left w-[25%]">Observação</th>
                <th className="px-4 py-3 font-semibold text-center w-[10%]">Entrega</th>
                <th className="px-4 py-3 font-semibold text-center w-[10%]">Status</th>
                <th className="px-4 py-3 font-semibold text-center w-[15%]">Valor</th>
                <th className="px-4 py-3 font-semibold text-center w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {orders.map(order => {
                const product = getProductDetails(order.productId);
                const daysInfo = ['delivered', 'cancelled'].includes(order.status)
                  ? null
                  : getDaysRemaining(order.deliveryDate);

                return (
                  <tr
                    key={order.id}
                    onClick={() => setViewingOrder(order)}
                    className="hover:bg-stone-50 transition cursor-pointer group"
                  >
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-stone-100 rounded-md overflow-hidden shrink-0 border border-stone-200">
                          {product ? (
                            <img src={product.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-stone-200" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-stone-800 truncate max-w-[220px]">
                            <span className="text-rose-600 font-bold mr-1.5 text-xs bg-rose-50 px-1.5 py-0.5 rounded">
                              {order.quantity || 1}x
                            </span>
                            {product?.name || 'Produto desconhecido'}
                          </div>
                          <div className="text-xs text-stone-500 truncate flex items-center gap-1 mt-0.5">
                            <User size={10} />
                            {order.clientName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="text-xs text-stone-500 max-w-[200px] truncate" title={order.notes}>
                        {order.notes || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-stone-600 font-medium">{new Date(order.deliveryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                        {daysInfo && (
                          <span className={`text-[10px] leading-tight ${daysInfo.color}`}>
                            {daysInfo.text.replace('Faltam ', '').replace(' dias', 'd')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            if (statusMenuOpenId === order.id) {
                              setStatusMenuOpenId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setStatusMenuPosition({ top: rect.bottom + 4, left: rect.left });
                              setStatusMenuOpenId(order.id);
                            }
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-medium border ${getStatusColor(order.status)} hover:brightness-95 transition flex items-center gap-1 cursor-pointer shadow-sm whitespace-nowrap`}
                        >
                          {getStatusLabel(order.status)}
                          <ChevronDown size={10} className="opacity-70" />
                        </button>

                        {statusMenuOpenId === order.id && statusMenuPosition && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setStatusMenuOpenId(null)} />
                            <div
                              className="fixed z-50 bg-white rounded-lg shadow-xl border border-stone-100 overflow-hidden min-w-[140px]"
                              style={{ top: statusMenuPosition.top, left: statusMenuPosition.left }}
                            >
                              {['pending', 'in_progress', 'done', 'delivered', 'cancelled'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusUpdate(order.id, status as any)}
                                  className={`w-full text-left px-3 py-2 text-xs hover:bg-stone-50 flex items-center gap-2 transition border-l-2 ${order.status === status ? 'bg-stone-50 font-medium text-rose-600 border-rose-500' : 'text-stone-600 border-transparent'}`}
                                >
                                  <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(status).split(' ')[0]}`} />
                                  {getStatusLabel(status)}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      <div className="flex flex-col items-center justify-center w-full gap-1">
                        <span className="font-medium text-stone-700 text-sm">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.finalPrice)}
                        </span>

                        {order.depositValue && order.status !== 'delivered' && (
                          <span className="text-[10px] text-rose-600 font-medium whitespace-nowrap mt-0.5">
                            Sinal: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.depositValue)}
                          </span>
                        )}

                        <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              if (paymentMenuOpenId === order.id) {
                                setPaymentMenuOpenId(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setPaymentMenuPosition({ top: rect.bottom + 4, left: rect.left });
                                setPaymentMenuOpenId(order.id);
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 hover:brightness-95 transition cursor-pointer whitespace-nowrap ${getPaymentStatusColor(order.paymentStatus)}`}
                          >
                            {getPaymentStatusLabel(order.paymentStatus)}
                            <ChevronDown size={8} className="opacity-70" />
                          </button>

                          {paymentMenuOpenId === order.id && paymentMenuPosition && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setPaymentMenuOpenId(null)} />
                              <div
                                className="fixed z-50 bg-white rounded-lg shadow-xl border border-stone-100 overflow-hidden min-w-[120px]"
                                style={{ top: paymentMenuPosition.top, left: paymentMenuPosition.left }}
                              >
                                {['pending', 'deposit', 'paid'].map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => handlePaymentStatusUpdate(order.id, status as any)}
                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-stone-50 flex items-center gap-2 transition border-l-2 ${order.paymentStatus === status ? 'bg-stone-50 font-medium text-emerald-600 border-emerald-500' : 'text-stone-600 border-transparent'}`}
                                  >
                                    <div className={`w-1.5 h-1.5 rounded-full ${getPaymentStatusColor(status).split(' ')[0]}`} />
                                    {getPaymentStatusLabel(status)}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleEditOrder(order, e)}
                          className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                          title="Editar"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteOrder(order.id, e)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12 text-stone-400">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {orders.map(order => {
          const product = getProductDetails(order.productId);
          const daysInfo = ['delivered', 'cancelled'].includes(order.status)
            ? null
            : getDaysRemaining(order.deliveryDate);

          return (
            <div
              key={order.id}
              onClick={() => setViewingOrder(order)}
              className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 active:bg-stone-50 transition-colors"
            >
              <div className="flex gap-3 mb-3">
                <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden shrink-0 border border-stone-200">
                  {product ? (
                    <img src={product.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-stone-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-stone-800 truncate pr-2">
                      <span className="text-rose-600 mr-1">{order.quantity || 1}x</span>
                      {product?.name || 'Produto desconhecido'}
                    </h4>
                    <span className="font-bold text-stone-700 text-sm whitespace-nowrap">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.finalPrice)}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500 truncate">{order.clientName}</p>

                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-xs text-stone-500">
                      {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
                    </div>
                    {daysInfo && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 ${daysInfo.color}`}>
                        {daysInfo.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100">
                <div className="flex gap-2 overflow-x-auto" onClick={e => e.stopPropagation()}>
                  {/* Status Dropdown Mobile */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        if (statusMenuOpenId === order.id) {
                          setStatusMenuOpenId(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setStatusMenuPosition({ top: rect.bottom + 4, left: rect.left });
                          setStatusMenuOpenId(order.id);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg font-medium text-xs border ${getStatusColor(order.status)} flex items-center gap-1 whitespace-nowrap`}
                    >
                      {getStatusLabel(order.status)}
                      <ChevronDown size={12} className="opacity-70" />
                    </button>
                    {statusMenuOpenId === order.id && statusMenuPosition && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setStatusMenuOpenId(null)} />
                        <div
                          className="fixed z-50 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden min-w-[160px]"
                          style={{ top: statusMenuPosition.top, left: statusMenuPosition.left }}
                        >
                          {['pending', 'in_progress', 'done', 'delivered', 'cancelled'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusUpdate(order.id, status as any)}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 flex items-center gap-2 transition border-l-4 ${order.status === status ? 'bg-stone-50 font-medium text-rose-600 border-rose-500' : 'text-stone-600 border-transparent'}`}
                            >
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(status).split(' ')[0]}`} />
                              {getStatusLabel(status)}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Payment Dropdown Mobile */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        if (paymentMenuOpenId === order.id) {
                          setPaymentMenuOpenId(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPaymentMenuPosition({ top: rect.bottom + 4, left: rect.left });
                          setPaymentMenuOpenId(order.id);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg font-medium text-xs border flex items-center gap-1 whitespace-nowrap ${getPaymentStatusColor(order.paymentStatus)}`}
                    >
                      {getPaymentStatusLabel(order.paymentStatus)}
                      <ChevronDown size={12} className="opacity-70" />
                    </button>
                    {paymentMenuOpenId === order.id && paymentMenuPosition && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setPaymentMenuOpenId(null)} />
                        <div
                          className="fixed z-50 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden min-w-[140px]"
                          style={{ top: paymentMenuPosition.top, left: paymentMenuPosition.left }}
                        >
                          {['pending', 'deposit', 'paid'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handlePaymentStatusUpdate(order.id, status as any)}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 flex items-center gap-2 transition border-l-4 ${order.paymentStatus === status ? 'bg-stone-50 font-medium text-emerald-600 border-emerald-500' : 'text-stone-600 border-transparent'}`}
                            >
                              <div className={`w-2 h-2 rounded-full ${getPaymentStatusColor(status).split(' ')[0]}`} />
                              {getPaymentStatusLabel(status)}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleEditOrder(order, e)}
                    className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteOrder(order.id, e)}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="text-center py-12 text-stone-400 bg-stone-50 rounded-xl border border-stone-200 border-dashed">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Encomendas</h2>
          <p className="text-stone-500 text-sm">Organize sua fila de produção</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenPdfModal}
            className="bg-stone-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-stone-900 transition shadow-sm"
            title="Baixar Lista de Encomendas em PDF"
          >
            <Download size={18} />
            <span className="hidden sm:inline">PDF</span>
          </button>
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

      <div className="space-y-12">
        {/* Resumo de Pedidos em Aberto */}
        {openOrders.length > 0 && (

          <section className="mb-8">
            <button
              onClick={() => setIsSummaryOpen(!isSummaryOpen)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-amber-100 text-amber-900 hover:bg-amber-200 transition shadow-sm"
            >
              <div className="flex items-center gap-2 font-bold text-lg">
                <FileText size={20} />
                Resumo - Próximas Entregas
              </div>
              <ChevronDown
                size={20}
                className={`transition-transform duration-300 ${isSummaryOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isSummaryOpen && (
              <div className="mt-4 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-stone-200">
                  {openOrders.map(order => {
                    const product = getProductDetails(order.productId);
                    const daysInfo = getDaysRemaining(order.deliveryDate);

                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 hover:bg-stone-50 transition cursor-pointer group"
                        onClick={(e) => handleEditOrder(order, e)}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 bg-stone-100 rounded-lg overflow-hidden shrink-0 border border-stone-200">
                            {product ? (
                              <img src={product.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-stone-200" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-stone-800 truncate text-sm">
                                <span className="text-rose-600 font-bold mr-1">{order.quantity || 1}x</span>
                                {product?.name || 'Produto desconhecido'}
                              </p>
                              <div className="relative" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={(e) => {
                                    if (statusMenuOpenId === `summary-${order.id}`) {
                                      setStatusMenuOpenId(null);
                                    } else {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setStatusMenuPosition({ top: rect.bottom + 4, left: rect.left });
                                      setStatusMenuOpenId(`summary-${order.id}`);
                                    }
                                  }}
                                  className={`text-[10px] px-1.5 py-0.5 rounded border ${getStatusColor(order.status)} hover:brightness-95 transition cursor-pointer flex items-center gap-1`}
                                >
                                  {getStatusLabel(order.status)}
                                  <ChevronDown size={10} className="opacity-70" />
                                </button>

                                {statusMenuOpenId === `summary-${order.id}` && statusMenuPosition && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setStatusMenuOpenId(null)} />
                                    <div
                                      className="fixed z-50 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden min-w-[160px]"
                                      style={{ top: statusMenuPosition.top, left: statusMenuPosition.left }}
                                    >
                                      {['pending', 'in_progress', 'done', 'delivered', 'cancelled'].map((status) => (
                                        <button
                                          key={status}
                                          onClick={() => handleStatusUpdate(order.id, status as any)}
                                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 flex items-center gap-2 transition border-l-4 ${order.status === status ? 'bg-stone-50 font-medium text-rose-600 border-rose-500' : 'text-stone-600 border-transparent'}`}
                                        >
                                          <div className={`w-2 h-2 rounded-full ${getStatusColor(status).split(' ')[0]}`} />
                                          {getStatusLabel(status)}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-stone-500 truncate flex items-center gap-1">
                              <User size={10} />
                              {order.clientName}
                            </p>
                          </div>
                        </div>

                        <div className="flex-1 px-4 hidden md:block min-w-0">
                          {order.notes && (
                            <p className="text-xs text-red-600 whitespace-normal break-words leading-tight text-right">
                              {order.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0 pl-2">
                          {daysInfo && (
                            <div className="text-right">
                              <span className={`block text-xs ${daysInfo.color} font-medium`}>
                                {daysInfo.text}
                              </span>
                              <span className="text-[10px] text-stone-400">
                                {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                          <ChevronRight size={16} className="text-stone-300 group-hover:text-stone-500 transition" />
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            )}
          </section>
        )}
        {/* Open Orders */}

        {/* Open Orders */}
        <section>
          <button
            onClick={() => setIsOpenOrdersListOpen(!isOpenOrdersListOpen)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-100 text-blue-900 hover:bg-blue-200 transition shadow-sm mb-4"
          >
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              Em Aberto
              <span className="text-sm font-normal opacity-70">({openOrders.length})</span>
            </div>
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${isOpenOrdersListOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isOpenOrdersListOpen && (
            <OrderTable orders={openOrders} emptyMessage="Nenhuma encomenda em aberto." />
          )}
        </section>

        {/* Done Orders */}
        <section>
          <button
            onClick={() => setIsDoneOrdersOpen(!isDoneOrdersOpen)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-green-100 text-green-900 hover:bg-green-200 transition shadow-sm mb-4"
          >
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="w-2 h-2 rounded-full bg-green-600" />
              Concluídos
              <span className="text-sm font-normal opacity-70">({doneOrders.length})</span>
            </div>
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${isDoneOrdersOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isDoneOrdersOpen && (
            <OrderTable orders={doneOrders} emptyMessage="Nenhuma encomenda concluída." />
          )}
        </section>

        {/* Delivered Orders */}
        <section>
          <button
            onClick={() => setIsDeliveredOrdersOpen(!isDeliveredOrdersOpen)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-purple-100 text-purple-900 hover:bg-purple-200 transition shadow-sm mb-4"
          >
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="w-2 h-2 rounded-full bg-purple-600" />
              Entregues
              <span className="text-sm font-normal opacity-70">({deliveredOrders.length})</span>
            </div>
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${isDeliveredOrdersOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isDeliveredOrdersOpen && (
            <OrderTable orders={deliveredOrders} emptyMessage="Nenhuma encomenda entregue." />
          )}
        </section>

        {/* Cancelled Orders */}
        {cancelledOrders.length > 0 && (
          <section>
            <button
              onClick={() => setIsCancelledOrdersOpen(!isCancelledOrdersOpen)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-red-100 text-red-900 hover:bg-red-200 transition shadow-sm mb-4"
            >
              <div className="flex items-center gap-2 font-bold text-lg">
                <div className="w-2 h-2 rounded-full bg-red-600" />
                Cancelados
                <span className="text-sm font-normal opacity-70">({cancelledOrders.length})</span>
              </div>
              <ChevronDown
                size={20}
                className={`transition-transform duration-300 ${isCancelledOrdersOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isCancelledOrdersOpen && (
              <OrderTable orders={cancelledOrders} emptyMessage="Nenhuma encomenda cancelada." />
            )}
          </section>
        )}
      </div>

      {/* New/Edit Order Modal */}
      {
        isModalOpen && !isProductModalOpen && !isClientModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-4">
                <h3 className="text-lg font-bold mb-3">{editingOrderId ? 'Editar Encomenda' : 'Nova Encomenda'}</h3>
                <form onSubmit={handleSubmit} className="space-y-3">

                  {/* Client Selection */}
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Cliente</label>
                    <select
                      required
                      className="w-full border rounded-lg p-1.5 text-sm bg-white"
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
                      className="mt-1 text-xs text-rose-600 font-medium hover:text-rose-700 flex items-center gap-1"
                    >
                      <UserPlus size={12} /> Cadastrar novo cliente
                    </button>
                  </div>

                  {/* Product Selection */}
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Produto do Catálogo</label>
                    <select
                      required
                      className="w-full border rounded-lg p-1.5 text-sm bg-white"
                      value={formData.productId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const prod = products.find(p => p.id === pid);
                        setFormData(prev => ({
                          ...prev,
                          productId: pid,
                          finalPrice: prod ? (prod.basePrice * prev.quantity).toString() : prev.finalPrice
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
                      className="mt-1 text-xs text-rose-600 font-medium hover:text-rose-700 flex items-center gap-1"
                    >
                      <Plus size={12} /> Cadastrar novo produto
                    </button>
                  </div>


                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Quantidade</label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="w-full border rounded-lg p-1.5 text-sm"
                      value={formData.quantity}
                      onChange={e => {
                        const newQuantity = parseInt(e.target.value) || 1;
                        setFormData(prev => {
                          const product = products.find(p => p.id === prev.productId);
                          return {
                            ...prev,
                            quantity: newQuantity,
                            finalPrice: product ? (product.basePrice * newQuantity).toString() : prev.finalPrice
                          };
                        });
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">Data do Pedido</label>
                      <input
                        required
                        type="date"
                        className="w-full border rounded-lg p-1.5 text-sm"
                        value={formData.orderDate}
                        onChange={e => setFormData({ ...formData, orderDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">Data Entrega</label>
                      <input required type="date" className="w-full border rounded-lg p-1.5 text-sm" value={formData.deliveryDate} onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Valor Final</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-medium text-sm">R$</span>
                      <input
                        required
                        type="number"
                        step="0.01"
                        className="w-full border rounded-lg p-1.5 pl-9 text-sm"
                        value={formData.finalPrice}
                        onChange={e => setFormData({ ...formData, finalPrice: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Valor do Sinal (Opcional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-medium text-sm">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full border rounded-lg p-1.5 pl-9 text-sm"
                        value={formData.depositValue}
                        onChange={e => setFormData({ ...formData, depositValue: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Observação</label>
                    <textarea
                      rows={1}
                      placeholder="Detalhes adicionais do pedido..."
                      className="w-full border rounded-lg p-1.5 text-sm"
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Forma de Encomenda / Canal</label>
                    <input
                      placeholder="Ex: Instagram, Elo7, Whatsapp..."
                      className="w-full border rounded-lg p-1.5 text-sm"
                      value={formData.orderSource}
                      onChange={e => setFormData({ ...formData, orderSource: e.target.value })}
                    />
                  </div>



                  <div className="flex gap-3 pt-3 mt-2">
                    <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 py-1.5 text-sm border rounded-lg hover:bg-stone-50">Cancelar</button>
                    <button type="submit" className="flex-1 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700">{editingOrderId ? 'Salvar Alterações' : 'Criar Pedido'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div >
        )
      }

      {/* Quick Product Modal */}
      {
        isProductModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Novo Produto (Rápido)</h3>

                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6">
                      <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
                      <input required className="w-full border rounded-lg p-2" value={newProductData.name} onChange={e => setNewProductData({ ...newProductData, name: e.target.value })} />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-stone-700 mb-1">Categoria</label>
                      <input
                        className="w-full border rounded-lg p-2"
                        value={newProductData.category}
                        onChange={e => setNewProductData({ ...newProductData, category: e.target.value })}
                        placeholder="ex: Amigurumi"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-stone-700 mb-1">Preço Base</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-medium">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full border rounded-lg p-2 pl-10"
                          value={newProductData.basePrice}
                          onChange={e => setNewProductData({ ...newProductData, basePrice: parseFloat(e.target.value) })}
                        />
                      </div>
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
                    <label className="block text-sm font-medium text-stone-700 mb-1">Foto do Produto</label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          className="w-full border rounded-lg p-2 flex-1"
                          value={newProductData.photoUrl}
                          onChange={e => setNewProductData({ ...newProductData, photoUrl: e.target.value })}
                          placeholder="https://..."
                        />
                        <div className="w-10 h-10 bg-stone-100 rounded border flex items-center justify-center overflow-hidden shrink-0">
                          {newProductData.photoUrl ? (
                            <img src={newProductData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={16} className="text-stone-400" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const btn = document.getElementById('quick-upload-btn-text');
                            if (btn) btn.innerText = 'Enviando...';

                            try {
                              const url = await uploadToImgBB(file);
                              setNewProductData(prev => ({ ...prev, photoUrl: url }));
                            } catch (error) {
                              console.error("Error uploading image:", error);
                              alert("Erro ao fazer upload da imagem.");
                            } finally {
                              if (btn) btn.innerText = 'Fazer Upload';
                              // Reset input
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                          id="quick-image-upload"
                        />
                        <label
                          htmlFor="quick-image-upload"
                          className="flex items-center gap-2 px-3 py-2 bg-stone-100 text-stone-600 rounded-lg cursor-pointer hover:bg-stone-200 transition text-sm"
                        >
                          <ImageIcon size={16} />
                          <span id="quick-upload-btn-text">Fazer Upload</span>
                        </label>
                        <span className="text-xs text-stone-400">ou cole o link acima</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Links de Venda</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="Link Shopee"
                        value={newProductData.shopeeLink}
                        onChange={e => setNewProductData({ ...newProductData, shopeeLink: e.target.value })}
                      />
                      <input
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="Link Elo7"
                        value={newProductData.elo7Link}
                        onChange={e => setNewProductData({ ...newProductData, elo7Link: e.target.value })}
                      />
                      <input
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="Link Nuvemshop"
                        value={newProductData.nuvemshopLink}
                        onChange={e => setNewProductData({ ...newProductData, nuvemshopLink: e.target.value })}
                      />
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
        )
      }

      {/* New Client Modal (Quick) */}
      {
        isClientModalOpen && (
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
        )
      }

      {/* View Order Details Modal */}
      {
        viewingOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingOrder(null)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setViewingOrder(null)}
                className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition z-10"
              >
                <X size={20} className="text-stone-600" />
              </button>

              <div className="p-0">
                {/* Header Image (Product Photo) */}
                <div className="w-full bg-stone-100 relative">
                  {getProductDetails(viewingOrder.productId) ? (
                    <img
                      src={getProductDetails(viewingOrder.productId)?.photoUrl}
                      alt={getProductDetails(viewingOrder.productId)?.name}
                      className="w-full h-auto max-h-[50vh] object-contain mx-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/400/300';
                      }}
                    />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center bg-stone-200 text-stone-400">
                      <ImageIcon size={48} />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-16">
                    <h2 className="text-xl font-bold text-white shadow-sm">
                      {getProductDetails(viewingOrder.productId)?.name || 'Produto Desconhecido'}
                      {viewingOrder.quantity > 1 && <span className="ml-2 text-rose-200">({viewingOrder.quantity} unidades)</span>}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(viewingOrder.status)}`}>
                        {getStatusLabel(viewingOrder.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Order Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Left Column: Client & Dates */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <User size={16} /> Cliente
                        </h3>
                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                          <p className="font-bold text-base text-stone-800">{viewingOrder.clientName}</p>
                          {viewingOrder.whatsapp && (
                            <a
                              href={`https://wa.me/55${viewingOrder.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-stone-600 flex items-center gap-2 mt-1 hover:text-green-600 hover:underline transition w-fit"
                            >
                              <Phone size={14} className="text-green-600" />
                              {viewingOrder.whatsapp}
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Calendar size={16} /> Datas
                        </h3>
                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-stone-500 whitespace-nowrap">Data do Pedido:</span>
                            <span className="font-medium text-stone-800 whitespace-nowrap">{formatDate(viewingOrder.orderDate)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-stone-500 whitespace-nowrap">Data de Entrega:</span>
                            <span className="font-medium text-stone-800 whitespace-nowrap">{formatDate(viewingOrder.deliveryDate)}</span>
                          </div>
                          {['pending', 'in_progress'].includes(viewingOrder.status) && (
                            <div className="pt-2 border-t border-stone-200 mt-2">
                              <div className={`text-center font-bold ${getDaysRemaining(viewingOrder.deliveryDate)?.color}`}>
                                {getDaysRemaining(viewingOrder.deliveryDate)?.text}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Financials & Source */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Package size={16} /> Detalhes Financeiros
                        </h3>
                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                          <div className="flex flex-col gap-1">
                            <span className="text-stone-500 text-sm">Valor Final Acordado</span>
                            <span className="text-xl font-bold text-rose-600">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewingOrder.finalPrice)}
                            </span>
                          </div>
                          {viewingOrder.orderSource && (
                            <div className="mt-4 pt-4 border-t border-stone-200">
                              <span className="text-stone-500 text-sm block mb-1">Canal de Venda</span>
                              <span className="font-medium text-stone-800 bg-white px-2 py-1 rounded border border-stone-200 inline-block">
                                {viewingOrder.orderSource}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {viewingOrder.notes && (
                        <div>
                          <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FileText size={16} /> Observações
                          </h3>
                          <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 text-stone-700 whitespace-pre-wrap">
                            {viewingOrder.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Notes (if any) */}
                  {viewingOrder.progressNotes && (
                    <div>
                      <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <MessageSquare size={16} /> Anotações de Progresso
                      </h3>
                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-stone-700 italic">
                        "{viewingOrder.progressNotes}"
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>

        )
      }

      {/* PDF Filter Modal */}
      {isPdfFilterModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Filtrar Relatório PDF</h3>
              <p className="text-stone-500 text-sm mb-4">Selecione quais status deseja incluir no relatório:</p>

              <div className="space-y-3 mb-6">
                {['pending', 'in_progress', 'done', 'delivered', 'cancelled'].map(status => (
                  <label key={status} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-100 transition">
                    <input
                      type="checkbox"
                      checked={pdfSelectedStatuses.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPdfSelectedStatuses(prev => [...prev, status]);
                        } else {
                          setPdfSelectedStatuses(prev => prev.filter(s => s !== status));
                        }
                      }}
                      className="w-5 h-5 text-rose-600 rounded focus:ring-rose-500 border-stone-300"
                    />
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(status).split(' ')[0]}`} />
                      <span className="text-sm font-medium text-stone-700">{getStatusLabel(status)}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsPdfFilterModalOpen(false)}
                  className="flex-1 px-4 py-2 text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGeneratePDF}
                  className="flex-1 px-4 py-2 bg-stone-800 text-white hover:bg-stone-900 rounded-lg transition font-medium"
                >
                  Gerar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

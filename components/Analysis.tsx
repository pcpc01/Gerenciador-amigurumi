import React, { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp,
    Package,
    CheckCircle,
    Clock,
    DollarSign,
    Calendar,
    Award,
    User,
    AlertCircle,
    Wallet
} from 'lucide-react';
import { Order, Product, Client } from '../types';
import { getOrders, getProducts, getClients } from '../services/storage_supabase';

type TimeRange = 15 | 30 | 180 | 365 | 'max';

export const Analysis: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<TimeRange>('max');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ordersData, productsData, clientsData] = await Promise.all([
                    getOrders(),
                    getProducts(),
                    getClients()
                ]);
                setOrders(ordersData);
                setProducts(productsData);
                setClients(clientsData);
            } catch (error) {
                console.error('Error fetching analysis data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredOrders = useMemo(() => {
        if (timeRange === 'max') {
            return orders;
        }

        const now = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(now.getDate() - timeRange);

        return orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= cutoffDate;
        });
    }, [orders, timeRange]);

    const metrics = useMemo(() => {
        const totalPurchased = filteredOrders.length;
        const totalDelivered = filteredOrders.filter(o => o.status === 'delivered').length;
        const totalInProduction = filteredOrders.filter(o => ['pending', 'in_progress'].includes(o.status)).length;
        const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.finalPrice || 0), 0);

        const revenueReceived = filteredOrders.reduce((acc, o) => {
            if (o.paymentStatus === 'paid') {
                return acc + (o.finalPrice || 0);
            } else if (o.paymentStatus === 'deposit') {
                return acc + (o.depositValue || 0);
            }
            return acc;
        }, 0);

        const revenuePending = filteredOrders.reduce((acc, o) => {
            if (o.paymentStatus === 'pending') {
                return acc + (o.finalPrice || 0);
            } else if (o.paymentStatus === 'deposit') {
                return acc + ((o.finalPrice || 0) - (o.depositValue || 0));
            }
            return acc;
        }, 0);

        return {
            totalPurchased,
            totalDelivered,
            totalInProduction,
            totalRevenue,
            revenueReceived,
            revenuePending
        };
    }, [filteredOrders]);

    const topProducts = useMemo(() => {
        const productCounts: Record<string, number> = {};
        filteredOrders.forEach(order => {
            if (order.productId) {
                productCounts[order.productId] = (productCounts[order.productId] || 0) + (order.quantity || 1);
            }
        });

        return Object.entries(productCounts)
            .map(([id, count]) => {
                const product = products.find(p => p.id === id);
                return {
                    id,
                    name: product?.name || 'Produto Desconhecido',
                    count,
                    image: product?.photoUrl
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [filteredOrders, products]);

    const topClients = useMemo(() => {
        const clientCounts: Record<string, { count: number; revenue: number; name: string }> = {};

        filteredOrders.forEach(order => {
            // Use clientId if available, otherwise fallback to whatsapp or name as key
            const key = order.clientId || order.whatsapp || order.clientName;

            if (!clientCounts[key]) {
                clientCounts[key] = {
                    count: 0,
                    revenue: 0,
                    name: order.clientName || 'Cliente Desconhecido'
                };
            }

            clientCounts[key].count += 1;
            clientCounts[key].revenue += (order.finalPrice || 0);
        });

        return Object.values(clientCounts)
            .sort((a, b) => b.revenue - a.revenue) // Sort by revenue (descending)
            .slice(0, 5);
    }, [filteredOrders]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 md:space-y-8 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Análise de Vendas</h1>
                    <p className="text-stone-500 mt-1 text-sm md:text-base">Visão geral do desempenho do seu negócio</p>
                </div>

                <div className="w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <div className="flex bg-white p-1 rounded-lg shadow-sm border border-stone-200 min-w-max">
                        {(['max', 365, 180, 30, 15] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range as TimeRange)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${timeRange === range
                                    ? 'bg-rose-100 text-rose-700 shadow-sm'
                                    : 'text-stone-600 hover:bg-stone-50'
                                    }`}
                            >
                                {range === 'max' ? 'Máximo' : `${range} dias`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Recebido */}
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between group hover:shadow-md transition-all">
                    <div>
                        <p className="text-stone-500 text-sm font-medium">Recebido (Pagos + Sinal)</p>
                        <h3 className="text-2xl font-bold text-stone-800 mt-1">{formatCurrency(metrics.revenueReceived)}</h3>
                    </div>
                    <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <Wallet size={24} />
                    </div>
                </div>

                {/* Pendente */}
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between group hover:shadow-md transition-all">
                    <div>
                        <p className="text-stone-500 text-sm font-medium">Pendente</p>
                        <h3 className="text-2xl font-bold text-stone-800 mt-1">{formatCurrency(metrics.revenuePending)}</h3>
                    </div>
                    <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                        <AlertCircle size={24} />
                    </div>
                </div>

                {/* Total Geral */}
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between group hover:shadow-md transition-all">
                    <div>
                        <p className="text-stone-500 text-sm font-medium">Total Geral</p>
                        <h3 className="text-2xl font-bold text-stone-800 mt-1">{formatCurrency(metrics.totalRevenue)}</h3>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        <TrendingUp size={24} />
                    </div>
                </div>

                {/* Pedidos Realizados */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between group hover:shadow-md transition-all">
                    <div>
                        <p className="text-stone-500 text-sm font-medium">Pedidos Realizados</p>
                        <h3 className="text-2xl font-bold text-stone-800 mt-1">{metrics.totalPurchased}</h3>
                    </div>
                    <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <Package size={24} />
                    </div>
                </div>

                {/* Em Produção */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between group hover:shadow-md transition-all">
                    <div>
                        <p className="text-stone-500 text-sm font-medium">Em Produção</p>
                        <h3 className="text-2xl font-bold text-stone-800 mt-1">{metrics.totalInProduction}</h3>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                        <Clock size={24} />
                    </div>
                </div>

                {/* Entregues */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between group hover:shadow-md transition-all">
                    <div>
                        <p className="text-stone-500 text-sm font-medium">Entregues</p>
                        <h3 className="text-2xl font-bold text-stone-800 mt-1">{metrics.totalDelivered}</h3>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                        <CheckCircle size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Products */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
                            <Award className="text-rose-500" size={20} />
                            Bonecos Mais Vendidos
                        </h3>
                    </div>
                    <div className="p-6">
                        {topProducts.length > 0 ? (
                            <div className="space-y-6">
                                {topProducts.map((product, index) => (
                                    <div key={product.id} className="flex items-center gap-4">
                                        <div className="flex-shrink-0 relative">
                                            <div className="h-12 w-12 rounded-lg bg-stone-100 overflow-hidden">
                                                {product.image ? (
                                                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-stone-400">
                                                        <Package size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute -top-2 -left-2 h-6 w-6 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                                                {index + 1}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-stone-900 truncate">{product.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-rose-500 rounded-full"
                                                        style={{ width: `${(product.count / topProducts[0].count) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-stone-500 font-medium">{product.count} un.</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-stone-400">
                                Nenhum dado disponível para este período
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Clients */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
                            <User className="text-blue-500" size={20} />
                            Top Clientes
                        </h3>
                    </div>
                    <div className="p-6">
                        {topClients.length > 0 ? (
                            <div className="space-y-6">
                                {topClients.map((client, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-sm font-medium text-stone-900 truncate">{client.name}</p>
                                                <p className="text-sm font-bold text-stone-700">{formatCurrency(client.revenue)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${(client.revenue / topClients[0].revenue) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-stone-500">{client.count} pedidos</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-stone-400">
                                Nenhum dado disponível para este período
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

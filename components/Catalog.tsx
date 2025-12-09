import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, Image as ImageIcon, Package, ArrowUpDown, X, ExternalLink, Eye, EyeOff, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, Category } from '../types';
import * as storage from '../services/storage_supabase';
import { uploadToCloudinary } from '../services/cloudinary';

import ReactMarkdown from 'react-markdown';

const ExpandableText = ({
  text,
  maxLength = 150,
  className = "text-stone-600 leading-relaxed",
  buttonClassName = "text-rose-600 text-sm font-medium mt-2 hover:underline focus:outline-none"
}: {
  text: string,
  maxLength?: number,
  className?: string,
  buttonClassName?: string
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Função simples para converter HTML para Markdown
  const convertHtmlToMarkdown = (html: string) => {
    let markdown = html
      // Remove quebras de linha do código fonte HTML para evitar formatação quebrada
      .replace(/[\r\n]+/g, ' ')
      .trim()
      // Listas
      .replace(/<ul[^>]*>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<li[^>]*>\s*/gi, '\n- ') // Quebra linha antes do item e adiciona marcador
      .replace(/<\/li>/gi, '') // Remove fechamento de li
      // Parágrafos e quebras
      .replace(/<p[^>]*>/gi, '\n\n')
      .replace(/<\/p>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      // Formatação básica
      .replace(/<strong[^>]*>/gi, '**')
      .replace(/<\/strong>/gi, '**')
      .replace(/<b[^>]*>/gi, '**')
      .replace(/<\/b>/gi, '**')
      .replace(/<em[^>]*>/gi, '*')
      .replace(/<\/em>/gi, '*')
      .replace(/<i[^>]*>/gi, '*')
      .replace(/<\/i>/gi, '*')
      // Entidades HTML comuns
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    // Remove tags restantes
    markdown = markdown.replace(/<[^>]*>/g, '');

    // Limpa múltiplas quebras de linha consecutivas (max 2) e espaços extras
    return markdown.replace(/\n\s+\n/g, '\n\n').replace(/\n{3,}/g, '\n\n').trim();
  };

  const isHtml = /<[a-z][\s\S]*>/i.test(text);
  const cleanText = isHtml ? convertHtmlToMarkdown(text) : text;

  // Se o texto for curto, exibe tudo renderizado como Markdown
  if (cleanText.length <= maxLength) {
    return (
      <div className={`markdown-content ${className}`}>
        <ReactMarkdown>{cleanText}</ReactMarkdown>
      </div>
    );
  }

  // Se for longo, controla a exibição
  const contentToShow = isExpanded ? cleanText : `${cleanText.slice(0, maxLength)}...`;

  return (
    <div>
      <div className={`markdown-content ${className}`}>
        <ReactMarkdown>{contentToShow}</ReactMarkdown>
      </div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={buttonClassName}
      >
        {isExpanded ? 'Ver menos' : 'Ver mais'}
      </button>
    </div>
  );
};

export const Catalog: React.FC = () => {
  // Helper para gerar UUID compatível com todos os navegadores
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name_asc');
  const [filterCategory, setFilterCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [activeProductImage, setActiveProductImage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    categoryId: '',
    category: '',
    basePrice: 0,
    photoUrl: '',
    additionalImages: [],
    description: '',
    recipeText: '',
    pdfLink: '',
    weight: '',
    height: '',
    width: '',
    length: '',
    shopeeLink: '',
    elo7Link: '',

    nuvemshopLink: '',
    showInCatalog: true
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (viewingProduct) {
      setActiveProductImage(viewingProduct.photoUrl);
    }
  }, [viewingProduct]);

  const loadData = async () => {
    const [prods, cats] = await Promise.all([
      storage.getProducts(),
      storage.getCategories()
    ]);
    setProducts(prods);
    setAvailableCategories(cats);
  };

  const loadProducts = async () => {
    setProducts(await storage.getProducts());
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        basePrice: 0,
        photoUrl: '',
        additionalImages: [],
        description: '',
        recipeText: '',
        pdfLink: '',
        weight: '',
        height: '',
        width: '',
        length: '',
        shopeeLink: '',
        elo7Link: '',

        nuvemshopLink: '',
        showInCatalog: true
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      await storage.deleteProduct(id);
      loadProducts();
    }
  };

  const handleAddCategory = async () => {
    const newCategoryName = prompt("Nome da nova categoria:");
    if (newCategoryName && newCategoryName.trim()) {
      const trimmed = newCategoryName.trim();

      // Check if already exists
      if (availableCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
        alert('Categoria já existe!');
        return;
      }

      const newCategory: Category = {
        id: generateUUID(),
        name: trimmed
      };

      try {
        await storage.saveCategory(newCategory);
        setAvailableCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
        setFormData(prev => ({ ...prev, categoryId: newCategory.id, category: newCategory.name }));
      } catch (error) {
        console.error('Error saving category:', error);
        alert('Erro ao salvar categoria.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : generateUUID(),
      name: formData.name || 'Sem nome',
      categoryId: formData.categoryId,
      category: formData.category || '',
      basePrice: Number(formData.basePrice) || 0,
      photoUrl: formData.photoUrl || 'https://picsum.photos/200',
      additionalImages: (formData.additionalImages || []).filter(Boolean),
      description: formData.description || '',
      recipeText: formData.recipeText || '',
      pdfLink: formData.pdfLink || '',
      weight: formData.weight || '',
      height: formData.height || '',
      width: formData.width || '',
      length: formData.length || '',
      shopeeLink: formData.shopeeLink || '',
      elo7Link: formData.elo7Link || '',
      nuvemshopLink: formData.nuvemshopLink || '',
      showInCatalog: formData.showInCatalog !== false,
      createdAt: editingProduct?.createdAt || Date.now()
    };

    await storage.saveProduct(productToSave);
    setIsModalOpen(false);
    loadProducts();
  };

  const handleToggleVisibility = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    try {
      const updatedProduct = { ...product, showInCatalog: !product.showInCatalog };
      // Optimistic updatish - just save and reload
      await storage.saveProduct(updatedProduct);

      // Update local state immediately to feel responsive
      setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Erro ao atualizar visibilidade.');
    }
  };

  const filteredAndSortedProducts = products
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => filterCategory ? p.categoryId === filterCategory : true)
    .sort((a, b) => {
      switch (sortOption) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'date_new':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'date_old':
          return (a.createdAt || 0) - (b.createdAt || 0);
        default:
          return 0;
      }
    });

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(225, 29, 72); // Rose-600
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Catálogo de Peças', 14, 20);
    doc.setFontSize(12);
    doc.text('Patty Crochê', 14, 28);

    // Info
    doc.setTextColor(100);
    doc.setFontSize(10);
    const date = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${date}`, 14, 48);

    // Table Data
    const tableBody = filteredAndSortedProducts.map(product => [
      product.name,
      product.category || '-',
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.basePrice),
      product.weight ? `${product.weight}` : '-',
      product.height ? `${product.height} x ${product.width || '-'} x ${product.length || '-'}` : '-'
    ]);

    // Table
    autoTable(doc, {
      startY: 55,
      head: [['Produto', 'Categoria', 'Preço', 'Peso', 'Dimensões (AxLxC)']],
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
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'right' } // Price aligned right
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

    doc.save('catalogo-patty-croche.pdf');
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-red-100 text-red-800',
      'bg-orange-100 text-orange-800',
      'bg-amber-100 text-amber-800',
      'bg-yellow-100 text-yellow-800',
      'bg-lime-100 text-lime-800',
      'bg-green-100 text-green-800',
      'bg-emerald-100 text-emerald-800',
      'bg-teal-100 text-teal-800',
      'bg-cyan-100 text-cyan-800',
      'bg-sky-100 text-sky-800',
      'bg-blue-100 text-blue-800',
      'bg-indigo-100 text-indigo-800',
      'bg-violet-100 text-violet-800',
      'bg-purple-100 text-purple-800',
      'bg-fuchsia-100 text-fuchsia-800',
      'bg-pink-100 text-pink-800',
      'bg-rose-100 text-rose-800',
    ];

    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Taxas padrão (Hardcoded para consistência com a Calculadora)
  const fees = {
    nuvemshop: { percent: 4.99, fixed: 0.35 },
    shopee: { percent: 20, fixed: 4.00 },
    elo7: { percent: 20, fixed: 6.00 }, // 20% + 6.00 subsidy
  };

  const getElo7ServiceFee = (grossPrice: number) => {
    if (grossPrice <= 29.89) return 1.99;
    if (grossPrice <= 79.89) return 2.49;
    if (grossPrice <= 149.89) return 2.99;
    if (grossPrice <= 299.89) return 4.99;
    return 5.99;
  };

  const calculateStorePrice = (basePrice: number, store: 'shopee' | 'elo7' | 'nuvemshop') => {
    if (!basePrice || basePrice <= 0) return 0;
    const val = basePrice;

    if (store === 'nuvemshop') {
      return (val + fees.nuvemshop.fixed) / (1 - fees.nuvemshop.percent / 100);
    }

    if (store === 'shopee') {
      const shopeeGrossNoCap = (val + fees.shopee.fixed) / (1 - fees.shopee.percent / 100);
      const shopeeCommission = shopeeGrossNoCap * (fees.shopee.percent / 100);
      if (shopeeCommission > 105) {
        return val + 105 + fees.shopee.fixed;
      } else {
        return shopeeGrossNoCap;
      }
    }

    if (store === 'elo7') {
      // Elo7 Dynamic Calculation (Reverse)
      const brackets = [1.99, 2.49, 2.99, 4.99, 5.99];
      let foundElo7 = 0;

      for (const fee of brackets) {
        const candidateGross = (val + fees.elo7.fixed + fee) / (1 - fees.elo7.percent / 100);
        if (getElo7ServiceFee(candidateGross) === fee) {
          foundElo7 = candidateGross;
          break;
        }
      }
      if (foundElo7 === 0) {
        // Recalculate using the fee for the raw estimate, in case of gaps
        const rawEstimate = (val + fees.elo7.fixed) / (1 - fees.elo7.percent / 100);
        const estimatedFee = getElo7ServiceFee(rawEstimate);
        foundElo7 = (val + fees.elo7.fixed + estimatedFee) / (1 - fees.elo7.percent / 100);
      }
      return foundElo7;
    }

    return 0;
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Catálogo de Peças</h2>
          <p className="text-stone-500 text-sm">Gerencie suas receitas e produtos base</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="bg-stone-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-stone-900 transition shadow-sm"
            title="Baixar Catálogo em PDF"
          >
            <Download size={18} />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-700 transition shadow-sm"
          >
            <Plus size={18} />
            Novo Produto
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
          />
          <Search className="absolute left-3 top-2 text-stone-400" size={18} />
        </div>

        <div className="relative min-w-[180px]">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none w-full bg-white border border-stone-300 text-stone-700 py-1.5 pl-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm cursor-pointer"
          >
            <option value="">Todas Categorias</option>
            {availableCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
          </div>
        </div>

        <div className="relative min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
            <ArrowUpDown size={16} />
          </div>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="appearance-none w-full bg-white border border-stone-300 text-stone-700 py-1.5 pl-9 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm cursor-pointer"
          >
            <option value="name_asc">Nome (A-Z)</option>
            <option value="name_desc">Nome (Z-A)</option>
            <option value="date_new">Mais Recentes</option>
            <option value="date_old">Mais Antigos</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider border-b border-stone-200">
                <th className="px-4 py-2 font-semibold w-[25%]">Produto</th>
                <th className="px-4 py-2 font-semibold w-[8%] text-center">Visível</th>
                <th className="px-4 py-2 font-semibold w-[12%]">Dimensões</th>
                <th className="px-4 py-2 font-semibold w-[8%]">Preço</th>
                <th className="px-4 py-2 font-semibold w-[37%]">Lojas</th>
                <th className="px-4 py-2 font-semibold w-[5%]">Receita</th>
                <th className="px-4 py-2 font-semibold text-right w-[5%]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredAndSortedProducts.map(product => (
                <tr
                  key={product.id}
                  onClick={() => setViewingProduct(product)}
                  className="hover:bg-stone-50 transition cursor-pointer group"
                >
                  <td className="px-4 py-2 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-stone-100 rounded-lg overflow-hidden shrink-0 border border-stone-200">
                        <img
                          src={product.photoUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://picsum.photos/200';
                          }}
                        />
                      </div>
                      <div className="flex flex-col justify-center items-start">
                        {product.category && (
                          <span className={`text-[10px] font-bold uppercase tracking-wider leading-none mb-1.5 px-1.5 py-0.5 rounded-md ${getCategoryColor(product.category)}`}>
                            {product.category}
                          </span>
                        )}
                        <div className="font-bold text-stone-800 text-sm leading-none">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 align-middle text-center">
                    <button
                      onClick={(e) => handleToggleVisibility(e, product)}
                      className={`p-1.5 rounded-lg transition ${product.showInCatalog !== false ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-stone-400 bg-stone-100 hover:bg-stone-200'}`}
                      title={product.showInCatalog !== false ? "Visível no Catálogo" : "Oculto no Catálogo"}
                    >
                      {product.showInCatalog !== false ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <div className="flex flex-col gap-0.5 text-xs text-stone-500">
                      {product.weight && <span className="flex items-center gap-1"><Package size={10} /> {product.weight}</span>}
                      {(product.height || product.width || product.length) && (
                        <span>{product.height || '-'} x {product.width || '-'} x {product.length || '-'}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <span className="text-xs font-bold text-stone-800">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.basePrice)}
                    </span>
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <div className="flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                      {product.shopeeLink && (
                        <div className="flex flex-col items-center gap-1">
                          <a
                            href={product.shopeeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 transition"
                          >
                            Shopee
                          </a>
                          <span className="text-[10px] text-orange-600 font-medium">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateStorePrice(product.basePrice, 'shopee'))}
                          </span>
                        </div>
                      )}
                      {product.elo7Link && (
                        <div className="flex flex-col items-center gap-1">
                          <a
                            href={product.elo7Link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-50 text-yellow-600 border border-yellow-100 hover:bg-yellow-100 transition"
                          >
                            Elo7
                          </a>
                          <span className="text-[10px] text-yellow-600 font-medium">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateStorePrice(product.basePrice, 'elo7'))}
                          </span>
                        </div>
                      )}
                      {product.nuvemshopLink && (
                        <div className="flex flex-col items-center gap-1">
                          <a
                            href={product.nuvemshopLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition"
                          >
                            Nuvem
                          </a>
                          <span className="text-[10px] text-indigo-600 font-medium">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateStorePrice(product.basePrice, 'nuvemshop'))}
                          </span>
                        </div>
                      )}
                      {!product.shopeeLink && !product.elo7Link && !product.nuvemshopLink && (
                        <span className="text-xs text-stone-300">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 align-middle">
                    {product.pdfLink ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                        <FileText size={10} /> PDF
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2 align-middle text-right">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {
          filteredAndSortedProducts.length === 0 && (
            <div className="text-center py-12 text-stone-400">
              <p>Nenhum produto encontrado.</p>
            </div>
          )
        }
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredAndSortedProducts.map(product => (
          <div
            key={product.id}
            onClick={() => setViewingProduct(product)}
            className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 active:bg-stone-50 transition-colors"
          >
            <div className="flex gap-3 mb-3">
              <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden shrink-0 border border-stone-200">
                <img
                  src={product.photoUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://picsum.photos/200';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-stone-800 truncate pr-2">{product.name}</h4>
                  <span className="font-bold text-stone-700 text-sm whitespace-nowrap">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.basePrice)}
                  </span>
                </div>

                {product.category && (
                  <span className="inline-block text-xs font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200 mt-1">
                    {product.category}
                  </span>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {product.weight && (
                    <span className="text-[10px] text-stone-500 flex items-center gap-1">
                      <Package size={10} /> {product.weight}
                    </span>
                  )}
                  {product.pdfLink && (
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                      <FileText size={10} /> PDF
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3" onClick={e => e.stopPropagation()}>
                  {product.shopeeLink && (
                    <div className="flex flex-col items-center gap-1">
                      <a href={product.shopeeLink} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-100">Shopee</a>
                      <span className="text-[10px] text-orange-600 font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateStorePrice(product.basePrice, 'shopee'))}
                      </span>
                    </div>
                  )}
                  {product.elo7Link && (
                    <div className="flex flex-col items-center gap-1">
                      <a href={product.elo7Link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-600 border border-yellow-100">Elo7</a>
                      <span className="text-[10px] text-yellow-600 font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateStorePrice(product.basePrice, 'elo7'))}
                      </span>
                    </div>
                  )}
                  {product.nuvemshopLink && (
                    <div className="flex flex-col items-center gap-1">
                      <a href={product.nuvemshopLink} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">Nuvem</a>
                      <span className="text-[10px] text-indigo-600 font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateStorePrice(product.basePrice, 'nuvemshop'))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => handleOpenModal(product)}
                className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Editar"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Excluir"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-12 text-stone-400 bg-stone-50 rounded-xl border border-stone-200 border-dashed">
            <p>Nenhum produto encontrado.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {
        isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6">
                      <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
                      <input required className="w-full border rounded-lg p-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-stone-700 mb-1">Categoria</label>
                      <div className="flex gap-2">
                        <select
                          className="w-full border rounded-lg p-2 bg-white"
                          value={formData.categoryId || ''}
                          onChange={e => {
                            const selectedCat = availableCategories.find(c => c.id === e.target.value);
                            setFormData({
                              ...formData,
                              categoryId: e.target.value,
                              category: selectedCat ? selectedCat.name : ''
                            });
                          }}
                        >
                          <option value="">Selecione...</option>
                          {availableCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddCategory}
                          className="p-1.5 bg-stone-100 rounded-lg hover:bg-stone-200 text-stone-600 border border-stone-200 shrink-0"
                          title="Nova Categoria"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-stone-700 mb-1">Preço Base</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-medium">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full border rounded-lg p-2 pl-10"
                          value={formData.basePrice}
                          onChange={e => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-12 flex items-center gap-2 pt-1">
                      <div className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200 w-full cursor-pointer hover:bg-stone-100 transition" onClick={() => setFormData({ ...formData, showInCatalog: !formData.showInCatalog })}>
                        <input
                          type="checkbox"
                          checked={formData.showInCatalog !== false}
                          onChange={(e) => setFormData({ ...formData, showInCatalog: e.target.checked })}
                          className="w-5 h-5 text-rose-600 rounded focus:ring-rose-500 border-stone-300 pointer-events-none"
                        />
                        <span className="text-sm font-medium text-stone-700 flex-1">
                          Exibir no Catálogo Online
                          <span className="block text-xs text-stone-500 font-normal">Se marcado, este produto aparecerá no catálogo público para clientes.</span>
                        </span>
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
                        <input className="w-full border rounded-lg p-2 text-sm" placeholder="ex: 150g" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1">Altura</label>
                        <input className="w-full border rounded-lg p-2 text-sm" placeholder="ex: 20cm" value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1">Largura</label>
                        <input className="w-full border rounded-lg p-2 text-sm" placeholder="ex: 10cm" value={formData.width} onChange={e => setFormData({ ...formData, width: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1">Comp.</label>
                        <input className="w-full border rounded-lg p-2 text-sm" placeholder="ex: 10cm" value={formData.length} onChange={e => setFormData({ ...formData, length: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Fotos do Produto (Máx. 4)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Slot 1: Capa Principal */}
                      <div className="relative aspect-square bg-stone-100 rounded-lg border-2 border-dashed border-stone-300 flex flex-col items-center justify-center overflow-hidden group hover:border-rose-400 transition-colors">
                        {formData.photoUrl ? (
                          <>
                            <img src={formData.photoUrl} alt="Capa" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, photoUrl: '' })}
                              className="absolute top-1 right-1 bg-white p-1.5 rounded-full text-rose-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-100"
                              title="Remover Capa"
                            >
                              <X size={14} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] uppercase font-bold text-center py-1">
                              Capa
                            </div>
                          </>
                        ) : (
                          <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-stone-400 hover:text-rose-600 transition-colors gap-2">
                            <ImageIcon size={24} />
                            <span className="text-xs font-medium text-center px-2">Adicionar Capa</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  // Simplified loading indication could be added here
                                  const url = await uploadToCloudinary(file);
                                  setFormData(prev => ({ ...prev, photoUrl: url }));
                                } catch (error) {
                                  alert("Erro ao fazer upload da imagem.");
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {/* Slots Adicionais 2, 3, 4 */}
                      {[0, 1, 2].map((idx) => {
                        const imgUrl = formData.additionalImages?.[idx];
                        return (
                          <div key={idx} className="relative aspect-square bg-stone-100 rounded-lg border-2 border-dashed border-stone-300 flex flex-col items-center justify-center overflow-hidden group hover:border-rose-400 transition-colors">
                            {imgUrl ? (
                              <>
                                <img src={imgUrl} alt={`Foto Extra ${idx + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newImages = [...(formData.additionalImages || [])];
                                    newImages[idx] = ''; // Clear slot, keep index? Or splice?
                                    // Splice shifts items. That is usually better for "Gallery".
                                    newImages.splice(idx, 1);
                                    setFormData({ ...formData, additionalImages: newImages });
                                  }}
                                  className="absolute top-1 right-1 bg-white p-1.5 rounded-full text-rose-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-100"
                                  title="Remover"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-stone-400 hover:text-rose-600 transition-colors gap-2">
                                <Plus size={24} />
                                <span className="text-xs font-medium">Extra {idx + 1}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                      const url = await uploadToCloudinary(file);
                                      setFormData(prev => {
                                        const current = [...(prev.additionalImages || [])];
                                        // If we are strictly adding to "next available", we push.
                                        // But if we want to fill specific slots?
                                        // "Extra 1" is index 0. If current has 0 items, current[0] = url puts it at 0.
                                        // If current has 0 items and I click "Extra 3" (idx 2)?
                                        // Then current[2] = url, [undefined, undefined, url].
                                        // This is acceptable if we filter on save.
                                        // But visually "Extra 1" should probably be filled first?
                                        // Let's just allow random filling, it gives user control.
                                        current[idx] = url;
                                        return { ...prev, additionalImages: current };
                                      });
                                    } catch (error) {
                                      alert("Erro ao fazer upload da imagem.");
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Input manual de URL como fallback/opção extra */}
                    <div className="mt-3 flex gap-2">
                      <input
                        className="flex-1 border rounded-lg p-2 text-xs text-stone-600"
                        placeholder="Ou cole uma URL de imagem externa para a Capa..."
                        value={formData.photoUrl || ''}
                        onChange={e => setFormData({ ...formData, photoUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Links de Venda</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="Link Shopee"
                        value={formData.shopeeLink}
                        onChange={e => setFormData({ ...formData, shopeeLink: e.target.value })}
                      />
                      <input
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="Link Elo7"
                        value={formData.elo7Link}
                        onChange={e => setFormData({ ...formData, elo7Link: e.target.value })}
                      />
                      <input
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="Link Nuvemshop"
                        value={formData.nuvemshopLink}
                        onChange={e => setFormData({ ...formData, nuvemshopLink: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Descrição Curta</label>
                    <textarea rows={2} className="w-full border rounded-lg p-2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                      <FileText size={18} className="text-rose-500" />
                      Dados da Receita
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Link PDF (Drive/Dropbox)</label>
                        <input className="w-full border rounded-lg p-2" value={formData.pdfLink} onChange={e => setFormData({ ...formData, pdfLink: e.target.value })} placeholder="https://" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Receita em Texto (Copie e Cole)</label>
                        <textarea
                          rows={8}
                          className="w-full border rounded-lg p-2 font-mono text-sm"
                          value={formData.recipeText}
                          onChange={e => setFormData({ ...formData, recipeText: e.target.value })}
                          placeholder="R1: 6pb no AM (6)..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 mt-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-lg hover:bg-stone-50">Cancelar</button>
                    <button type="submit" className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">Salvar</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* View Product Details Modal */}
      {
        viewingProduct && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingProduct(null)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setViewingProduct(null)}
                className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition z-10"
              >
                <X size={20} className="text-stone-600" />
              </button>

              <div className="p-0">
                {/* Header Image & Gallery */}
                <div className="w-full bg-stone-100 relative group">
                  <div className="w-full h-auto max-h-[60vh] min-h-[300px] flex items-center justify-center bg-stone-100 overflow-hidden">
                    <img
                      src={activeProductImage || viewingProduct.photoUrl}
                      alt={viewingProduct.name}
                      className="max-w-full max-h-[60vh] object-contain shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/400/300';
                      }}
                    />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-20 pointer-events-none">
                    <div className="pointer-events-auto">
                      <h2 className="text-2xl font-bold text-white shadow-sm mb-3 drop-shadow-md">{viewingProduct.name}</h2>

                      {/* Gallery Thumbnails */}
                      {/* Gallery Thumbnails & Actions */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {/* Main Photo Thumbnail */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveProductImage(viewingProduct.photoUrl); }}
                          className={`w-14 h-14 rounded-lg border-2 overflow-hidden shrink-0 transition-all ${activeProductImage === viewingProduct.photoUrl ? 'border-rose-500 ring-2 ring-rose-500/50 scale-105' : 'border-white/30 hover:border-white'}`}
                        >
                          <img src={viewingProduct.photoUrl} className="w-full h-full object-cover" alt="Main" />
                        </button>

                        {/* Additional Images Thumbnails */}
                        {(viewingProduct.additionalImages || []).map((img, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); setActiveProductImage(img); }}
                            className={`w-14 h-14 rounded-lg border-2 overflow-hidden shrink-0 transition-all ${activeProductImage === img ? 'border-rose-500 ring-2 ring-rose-500/50 scale-105' : 'border-white/30 hover:border-white'}`}
                          >
                            <img src={img} className="w-full h-full object-cover" alt={`Extra ${idx}`} />
                          </button>
                        ))}

                        {/* Edit Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingProduct(null);
                            handleOpenModal(viewingProduct);
                          }}
                          className="bg-white/20 hover:bg-white/40 text-white w-14 h-14 rounded-lg border-2 border-white/30 hover:border-white backdrop-blur-md transition-all flex flex-col items-center justify-center gap-0.5 shrink-0"
                          title="Editar Produto"
                        >
                          <Edit2 size={18} />
                          <span className="text-[10px] font-bold">Editar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Price and Basic Info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xl font-bold text-rose-600 block">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewingProduct.basePrice)}
                      </span>
                      <p className="text-stone-500 mt-1 text-xs">Preço Base Sugerido</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {viewingProduct.pdfLink && (
                        <a
                          href={viewingProduct.pdfLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition font-medium"
                        >
                          <FileText size={18} />
                          Abrir PDF
                          <ExternalLink size={14} />
                        </a>
                      )}
                      {viewingProduct.category && (
                        <span className="inline-block text-xs font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded border border-stone-200">
                          {viewingProduct.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {/* Description */}
                  {viewingProduct.description && (
                    <div className="border border-stone-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => {
                          const el = document.getElementById('desc-content');
                          const icon = document.getElementById('desc-icon');
                          if (el && icon) {
                            el.classList.toggle('hidden');
                            icon.style.transform = el.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                          }
                        }}
                        className="w-full flex items-center justify-between p-4 bg-stone-50 hover:bg-stone-100 transition text-left"
                      >
                        <h3 className="font-semibold text-stone-800">Descrição</h3>
                        <svg
                          id="desc-icon"
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-transform duration-200"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                      <div id="desc-content" className="hidden p-4 bg-white border-t border-stone-200">
                        <ExpandableText
                          text={viewingProduct.description}
                          maxLength={999999}
                          className="text-sm text-stone-600 leading-relaxed"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dimensions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-stone-200 p-3 rounded-lg text-center">
                      <span className="block text-xs text-stone-400 uppercase font-bold mb-1">Peso</span>
                      <span className="font-medium text-stone-700">{viewingProduct.weight || '-'}</span>
                    </div>
                    <div className="bg-white border border-stone-200 p-3 rounded-lg text-center">
                      <span className="block text-xs text-stone-400 uppercase font-bold mb-1">Altura</span>
                      <span className="font-medium text-stone-700">{viewingProduct.height || '-'}</span>
                    </div>
                    <div className="bg-white border border-stone-200 p-3 rounded-lg text-center">
                      <span className="block text-xs text-stone-400 uppercase font-bold mb-1">Largura</span>
                      <span className="font-medium text-stone-700">{viewingProduct.width || '-'}</span>
                    </div>
                    <div className="bg-white border border-stone-200 p-3 rounded-lg text-center">
                      <span className="block text-xs text-stone-400 uppercase font-bold mb-1">Comprimento</span>
                      <span className="font-medium text-stone-700">{viewingProduct.length || '-'}</span>
                    </div>
                  </div>

                  {/* Recipe Text */}
                  {viewingProduct.recipeText && (
                    <div>
                      <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                        <FileText size={18} className="text-rose-500" />
                        Receita Escrita
                      </h3>
                      <div className="bg-stone-900 p-4 rounded-xl shadow-inner overflow-x-auto">
                        <ExpandableText
                          text={viewingProduct.recipeText}
                          className="text-stone-100 font-mono text-sm whitespace-pre-wrap leading-relaxed"
                          buttonClassName="text-rose-400 text-sm font-medium mt-2 hover:underline focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};
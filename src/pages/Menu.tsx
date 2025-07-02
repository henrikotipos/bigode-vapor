import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Filter,
  Check,
  User,
  Phone,
  MapPin,
  Eye,
  Star,
  Clock,
  Award,
  Package,
  Home,
  Menu as MenuIcon,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Zap,
  Target,
  Shield,
  Lock,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LuckyWheel } from '../components/ui/LuckyWheel';
import { RotatingBanner } from '../components/ui/RotatingBanner';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string;
  active: boolean;
  stock: number;
  categories?: { name: string };
}

interface CartItem extends Product {
  quantity: number;
  notes?: string;
}

// Componente de ícone de cigarro eletrônico customizado
const VapeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Corpo principal do vape */}
    <rect x="4" y="8" width="12" height="8" rx="2" ry="2" />
    
    {/* Bocal */}
    <rect x="16" y="10" width="3" height="4" rx="1" ry="1" />
    
    {/* Botão */}
    <circle cx="7" cy="12" r="1" />
    
    {/* LED indicator */}
    <circle cx="10" cy="12" r="0.5" fill="currentColor" />
    
    {/* Vapor/smoke effect */}
    <path d="M19 8c1 0 2-1 2-2s-1-2-2-2" opacity="0.6" />
    <path d="M21 6c1 0 2-1 2-2s-1-2-2-2" opacity="0.4" />
    <path d="M20 4c1 0 1-1 1-1s0-1-1-1" opacity="0.3" />
  </svg>
);

export function Menu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    street: '',
    number: '',
    neighborhood: '',
    city: 'Sorriso - MT',
    reference: '',
    paymentMethod: 'dinheiro',
  });
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrderTracking, setShowOrderTracking] = useState(false);
  const [trackingPhone, setTrackingPhone] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    fetchEstablishment();
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchEstablishment = async () => {
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('id')
        .limit(1)
        .single();

      if (error) throw error;
      setEstablishmentId(data.id);
    } catch (error: any) {
      console.error('Error fetching establishment:', error);
      toast.error('Erro ao carregar estabelecimento');
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          categories (name)
        `
        )
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar categorias');
    }
  };

  const addToCart = (product: Product) => {
    const currentQuantityInCart =
      cart.find((item) => item.id === product.id)?.quantity || 0;

    if (currentQuantityInCart >= product.stock) {
      toast.error(
        `Estoque insuficiente! Apenas ${product.stock} unidades disponíveis.`
      );
      return;
    }

    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      setCart((prev) => prev.filter((item) => item.id !== productId));
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (product && quantity > product.stock) {
      toast.error(
        `Estoque insuficiente! Apenas ${product.stock} unidades disponíveis.`
      );
      return;
    }

    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const updateCartNotes = (productId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, notes } : item))
    );
  };

  const getTotalPrice = () => {
    const subtotal = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const discountAmount = subtotal * (appliedDiscount / 100);
    return subtotal - discountAmount;
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getDiscountAmount = () => {
    return getSubtotal() * (appliedDiscount / 100);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const trackOrderByPhone = async () => {
    if (!trackingPhone.trim()) {
      toast.error('Por favor, digite seu número de telefone');
      return;
    }

    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, customer_name, total, status, created_at')
        .eq('customer_phone', trackingPhone.trim())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!orders || orders.length === 0) {
        toast.error('Nenhum pedido encontrado com este telefone');
        return;
      }

      const latestOrder = orders[0];
      window.open(`/acompanhar/${latestOrder.id}`, '_blank');
      setShowOrderTracking(false);
      setTrackingPhone('');
      toast.success(
        `Abrindo acompanhamento do pedido #${latestOrder.id.slice(-6)}`
      );
    } catch (error: any) {
      toast.error('Erro ao buscar pedido: ' + error.message);
    }
  };

  const formatAddress = () => {
    const parts = [];
    if (customerInfo.street) parts.push(customerInfo.street);
    if (customerInfo.number) parts.push(customerInfo.number);
    if (customerInfo.neighborhood) parts.push(customerInfo.neighborhood);
    if (customerInfo.city) parts.push(customerInfo.city);
    if (customerInfo.reference) parts.push(`(Ref: ${customerInfo.reference})`);

    return parts.join(', ');
  };

  const handleLuckyWheelWin = (discount: number, code: string) => {
    setAppliedDiscount(discount);
    setCouponCode(code);
    toast.success(`Cupom ${code} aplicado! ${discount}% de desconto`);
  };

  const submitOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error('Por favor, preencha seu nome e telefone');
      return;
    }

    if (cart.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    if (!establishmentId) {
      toast.error('Erro: estabelecimento não encontrado');
      return;
    }

    for (const item of cart) {
      const product = products.find((p) => p.id === item.id);
      if (!product || item.quantity > product.stock) {
        toast.error(
          `Estoque insuficiente para ${item.name}. Apenas ${
            product?.stock || 0
          } unidades disponíveis.`
        );
        return;
      }
    }

    setSubmittingOrder(true);

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          delivery_address: formatAddress() || null,
          total: getTotalPrice(),
          payment_method: customerInfo.paymentMethod,
          status: 'pending',
          establishment_id: establishmentId,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setCart([]);
      setAppliedDiscount(0);
      setCouponCode('');
      setCustomerInfo({
        name: '',
        phone: '',
        street: '',
        number: '',
        neighborhood: '',
        city: 'Sorriso - MT',
        reference: '',
        paymentMethod: 'dinheiro',
      });
      setShowCart(false);
      setShowCheckout(false);

      toast.success('Pedido enviado com sucesso!');
      window.location.href = `/acompanhar/${order.id}`;
    } catch (error: any) {
      toast.error('Erro ao enviar pedido: ' + error.message);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-lg font-medium">
            Carregando Bigode System...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                <img
                  src="https://i.imgur.com/7ugYZbV.png"
                  alt="Bigode System"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold text-white">BIGODE SYSTEM</h1>
                <p className="text-xs text-gray-400">Catálogo Digital</p>
              </div>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => setShowLuckyWheel(true)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Target className="w-4 h-4" />
                <span className="font-bold">Bigode da Sorte</span>
              </button>

              <button
                onClick={() => setShowOrderTracking(true)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors border border-gray-700"
              >
                <Package className="w-4 h-4" />
                <span>Pedidos</span>
              </button>

              <button
                onClick={() => setShowCart(true)}
                className="relative bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-lg"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Carrinho</span>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowCart(true)}
                className="relative bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {showMobileMenu ? (
                  <X className="w-5 h-5" />
                ) : (
                  <MenuIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {showMobileSearch && (
            <div className="md:hidden mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>
          )}

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-3 pb-3 border-t border-gray-800 pt-3">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowLuckyWheel(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Target className="w-4 h-4" />
                  <span className="font-bold">Bigode da Sorte</span>
                </button>
                <button
                  onClick={() => {
                    setShowOrderTracking(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  <span>Rastrear Pedidos</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Categories */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex space-x-1 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                Todos
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="pt-32 pb-8 bg-gradient-to-b from-black-900 to-black">
        <div className="max-w-7xl mx-auto px-4 text-center">
          {/* Rotating Banner */}
          <div className="mb-8">
            <RotatingBanner />
          </div>

          {/* Payment Methods */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <div className="flex items-center space-x-2 bg-gray-800 rounded-full px-4 py-2">
              <CreditCard className="w-4 h-4 text-red-600" />
              <span className="text-white text-sm">Cartão</span>
            </div>
            <div className="flex items-center space-x-2 bg-gray-800 rounded-full px-4 py-2">
              <Banknote className="w-4 h-4 text-green-500" />
              <span className="text-white text-sm">Dinheiro</span>
            </div>
            <div className="flex items-center space-x-2 bg-gray-800 rounded-full px-4 py-2">
              <Smartphone className="w-4 h-4 text-blue-500" />
              <span className="text-white text-sm">PIX</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center space-x-2 text-gray-300">
              <Clock className="w-4 h-4 text-red-600" />
              <span>Entrega em 30min</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>4.9★ Avaliação</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Award className="w-4 h-4 text-red-600" />
              <span>Qualidade Premium</span>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {/* Products Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-red-600 transition-all duration-300 hover:transform hover:scale-105 shadow-lg group"
            >
              <div className="relative aspect-square overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <VapeIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-600" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 space-y-1">
                  {product.stock === 0 ? (
                    <span className="bg-red-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium">
                      Esgotado
                    </span>
                  ) : product.stock <= 5 ? (
                    <span className="bg-yellow-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium">
                      Últimas {product.stock}
                    </span>
                  ) : null}
                </div>

                {/* Quick Add Button */}
                {product.stock > 0 && (
                  <button
                    onClick={() => addToCart(product)}
                    className="absolute bottom-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 sm:p-2 rounded-full shadow-lg transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>

              <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
                <div>
                  <h3 className="font-bold text-white text-xs sm:text-base mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 leading-relaxed hidden sm:block">
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <span className="text-sm sm:text-xl font-bold text-red-600">
                      R$ {product.price.toFixed(2)}
                    </span>
                  </div>

                  <Button
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className={`px-2 py-1 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm w-full sm:w-auto ${
                      product.stock === 0
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                    }`}
                  >
                    {product.stock === 0 ? 'Esgotado' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <VapeIcon className="w-16 h-16 text-gray-600 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">
              {searchTerm || selectedCategory
                ? 'Nenhum produto encontrado'
                : 'Cardápio em preparação'}
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {searchTerm || selectedCategory
                ? 'Tente buscar por outro termo ou categoria.'
                : 'Nossos produtos estão sendo preparados para você.'}
            </p>
          </div>
        )}
      </div>

      {/* WhatsApp Float Button */}
      <a
        href="https://wa.me/556540421002"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-40"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
        </svg>
      </a>

      {/* Lucky Wheel Modal */}
      <LuckyWheel
        isOpen={showLuckyWheel}
        onClose={() => setShowLuckyWheel(false)}
        onWin={handleLuckyWheelWin}
      />

      {/* Order Tracking Modal */}
      {showOrderTracking && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-gray-900 border-gray-700">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Package className="w-5 h-5 mr-2 text-red-600" />
                  Rastrear Pedido
                </h2>
                <button
                  onClick={() => setShowOrderTracking(false)}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-gray-300 mb-4">
                  Digite o número de telefone usado no pedido:
                </p>

                <Input
                  label="Número de Telefone"
                  placeholder="(11) 99999-9999"
                  value={trackingPhone}
                  onChange={(e) => setTrackingPhone(e.target.value)}
                  className="mb-4"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowOrderTracking(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={trackOrderByPhone}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Seu Carrinho</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <CardContent className="p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Seu carrinho está vazio
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Adicione alguns produtos incríveis!
                  </p>
                  <Button
                    onClick={() => setShowCart(false)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Continuar Comprando
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-gray-800 rounded-lg space-y-3 border border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white truncate">
                              {item.name}
                            </h4>
                            <p className="text-gray-400 text-sm">
                              R$ {item.price.toFixed(2)} cada
                            </p>
                          </div>
                          <div className="flex items-center space-x-3 ml-4">
                            <button
                              onClick={() =>
                                updateCartQuantity(item.id, item.quantity - 1)
                              }
                              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-white font-bold w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateCartQuantity(item.id, item.quantity + 1)
                              }
                              disabled={item.quantity >= item.stock}
                              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-white font-bold">
                              R$ {(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <textarea
                          placeholder="Observações especiais..."
                          value={item.notes || ''}
                          onChange={(e) =>
                            updateCartNotes(item.id, e.target.value)
                          }
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Discount Section */}
                  {appliedDiscount > 0 && (
                    <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-400">🎯</span>
                          <span className="text-green-400 font-medium">
                            Cupom {couponCode} aplicado!
                          </span>
                        </div>
                        <span className="text-green-400 font-bold">
                          {appliedDiscount}% OFF
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-800 pt-6 space-y-2">
                    <div className="flex items-center justify-between text-gray-300">
                      <span>Subtotal:</span>
                      <span>R$ {getSubtotal().toFixed(2)}</span>
                    </div>

                    {appliedDiscount > 0 && (
                      <div className="flex items-center justify-between text-green-400">
                        <span>Desconto ({appliedDiscount}%):</span>
                        <span>-R$ {getDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-2xl font-bold text-white border-t border-gray-700 pt-2">
                      <span>Total:</span>
                      <span className="text-red-600">
                        R$ {getTotalPrice().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <Button
                      variant="ghost"
                      onClick={() => setShowCart(false)}
                      className="flex-1"
                    >
                      Continuar Comprando
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCart(false);
                        setShowCheckout(true);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      Finalizar Pedido
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Finalizar Pedido
                </h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Privacy Notice */}
              <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-blue-400 mb-2">
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold">Privacidade e Segurança</span>
                </div>
                <p className="text-blue-300 text-sm">
                  Todos os dados informados neste formulário são <strong>totalmente confidenciais</strong> e utilizados apenas para processamento e entrega do seu pedido. Não compartilhamos suas informações com terceiros.
                </p>
              </div>

              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <User className="w-5 h-5 mr-2 text-red-600" />
                  Seus Dados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome completo *"
                    placeholder="Seu nome"
                    value={customerInfo.name}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, name: e.target.value })
                    }
                  />
                  <Input
                    label="Telefone *"
                    placeholder="(11) 99999-9999"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Address Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Home className="w-5 h-5 mr-2 text-red-600" />
                  Endereço para Entrega
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Rua/Avenida"
                      placeholder="Nome da rua"
                      value={customerInfo.street}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          street: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Input
                    label="Número"
                    placeholder="123"
                    value={customerInfo.number}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        number: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Bairro"
                    placeholder="Nome do bairro"
                    value={customerInfo.neighborhood}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        neighborhood: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Cidade"
                    value={customerInfo.city}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, city: e.target.value })
                    }
                    className="bg-gray-700"
                    readOnly
                  />
                </div>

                <Input
                  label="Ponto de Referência (opcional)"
                  placeholder="Ex: Próximo ao supermercado, casa azul..."
                  value={customerInfo.reference}
                  onChange={(e) =>
                    setCustomerInfo({
                      ...customerInfo,
                      reference: e.target.value,
                    })
                  }
                />

                {(customerInfo.street ||
                  customerInfo.number ||
                  customerInfo.neighborhood) && (
                  <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">
                      Endereço completo:
                    </p>
                    <p className="text-white text-sm">{formatAddress()}</p>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">
                  Forma de Pagamento
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                    {
                      value: 'cartao_debito',
                      label: 'Cartão Débito',
                      icon: CreditCard,
                    },
                    {
                      value: 'cartao_credito',
                      label: 'Cartão Crédito',
                      icon: CreditCard,
                    },
                    { value: 'pix', label: 'PIX', icon: Smartphone },
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.value}
                        onClick={() =>
                          setCustomerInfo({
                            ...customerInfo,
                            paymentMethod: method.value,
                          })
                        }
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors flex items-center space-x-2 ${
                          customerInfo.paymentMethod === method.value
                            ? 'border-red-600 bg-red-600/20 text-white'
                            : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">
                  Resumo do Pedido
                </h3>
                <div className="bg-gray-800 rounded-lg p-4 space-y-2 border border-gray-700">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-300">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-white">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}

                  <div className="border-t border-gray-700 pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Subtotal:</span>
                      <span className="text-white">
                        R$ {getSubtotal().toFixed(2)}
                      </span>
                    </div>

                    {appliedDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-400">
                          Desconto ({appliedDiscount}%):
                        </span>
                        <span className="text-green-400">
                          -R$ {getDiscountAmount().toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-gray-700 pt-2 flex justify-between font-bold">
                      <span className="text-white">Total:</span>
                      <span className="text-red-600">
                        R$ {getTotalPrice().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCheckout(false);
                    setShowCart(true);
                  }}
                  className="flex-1"
                >
                  Voltar ao Carrinho
                </Button>
                <Button
                  onClick={submitOrder}
                  loading={submittingOrder}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Pedido
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-black-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Logo e Informações */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 flex items-center justify-center">
                  <img
                    src="https://i.imgur.com/7ugYZbV.png"
                    alt="Bigode System"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">BIGODE SYSTEM</h3>
                  <p className="text-gray-400 text-sm">Catálogo Digital</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Qualidade premium e atendimento excepcional para toda Sorriso - MT.
              </p>
            </div>

            {/* Localização */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Localização</h4>
              <div className="space-y-2 text-gray-400 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>Sorriso - MT</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-red-600" />
                  <span>(65) 4042-1002</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span>Seg - Dom: 18:00 - 02:00</span>
                </div>
              </div>
            </div>

            {/* Links Rápidos */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Links Rápidos</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setShowLuckyWheel(true)}
                  className="block text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Bigode da Sorte
                </button>
                <button
                  onClick={() => setShowOrderTracking(true)}
                  className="block text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Rastrear Pedido
                </button>
                <a
                  href="/admin/login"
                  className="block text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Área Administrativa
                </a>
              </div>
            </div>
          </div>

          {/* Linha de separação */}
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-400 text-sm text-center md:text-left">
                © 2025 Bigode System. Todos os direitos reservados.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>4.9★ Avaliação</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <Award className="w-4 h-4 text-red-600" />
                  <span>Qualidade Premium</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
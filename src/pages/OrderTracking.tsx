import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  User,
  Phone,
  MapPin,
  DollarSign,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  total: number;
  status: string;
  payment_method: string;
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  notes: string | null;
  products?: { name: string };
}

const statusSteps = [
  {
    key: 'pending',
    title: 'Pedido Recebido',
    description: 'Seu pedido foi recebido e está sendo processado',
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
  },
  {
    key: 'confirmed',
    title: 'Pedido Confirmado',
    description: 'Seu pedido foi confirmado e será preparado em breve',
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
  },
  {
    key: 'preparing',
    title: 'Em Preparo',
    description: 'Estamos preparando seu pedido com muito carinho',
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
  },
  {
    key: 'ready',
    title: 'Pronto para Entrega',
    description: 'Seu pedido está pronto e será enviado em breve',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
  },
  {
    key: 'delivered',
    title: 'Entregue',
    description: 'Seu pedido foi entregue com sucesso!',
    icon: Truck,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
];

export function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();

      // Set up real-time subscription for order updates
      const subscription = supabase
        .channel(`order_${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            if (payload.new) {
              setOrder((prev) => (prev ? { ...prev, ...payload.new } : null));
              toast.success('Status do pedido atualizado!');
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            *,
            products (name)
          )
        `
        )
        .eq('id', orderId);

      if (error) {
        toast.error('Erro ao carregar pedido');
        console.error('Error fetching order:', error);
      } else if (!data || data.length === 0) {
        setNotFound(true);
      } else {
        setOrder(data[0]);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar pedido');
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    return statusSteps.findIndex((step) => step.key === order.status);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getEstimatedTime = () => {
    if (!order) return '';

    const orderTime = new Date(order.created_at);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - orderTime.getTime()) / (1000 * 60)
    );

    switch (order.status) {
      case 'pending':
        return '5-10 minutos para confirmação';
      case 'confirmed':
        return '5 minutos para iniciar preparo';
      case 'preparing':
        return 'estamos separando o produto de seu pedido';
      case 'ready':
        return 'seu pedido está pronto e em rota de entrega';
      case 'delivered':
        return 'Pedido entregue!';
      default:
        return '';
    }
  };

  const sendWhatsAppMessage = () => {
    if (!order || !order.customer_phone) return;

    const message = `Olá! Gostaria de saber sobre meu pedido #${order.id.slice(
      -6
    )}. Obrigado!`;
    const phoneNumber = '5511999999999'; // Replace with your WhatsApp number
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando pedido...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="text-center">
            <CardContent className="p-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">
                Pedido não encontrado
              </h1>
              <p className="text-gray-400 mb-6">
                O pedido que você está procurando não existe ou foi removido.
              </p>
              <div className="flex space-x-4 justify-center">
                <Button onClick={() => navigate('/')} variant="secondary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Menu
                </Button>
                <Button
                  onClick={() =>
                    (window.location.href = 'https://wa.me/5511999999999')
                  }
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Falar no WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const currentStepIndex = getCurrentStepIndex();
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                <img
                  src="https://media.discordapp.net/attachments/1355737047943348337/1388967164580724857/BIGODEVAPOR-LOGO-SEM-FUNDO.png?ex=6862e7f9&is=68619679&hm=40a2edabedd9bd1773d50b4a7926fe67539dbacb265570538e20f4195dfa2807&=&format=webp&quality=lossless&width=968&height=968"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Acompanhar Pedido
                </h1>
                <p className="text-xs text-gray-400">Status em tempo real</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={fetchOrder} variant="ghost" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="secondary"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Menu
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Order Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  Pedido #{order.id.slice(-6)}
                </CardTitle>
                <p className="text-gray-400 mt-1">
                  Feito em {formatDate(order.created_at)} às{' '}
                  {formatTime(order.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  R$ {order.total.toFixed(2)}
                </p>
                <p className="text-gray-400 text-sm">{order.payment_method}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Status Progress */}
        {!isCancelled ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Status do Pedido
              </CardTitle>
              <p className="text-gray-400">{getEstimatedTime()}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const isNext = index === currentStepIndex + 1;

                  return (
                    <div key={step.key} className="flex items-start space-x-4">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                          isCompleted
                            ? `${step.bgColor} ${step.borderColor} ${step.color}`
                            : isNext
                            ? 'bg-gray-100 border-gray-300 text-gray-400'
                            : 'bg-gray-50 border-gray-200 text-gray-300'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-semibold ${
                            isCompleted ? 'text-white' : 'text-gray-400'
                          }`}
                        >
                          {step.title}
                        </div>
                        <div
                          className={`text-sm mt-1 ${
                            isCompleted ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          {step.description}
                        </div>
                        {isCurrent && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Status Atual
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Time */}
                      {isCompleted && (
                        <div className="text-xs text-gray-400">
                          {index === currentStepIndex
                            ? formatTime(order.updated_at)
                            : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Pedido Cancelado
              </h3>
              <p className="text-gray-400">
                Seu pedido foi cancelado. Entre em contato conosco para mais
                informações.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Informações do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Cliente</p>
                    <p className="text-white font-medium">
                      {order.customer_name}
                    </p>
                  </div>
                </div>

                {order.customer_phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Telefone</p>
                      <p className="text-white font-medium">
                        {order.customer_phone}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {order.delivery_address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">
                        Endereço de Entrega
                      </p>
                      <p className="text-white font-medium">
                        {order.delivery_address}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Forma de Pagamento</p>
                    <p className="text-white font-medium">
                      {order.payment_method}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        {order.order_items && order.order_items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Itens do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start p-4 bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {item.quantity}x {item.products?.name || 'Produto'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        R$ {item.price.toFixed(2)} cada
                      </p>
                      {item.notes && (
                        <p className="text-gray-400 text-sm mt-1">
                          <strong>Obs:</strong> {item.notes}
                        </p>
                      )}
                    </div>
                    <p className="text-white font-bold">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}

                <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-white">Total:</span>
                  <span className="text-lg font-bold text-white">
                    R$ {order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Support */}
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Precisa de Ajuda?
            </h3>
            <p className="text-gray-400 mb-4">
              Entre em contato conosco pelo WhatsApp para tirar dúvidas sobre
              seu pedido
            </p>
            <Button
              onClick={sendWhatsAppMessage}
              className="bg-green-600 hover:bg-green-700"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Falar no WhatsApp
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

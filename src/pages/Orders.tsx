import React, { useState, useEffect } from 'react'
import { Search, Eye, Edit, Printer, MessageSquare, Package, User, Phone, MapPin, DollarSign, Clock, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface Order {
  id: string
  customer_name: string
  customer_phone: string | null
  total: number
  status: string
  payment_method: string
  delivery_address: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  price: number
  notes: string | null
  products?: { name: string; description?: string }
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

const statusLabels = {
  pending: 'Aguardando',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, description)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error
      toast.success('Status do pedido atualizado!')
      fetchOrders()
    } catch (error: any) {
      toast.error('Erro ao atualizar status')
    }
  }

  const sendWhatsAppMessage = (order: Order) => {
    if (!order.customer_phone) {
      toast.error('Cliente não possui telefone cadastrado')
      return
    }

    const message = `Olá ${order.customer_name}! Seu pedido #${order.id.slice(-6)} está ${statusLabels[order.status as keyof typeof statusLabels].toLowerCase()}. Total: R$ ${order.total.toFixed(2)}`
    const phoneNumber = order.customer_phone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`
    
    window.open(whatsappUrl, '_blank')
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Carregando pedidos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pedidos</h1>
          <p className="text-gray-400 mt-2">Gerencie todos os pedidos do seu estabelecimento</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por cliente ou ID do pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todos os status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-800">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        Pedido #{order.id.slice(-6)}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[order.status as keyof typeof statusColors]
                      }`}>
                        {statusLabels[order.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Cliente</p>
                        <p className="text-white font-medium">{order.customer_name}</p>
                        {order.customer_phone && (
                          <p className="text-gray-400">{order.customer_phone}</p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-gray-400">Total</p>
                        <p className="text-white font-bold text-lg">R$ {order.total.toFixed(2)}</p>
                        <p className="text-gray-400">{order.payment_method}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-400">Data</p>
                        <p className="text-white">
                          {formatDate(order.created_at)}
                        </p>
                        <p className="text-gray-400">
                          {formatTime(order.created_at)}
                        </p>
                      </div>
                    </div>

                    {order.delivery_address && (
                      <div className="mt-3">
                        <p className="text-gray-400 text-sm">Endereço de entrega</p>
                        <p className="text-white text-sm">{order.delivery_address}</p>
                      </div>
                    )}

                    {/* Order Items Preview */}
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="mt-3">
                        <p className="text-gray-400 text-sm mb-1">Itens do pedido:</p>
                        <div className="text-white text-sm">
                          {order.order_items.slice(0, 2).map((item, index) => (
                            <span key={item.id}>
                              {item.quantity}x {item.products?.name}
                              {index < Math.min(order.order_items!.length, 2) - 1 && ', '}
                            </span>
                          ))}
                          {order.order_items.length > 2 && (
                            <span className="text-gray-400"> e mais {order.order_items.length - 2} itens</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {/* Status Update */}
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>

                    {/* Actions */}
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-blue-500 hover:text-blue-400 transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => sendWhatsAppMessage(order)}
                        className="p-2 text-green-500 hover:text-green-400 transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Imprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-400">
              {searchTerm || statusFilter ? 'Nenhum pedido encontrado.' : 'Nenhum pedido ainda.'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pedido #{selectedOrder.id.slice(-6)}</CardTitle>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Informações do Cliente</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{selectedOrder.customer_name}</span>
                    </div>
                    {selectedOrder.customer_phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{selectedOrder.customer_phone}</span>
                      </div>
                    )}
                    {selectedOrder.delivery_address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{selectedOrder.delivery_address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-white mb-2">Detalhes do Pedido</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">R$ {selectedOrder.total.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{selectedOrder.payment_method}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">
                        {formatDate(selectedOrder.created_at)} às {formatTime(selectedOrder.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-2">Itens do Pedido</h4>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start p-3 bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {item.quantity}x {item.products?.name || 'Produto'}
                          </p>
                          {item.products?.description && (
                            <p className="text-gray-400 text-sm">{item.products.description}</p>
                          )}
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
                        R$ {selectedOrder.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div>
                <h4 className="font-semibold text-white mb-2">Atualizar Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(statusLabels).map(([status, label]) => {
                    const isCurrentStatus = selectedOrder.status === status
                    
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          if (!isCurrentStatus) {
                            updateOrderStatus(selectedOrder.id, status)
                            setSelectedOrder({ ...selectedOrder, status })
                          }
                        }}
                        disabled={isCurrentStatus}
                        className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                          isCurrentStatus
                            ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                            : 'bg-gray-800 text-white hover:bg-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
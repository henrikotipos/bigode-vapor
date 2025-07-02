import React, { useState, useEffect } from 'react'
import { Clock, User, Phone, MapPin, DollarSign, Package, AlertCircle, CheckCircle, Truck, X, Eye } from 'lucide-react'
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

const statusConfig = {
  pending: {
    title: 'Novos Pedidos',
    color: 'bg-yellow-500',
    icon: AlertCircle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  confirmed: {
    title: 'Confirmados',
    color: 'bg-blue-500',
    icon: CheckCircle,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  preparing: {
    title: 'Em Preparo',
    color: 'bg-orange-500',
    icon: Package,
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  ready: {
    title: 'Prontos',
    color: 'bg-green-500',
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  delivered: {
    title: 'Entregues',
    color: 'bg-gray-500',
    icon: Truck,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  cancelled: {
    title: 'Cancelados',
    color: 'bg-red-500',
    icon: X,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
}

export function Kanban() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
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
      
      // Update local state immediately for better UX
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ))
      
      toast.success('Status do pedido atualizado!')
    } catch (error: any) {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleDragStart = (e: React.DragEvent, order: Order) => {
    setDraggedOrder(order)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (draggedOrder && draggedOrder.status !== newStatus) {
      updateOrderStatus(draggedOrder.id, newStatus)
    }
    setDraggedOrder(null)
  }

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status)
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

  const getTimeSinceOrder = (dateString: string) => {
    const now = new Date()
    const orderTime = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}min atrás`
    } else {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours}h atrás`
    }
  }

  const OrderCard = ({ order }: { order: Order }) => {
    const config = statusConfig[order.status as keyof typeof statusConfig]
    const timeSince = getTimeSinceOrder(order.created_at)
    const isUrgent = new Date().getTime() - new Date(order.created_at).getTime() > 30 * 60 * 1000 // 30 minutes

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, order)}
        className={`bg-white border-l-4 ${config.borderColor} rounded-lg shadow-sm hover:shadow-md transition-all cursor-move p-4 mb-3 ${
          isUrgent && order.status !== 'delivered' && order.status !== 'cancelled' ? 'ring-2 ring-red-300' : ''
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-gray-900">
              #{order.id.slice(-6)}
            </span>
            {isUrgent && order.status !== 'delivered' && order.status !== 'cancelled' && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                Urgente
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setSelectedOrder(order)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Ver detalhes"
            >
              <Eye className="w-3 h-3" />
            </button>
            <span className="text-xs text-gray-500">{timeSince}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">{order.customer_name}</span>
          </div>

          {order.customer_phone && (
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{order.customer_phone}</span>
            </div>
          )}

          {order.delivery_address && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 truncate">{order.delivery_address}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-600">
                R$ {order.total.toFixed(2)}
              </span>
            </div>
            <span className="text-xs text-gray-500">{order.payment_method}</span>
          </div>

          {/* Order Items Preview */}
          {order.order_items && order.order_items.length > 0 && (
            <div className="text-xs text-gray-500 border-t pt-2">
              <div className="font-medium mb-1">{order.order_items.length} item(s):</div>
              {order.order_items.slice(0, 2).map((item, index) => (
                <div key={item.id} className="truncate">
                  {item.quantity}x {item.products?.name}
                </div>
              ))}
              {order.order_items.length > 2 && (
                <div className="text-gray-400">+{order.order_items.length - 2} mais</div>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatDate(order.created_at)} às {formatTime(order.created_at)}</span>
            <Clock className="w-3 h-3" />
          </div>
        </div>
      </div>
    )
  }

  const KanbanColumn = ({ status, title, color, icon: Icon, bgColor }: any) => {
    const columnOrders = getOrdersByStatus(status)
    
    return (
      <div className="flex-1 min-w-80">
        <div className={`${bgColor} rounded-lg p-4 mb-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 ${color} rounded-full`}></div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
            </div>
            <span className="bg-white text-gray-700 text-sm px-2 py-1 rounded-full font-medium">
              {columnOrders.length}
            </span>
          </div>
        </div>

        <div
          className="min-h-96 p-2 bg-gray-50 rounded-lg"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
        >
          {columnOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          
          {columnOrders.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <div className="text-center">
                <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum pedido</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

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
          <h1 className="text-3xl font-bold text-white">Kanban de Pedidos</h1>
          <p className="text-gray-400 mt-2">Gerencie o fluxo de pedidos em tempo real</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            Total: {orders.length} pedidos
          </div>
          <Button onClick={fetchOrders} variant="ghost" size="sm">
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = getOrdersByStatus(status).length
          const Icon = config.icon
          
          return (
            <Card key={status} className="bg-gray-900">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">{config.title}</p>
                    <p className="text-xl font-bold text-white">{count}</p>
                  </div>
                  <div className={`w-8 h-8 ${config.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Kanban Board */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex space-x-6 overflow-x-auto pb-4">
          {Object.entries(statusConfig).map(([status, config]) => (
            <KanbanColumn
              key={status}
              status={status}
              title={config.title}
              color={config.color}
              icon={config.icon}
              bgColor={config.bgColor}
            />
          ))}
        </div>
      </div>

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
                  {Object.entries(statusConfig).map(([status, config]) => {
                    const Icon = config.icon
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
                        className={`flex items-center space-x-2 p-3 rounded-lg text-sm font-medium transition-colors ${
                          isCurrentStatus
                            ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                            : 'bg-gray-800 text-white hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{config.title}</span>
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
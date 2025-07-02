import React, { useState, useEffect } from 'react'
import { Search, User, Phone, Calendar, DollarSign, ShoppingCart, AlertTriangle, TrendingDown, Eye, MessageSquare, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface CustomerData {
  customer_name: string
  customer_phone: string | null
  total_orders: number
  total_spent: number
  last_order_date: string | null
  first_order_date: string | null
  avg_order_value: number
  days_since_last_order: number | null
  orders: Array<{
    id: string
    total: number
    status: string
    payment_method: string
    created_at: string
    order_items: Array<{
      quantity: number
      price: number
      products: { name: string }
    }>
  }>
}

export function Users() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'inactive' | 'vip'>('all')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      // Get all orders with customer info and items
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_phone,
          total,
          status,
          payment_method,
          created_at,
          order_items (
            quantity,
            price,
            products (name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group orders by customer (using phone as unique identifier)
      const customerMap = new Map<string, CustomerData>()

      orders?.forEach(order => {
        const key = `${order.customer_name}-${order.customer_phone || 'no-phone'}`
        
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            total_orders: 0,
            total_spent: 0,
            last_order_date: null,
            first_order_date: null,
            avg_order_value: 0,
            days_since_last_order: null,
            orders: []
          })
        }

        const customer = customerMap.get(key)!
        customer.orders.push(order)
        customer.total_orders++
        customer.total_spent += order.total

        // Update dates
        if (!customer.last_order_date || order.created_at > customer.last_order_date) {
          customer.last_order_date = order.created_at
        }
        if (!customer.first_order_date || order.created_at < customer.first_order_date) {
          customer.first_order_date = order.created_at
        }
      })

      // Calculate additional metrics
      const customersArray = Array.from(customerMap.values()).map(customer => {
        customer.avg_order_value = customer.total_spent / customer.total_orders
        
        if (customer.last_order_date) {
          const lastOrderDate = new Date(customer.last_order_date)
          const now = new Date()
          customer.days_since_last_order = Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        }

        // Sort orders by date (newest first)
        customer.orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        return customer
      })

      // Sort customers by total spent (descending)
      customersArray.sort((a, b) => b.total_spent - a.total_spent)

      setCustomers(customersArray)
    } catch (error: any) {
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  const sendWhatsAppMessage = (customer: CustomerData) => {
    if (!customer.customer_phone) {
      toast.error('Cliente não possui telefone cadastrado')
      return
    }

    const message = `Olá ${customer.customer_name}! Sentimos sua falta! Que tal fazer um novo pedido? Temos novidades deliciosas esperando por você! 😋`
    const phoneNumber = customer.customer_phone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`
    
    window.open(whatsappUrl, '_blank')
  }

  const getCustomerType = (customer: CustomerData) => {
    if (customer.days_since_last_order && customer.days_since_last_order > 30) {
      return { type: 'inactive', label: 'Inativo', color: 'text-red-500' }
    }
    if (customer.total_spent > 200 || customer.total_orders > 10) {
      return { type: 'vip', label: 'VIP', color: 'text-yellow-500' }
    }
    return { type: 'regular', label: 'Regular', color: 'text-green-500' }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.customer_phone && customer.customer_phone.includes(searchTerm))
    
    if (!matchesSearch) return false

    if (filterType === 'inactive') {
      return customer.days_since_last_order && customer.days_since_last_order > 30
    }
    if (filterType === 'vip') {
      return customer.total_spent > 200 || customer.total_orders > 10
    }
    return true
  })

  // Calculate stats
  const totalCustomers = customers.length
  const inactiveCustomers = customers.filter(c => c.days_since_last_order && c.days_since_last_order > 30).length
  const vipCustomers = customers.filter(c => c.total_spent > 200 || c.total_orders > 10).length
  const avgOrderValue = customers.reduce((sum, c) => sum + c.avg_order_value, 0) / customers.length || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Carregando clientes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => navigate('/admin/dashboard')} 
            variant="ghost" 
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Gestão de Clientes</h1>
            <p className="text-gray-400 mt-2">Analise o comportamento e histórico dos seus clientes</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total de Clientes</p>
                <p className="text-2xl font-bold text-white">{totalCustomers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Clientes Inativos</p>
                <p className="text-2xl font-bold text-white">{inactiveCustomers}</p>
                <p className="text-xs text-red-400">+30 dias sem pedidos</p>
              </div>
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Clientes VIP</p>
                <p className="text-2xl font-bold text-white">{vipCustomers}</p>
                <p className="text-xs text-yellow-400">R$200+ ou 10+ pedidos</p>
              </div>
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Ticket Médio</p>
                <p className="text-2xl font-bold text-white">
                  R$ {avgOrderValue.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('inactive')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'inactive'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:text-white'
                }`}
              >
                Inativos
              </button>
              <button
                onClick={() => setFilterType('vip')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'vip'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:text-white'
                }`}
              >
                VIP
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-800">
            {filteredCustomers.map((customer, index) => {
              const customerType = getCustomerType(customer)
              
              return (
                <div key={`${customer.customer_name}-${customer.customer_phone}-${index}`} className="p-6 hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{customer.customer_name}</h3>
                          <div className="flex items-center space-x-3 text-sm">
                            {customer.customer_phone && (
                              <span className="text-gray-400">{customer.customer_phone}</span>
                            )}
                            <span className={`font-medium ${customerType.color}`}>
                              {customerType.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Total de Pedidos</p>
                          <p className="text-white font-bold">{customer.total_orders}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-400">Total Gasto</p>
                          <p className="text-green-400 font-bold">R$ {customer.total_spent.toFixed(2)}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-400">Ticket Médio</p>
                          <p className="text-white font-bold">R$ {customer.avg_order_value.toFixed(2)}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-400">Último Pedido</p>
                          <p className="text-white">
                            {customer.last_order_date 
                              ? new Date(customer.last_order_date).toLocaleDateString('pt-BR')
                              : 'Nunca'
                            }
                          </p>
                          {customer.days_since_last_order && (
                            <p className={`text-xs ${
                              customer.days_since_last_order > 30 ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {customer.days_since_last_order} dias atrás
                            </p>
                          )}
                        </div>
                      </div>

                      {customer.days_since_last_order && customer.days_since_last_order > 30 && (
                        <div className="mt-3 flex items-center space-x-2 text-red-400 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Cliente inativo há {customer.days_since_last_order} dias</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="p-2 text-blue-500 hover:text-blue-400 transition-colors bg-gray-800 hover:bg-gray-700 rounded-lg"
                        title="Ver histórico"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {customer.customer_phone && (
                        <button
                          onClick={() => sendWhatsAppMessage(customer)}
                          className="p-2 text-green-500 hover:text-green-400 transition-colors bg-gray-800 hover:bg-gray-700 rounded-lg"
                          title="Enviar WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
            </h3>
            <p className="text-gray-400">
              {searchTerm 
                ? 'Tente buscar por outro termo.' 
                : 'Os clientes aparecerão aqui quando fizerem seus primeiros pedidos.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Histórico de {selectedCustomer.customer_name}
                </CardTitle>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-800 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Total de Pedidos</p>
                  <p className="text-2xl font-bold text-white">{selectedCustomer.total_orders}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Total Gasto</p>
                  <p className="text-2xl font-bold text-green-400">R$ {selectedCustomer.total_spent.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Ticket Médio</p>
                  <p className="text-2xl font-bold text-white">R$ {selectedCustomer.avg_order_value.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Cliente desde</p>
                  <p className="text-lg font-bold text-white">
                    {selectedCustomer.first_order_date 
                      ? new Date(selectedCustomer.first_order_date).toLocaleDateString('pt-BR')
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>

              {/* Orders History */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Histórico de Pedidos</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedCustomer.orders.map((order) => (
                    <div key={order.id} className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-white font-medium">Pedido #{order.id.slice(-6)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status === 'delivered' ? 'Entregue' :
                             order.status === 'cancelled' ? 'Cancelado' :
                             'Em andamento'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">R$ {order.total.toFixed(2)}</p>
                          <p className="text-gray-400 text-sm">{order.payment_method}</p>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-400 mb-2">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')} às {new Date(order.created_at).toLocaleTimeString('pt-BR')}
                      </div>
                      
                      {order.order_items && order.order_items.length > 0 && (
                        <div className="text-sm">
                          <p className="text-gray-400 mb-1">Itens:</p>
                          <div className="space-y-1">
                            {order.order_items.map((item, index) => (
                              <div key={index} className="flex justify-between text-gray-300">
                                <span>{item.quantity}x {item.products.name}</span>
                                <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  AlertTriangle,
  Eye,
  ExternalLink,
  Plus,
  Tag
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalCategories: 0,
    profitMargin: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [salesData, setSalesData] = useState<any[]>([])
  const [paymentData, setPaymentData] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
    fetchRecentOrders()
    fetchSalesData()
    fetchPaymentData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('total, status')

      // Fetch products with cost information
      const { data: products } = await supabase
        .from('products')
        .select('stock, price, cost')

      // Fetch categories
      const { data: categories } = await supabase
        .from('categories')
        .select('id')

      const completedOrders = orders?.filter(o => o.status === 'delivered') || []
      const totalSales = completedOrders.reduce((sum, order) => sum + order.total, 0)
      const totalOrders = orders?.length || 0
      const totalProducts = products?.length || 0
      const lowStockProducts = products?.filter(p => p.stock < 10).length || 0
      const totalCategories = categories?.length || 0

      // Calculate profit margin
      const totalRevenue = products?.reduce((sum, p) => sum + (p.price * p.stock), 0) || 0
      const totalCost = products?.reduce((sum, p) => sum + ((p.cost || 0) * p.stock), 0) || 0
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0

      setStats({
        totalSales,
        totalOrders,
        totalProducts,
        lowStockProducts,
        totalCategories,
        profitMargin,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const fetchRecentOrders = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentOrders(orders || [])
    } catch (error) {
      console.error('Error fetching recent orders:', error)
    }
  }

  const fetchSalesData = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total, created_at')
        .eq('status', 'delivered')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      const salesByDay = orders?.reduce((acc: any, order) => {
        const day = new Date(order.created_at).toLocaleDateString('pt-BR', { weekday: 'short' })
        acc[day] = (acc[day] || 0) + order.total
        return acc
      }, {}) || {}

      const chartData = [
        { name: 'Dom', vendas: salesByDay['dom.'] || 0 },
        { name: 'Seg', vendas: salesByDay['seg.'] || 0 },
        { name: 'Ter', vendas: salesByDay['ter.'] || 0 },
        { name: 'Qua', vendas: salesByDay['qua.'] || 0 },
        { name: 'Qui', vendas: salesByDay['qui.'] || 0 },
        { name: 'Sex', vendas: salesByDay['sex.'] || 0 },
        { name: 'Sáb', vendas: salesByDay['sáb.'] || 0 },
      ]

      setSalesData(chartData)
    } catch (error) {
      console.error('Error fetching sales data:', error)
    }
  }

  const fetchPaymentData = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('payment_method, total')
        .eq('status', 'delivered')

      const paymentBreakdown = orders?.reduce((acc: any, order) => {
        const method = order.payment_method
        if (!acc[method]) {
          acc[method] = { name: method, value: 0, total: 0 }
        }
        acc[method].value += 1
        acc[method].total += order.total
        return acc
      }, {}) || {}

      const chartData = Object.values(paymentBreakdown).map((item: any, index) => ({
        ...item,
        name: item.name === 'dinheiro' ? 'Dinheiro' :
              item.name === 'cartao_debito' ? 'Cartão Débito' :
              item.name === 'cartao_credito' ? 'Cartão Crédito' :
              item.name === 'pix' ? 'PIX' : item.name,
        color: ['#DC2626', '#7C2D12', '#991B1B', '#B91C1C'][index % 4]
      }))

      setPaymentData(chartData)
    } catch (error) {
      console.error('Error fetching payment data:', error)
    }
  }

  const createTestOrder = async () => {
    try {
      // First get an establishment
      const { data: establishment } = await supabase
        .from('establishments')
        .select('id')
        .limit(1)
        .single()

      if (!establishment) {
        toast.error('Nenhum estabelecimento encontrado')
        return
      }

      // Create test order
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          customer_name: 'Cliente Teste',
          customer_phone: '(11) 99999-9999',
          total: 25.50,
          payment_method: 'dinheiro',
          delivery_address: 'Rua Teste, 123 - Centro',
          status: 'pending',
          establishment_id: establishment.id
        })
        .select()
        .single()

      if (error) throw error

      toast.success(`Pedido teste criado! ID: ${order.id.slice(-6)}`)
      
      // Open tracking page
      window.open(`/acompanhar/${order.id}`, '_blank')
      
      // Refresh dashboard
      fetchDashboardData()
      fetchRecentOrders()
    } catch (error: any) {
      toast.error('Erro ao criar pedido teste: ' + error.message)
    }
  }

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'bg-red-600' }: any) => (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
          <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trendValue}% em relação ao mês anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2">Bem-vindo de volta! Aqui está um resumo do seu negócio.</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={createTestOrder} variant="secondary">
            <Package className="w-4 h-4 mr-2" />
            Criar Pedido Teste
          </Button>
          <Button onClick={() => window.open('/', '_blank')}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Menu
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-red-500 transition-colors group bg-gray-900 border-gray-800" onClick={() => navigate('/admin/categories')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-700 transition-colors">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white mb-1">Criar Categoria</h3>
            <p className="text-gray-400 text-sm">Organize seus produtos</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-red-500 transition-colors group bg-gray-900 border-gray-800" onClick={() => navigate('/admin/products')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-700 transition-colors">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white mb-1">Criar Produto</h3>
            <p className="text-gray-400 text-sm">Adicionar ao catálogo</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-red-500 transition-colors group bg-gray-900 border-gray-800" onClick={() => navigate('/admin/kanban')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-700 transition-colors">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white mb-1">Gerenciar Pedidos</h3>
            <p className="text-gray-400 text-sm">Kanban de pedidos</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-red-500 transition-colors group bg-gray-900 border-gray-800" onClick={() => navigate('/admin/products')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-700 transition-colors">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white mb-1">Controle Estoque</h3>
            <p className="text-gray-400 text-sm">Gestão de inventário</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard
          title="Vendas Totais"
          value={`R$ ${stats.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          trend="up"
          trendValue="12"
          color="bg-green-600"
        />
        <StatCard
          title="Pedidos"
          value={stats.totalOrders}
          icon={ShoppingCart}
          trend="up"
          trendValue="8"
          color="bg-blue-600"
        />
        <StatCard
          title="Produtos"
          value={stats.totalProducts}
          icon={Package}
          color="bg-purple-600"
        />
        <StatCard
          title="Categorias"
          value={stats.totalCategories}
          icon={Tag}
          color="bg-indigo-600"
        />
        <StatCard
          title="Estoque Baixo"
          value={stats.lowStockProducts}
          icon={AlertTriangle}
          color="bg-red-600"
        />
        <StatCard
          title="Margem de Lucro"
          value={`${stats.profitMargin.toFixed(1)}%`}
          icon={TrendingUp}
          trend={stats.profitMargin > 30 ? 'up' : 'down'}
          trendValue={stats.profitMargin.toFixed(1)}
          color="bg-yellow-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Vendas da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Line type="monotone" dataKey="vendas" stroke="#DC2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Chart */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Formas de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Pedidos Recentes</CardTitle>
            <Button onClick={fetchRecentOrders} variant="ghost" size="sm">
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Pedido #{order.id.slice(-6)}</p>
                      <p className="text-gray-400 text-sm">Cliente: {order.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-white font-medium">R$ {order.total.toFixed(2)}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                        order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'pending' ? 'Aguardando' :
                         order.status === 'confirmed' ? 'Confirmado' :
                         order.status === 'preparing' ? 'Preparando' :
                         order.status === 'ready' ? 'Pronto' :
                         order.status === 'delivered' ? 'Entregue' :
                         'Cancelado'}
                      </span>
                    </div>
                    <button
                      onClick={() => window.open(`/acompanhar/${order.id}`, '_blank')}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Acompanhar pedido"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Nenhum pedido encontrado</p>
                <Button onClick={createTestOrder} className="mt-4" size="sm">
                  Criar Pedido Teste
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
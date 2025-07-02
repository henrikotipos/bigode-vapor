import React, { useState, useEffect } from 'react'
import { Download, Calendar, DollarSign, TrendingUp, Package, Users, Filter, ArrowLeft, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'

interface SaleReport {
  id: string
  order_id: string
  product_name: string
  customer_name: string
  customer_phone: string | null
  quantity: number
  unit_price: number
  total_price: number
  payment_method: string
  order_status: string
  sale_date: string
  category_name: string | null
}

export function Reports() {
  const navigate = useNavigate()
  const [salesData, setSalesData] = useState<SaleReport[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')

  useEffect(() => {
    fetchSalesData()
  }, [dateFilter])

  const fetchSalesData = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          orders!inner (
            id,
            customer_name,
            customer_phone,
            payment_method,
            status,
            created_at
          ),
          products!inner (
            name,
            categories (
              name
            )
          )
        `)
        .gte('orders.created_at', `${dateFilter.startDate}T00:00:00`)
        .lte('orders.created_at', `${dateFilter.endDate}T23:59:59`)
        .order('orders.created_at', { ascending: false })

      if (error) throw error

      const salesReport: SaleReport[] = (data || []).map(item => ({
        id: item.id,
        order_id: item.orders.id,
        product_name: item.products.name,
        customer_name: item.orders.customer_name,
        customer_phone: item.orders.customer_phone,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        payment_method: item.orders.payment_method,
        order_status: item.orders.status,
        sale_date: item.orders.created_at,
        category_name: item.products.categories?.name || null
      }))

      setSalesData(salesReport)
    } catch (error: any) {
      toast.error('Erro ao carregar relatório de vendas')
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = salesData.filter(sale => {
    const matchesStatus = !statusFilter || sale.order_status === statusFilter
    const matchesPayment = !paymentFilter || sale.payment_method === paymentFilter
    return matchesStatus && matchesPayment
  })

  const exportToExcel = () => {
    try {
      const exportData = filteredSales.map(sale => ({
        'ID do Pedido': sale.order_id.slice(-6),
        'Data da Venda': new Date(sale.sale_date).toLocaleDateString('pt-BR'),
        'Hora da Venda': new Date(sale.sale_date).toLocaleTimeString('pt-BR'),
        'Produto': sale.product_name,
        'Categoria': sale.category_name || 'Sem categoria',
        'Cliente': sale.customer_name,
        'Telefone': sale.customer_phone || 'Não informado',
        'Quantidade': sale.quantity,
        'Preço Unitário': `R$ ${sale.unit_price.toFixed(2)}`,
        'Valor Total': `R$ ${sale.total_price.toFixed(2)}`,
        'Método de Pagamento': sale.payment_method,
        'Status do Pedido': sale.order_status === 'delivered' ? 'Entregue' :
                           sale.order_status === 'cancelled' ? 'Cancelado' :
                           sale.order_status === 'pending' ? 'Pendente' :
                           sale.order_status === 'confirmed' ? 'Confirmado' :
                           sale.order_status === 'preparing' ? 'Preparando' :
                           sale.order_status === 'ready' ? 'Pronto' : sale.order_status
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Vendas')

      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }))
      ws['!cols'] = colWidths

      const fileName = `relatorio-vendas-${dateFilter.startDate}-${dateFilter.endDate}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      toast.success('Relatório exportado com sucesso!')
    } catch (error) {
      toast.error('Erro ao exportar relatório')
    }
  }

  // Calculate summary statistics
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total_price, 0)
  const totalOrders = new Set(filteredSales.map(sale => sale.order_id)).size
  const totalProducts = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0)
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

  // Top products
  const productSales = filteredSales.reduce((acc, sale) => {
    const key = sale.product_name
    if (!acc[key]) {
      acc[key] = { name: key, quantity: 0, revenue: 0 }
    }
    acc[key].quantity += sale.quantity
    acc[key].revenue += sale.total_price
    return acc
  }, {} as Record<string, { name: string; quantity: number; revenue: number }>)

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Payment method breakdown
  const paymentBreakdown = filteredSales.reduce((acc, sale) => {
    if (!acc[sale.payment_method]) {
      acc[sale.payment_method] = { count: 0, total: 0 }
    }
    acc[sale.payment_method].count++
    acc[sale.payment_method].total += sale.total_price
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Carregando relatórios...</div>
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
            <h1 className="text-3xl font-bold text-white">Relatórios de Vendas</h1>
            <p className="text-gray-400 mt-2">Análise detalhada das vendas e performance</p>
          </div>
        </div>
        <Button onClick={exportToExcel} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
          <Download className="w-4 h-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Status do Pedido
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os status</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
                <option value="pending">Pendente</option>
                <option value="confirmed">Confirmado</option>
                <option value="preparing">Preparando</option>
                <option value="ready">Pronto</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Método de Pagamento
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os métodos</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="pix">PIX</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Faturamento Total</p>
                <p className="text-2xl font-bold text-white">
                  R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total de Pedidos</p>
                <p className="text-2xl font-bold text-white">{totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Produtos Vendidos</p>
                <p className="text-2xl font-bold text-white">{totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
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
                  R$ {avgOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products and Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-gray-400 text-sm">{product.quantity} unidades</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">R$ {product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(paymentBreakdown).map(([method, data]) => (
                <div key={method} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">
                      {method === 'dinheiro' ? 'Dinheiro' :
                       method === 'cartao_debito' ? 'Cartão de Débito' :
                       method === 'cartao_credito' ? 'Cartão de Crédito' :
                       method === 'pix' ? 'PIX' : method}
                    </p>
                    <p className="text-gray-400 text-sm">{data.count} pedidos</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">R$ {data.total.toFixed(2)}</p>
                    <p className="text-gray-400 text-sm">
                      {((data.total / totalSales) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sales Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vendas Detalhadas</CardTitle>
            <div className="text-sm text-gray-400">
              {filteredSales.length} registros encontrados
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Qtd
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Valor Unit.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Pagamento
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredSales.slice(0, 100).map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-white">
                      <div>
                        {new Date(sale.sale_date).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {new Date(sale.sale_date).toLocaleTimeString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      #{sale.order_id.slice(-6)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      <div>{sale.product_name}</div>
                      {sale.category_name && (
                        <div className="text-gray-400 text-xs">{sale.category_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      <div>{sale.customer_name}</div>
                      {sale.customer_phone && (
                        <div className="text-gray-400 text-xs">{sale.customer_phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {sale.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      R$ {sale.unit_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-green-400">
                      R$ {sale.total_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {sale.payment_method === 'dinheiro' ? 'Dinheiro' :
                       sale.payment_method === 'cartao_debito' ? 'Cartão Débito' :
                       sale.payment_method === 'cartao_credito' ? 'Cartão Crédito' :
                       sale.payment_method === 'pix' ? 'PIX' : sale.payment_method}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredSales.length > 100 && (
            <div className="p-4 text-center text-gray-400 text-sm border-t border-gray-800">
              Mostrando os primeiros 100 registros de {filteredSales.length} total.
              Use os filtros para refinar os resultados ou exporte para Excel para ver todos.
            </div>
          )}
        </CardContent>
      </Card>

      {filteredSales.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma venda encontrada</h3>
            <p className="text-gray-400">
              Não há vendas no período selecionado ou com os filtros aplicados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
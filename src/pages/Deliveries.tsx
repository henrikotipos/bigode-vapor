import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Truck, User, Phone, DollarSign, TrendingUp, Package, MapPin, Clock, Star, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface DeliveryDriver {
  id: string
  name: string
  phone: string
  vehicle_type: string
  license_plate: string | null
  commission_rate: number
  active: boolean
  created_at: string
}

interface Delivery {
  id: string
  order_id: string
  driver_id: string
  pickup_time: string | null
  delivery_time: string | null
  delivery_fee: number
  driver_commission: number
  status: string
  notes: string | null
  created_at: string
  orders?: {
    customer_name: string
    total: number
    delivery_address: string | null
  }
  delivery_drivers?: {
    name: string
  }
}

const vehicleTypes = [
  { value: 'moto', label: 'Moto' },
  { value: 'carro', label: 'Carro' },
  { value: 'bicicleta', label: 'Bicicleta' },
  { value: 'a_pe', label: 'A pé' },
]

const deliveryStatuses = [
  { value: 'assigned', label: 'Designado' },
  { value: 'picked_up', label: 'Coletado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' },
]

export function Deliveries() {
  const navigate = useNavigate()
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState<DeliveryDriver | null>(null)
  const [activeTab, setActiveTab] = useState<'drivers' | 'deliveries'>('drivers')

  const [driverFormData, setDriverFormData] = useState({
    name: '',
    phone: '',
    vehicle_type: 'moto',
    license_plate: '',
    commission_rate: '0.10',
    active: true,
  })

  useEffect(() => {
    fetchDrivers()
    fetchDeliveries()
  }, [])

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_drivers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDrivers(data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar entregadores')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          orders (
            customer_name,
            total,
            delivery_address
          ),
          delivery_drivers (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDeliveries(data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar entregas')
    }
  }

  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const driverData = {
        name: driverFormData.name,
        phone: driverFormData.phone,
        vehicle_type: driverFormData.vehicle_type,
        license_plate: driverFormData.license_plate || null,
        commission_rate: parseFloat(driverFormData.commission_rate),
        active: driverFormData.active,
      }

      if (editingDriver) {
        const { error } = await supabase
          .from('delivery_drivers')
          .update(driverData)
          .eq('id', editingDriver.id)

        if (error) throw error
        toast.success('Entregador atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('delivery_drivers')
          .insert(driverData)

        if (error) throw error
        toast.success('Entregador cadastrado com sucesso!')
      }

      setShowDriverModal(false)
      setEditingDriver(null)
      resetDriverForm()
      fetchDrivers()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditDriver = (driver: DeliveryDriver) => {
    setEditingDriver(driver)
    setDriverFormData({
      name: driver.name,
      phone: driver.phone,
      vehicle_type: driver.vehicle_type,
      license_plate: driver.license_plate || '',
      commission_rate: driver.commission_rate.toString(),
      active: driver.active,
    })
    setShowDriverModal(true)
  }

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm('Tem certeza que deseja excluir este entregador?')) return

    try {
      const { error } = await supabase
        .from('delivery_drivers')
        .delete()
        .eq('id', driverId)

      if (error) throw error
      toast.success('Entregador excluído com sucesso!')
      fetchDrivers()
    } catch (error: any) {
      toast.error('Erro ao excluir entregador')
    }
  }

  const resetDriverForm = () => {
    setDriverFormData({
      name: '',
      phone: '',
      vehicle_type: 'moto',
      license_plate: '',
      commission_rate: '0.10',
      active: true,
    })
  }

  const getDriverStats = (driverId: string) => {
    const driverDeliveries = deliveries.filter(d => d.driver_id === driverId && d.status === 'delivered')
    const totalDeliveries = driverDeliveries.length
    const totalEarnings = driverDeliveries.reduce((sum, d) => sum + d.driver_commission, 0)
    const avgRating = 4.5 // Mock rating - you can implement a real rating system

    return { totalDeliveries, totalEarnings, avgRating }
  }

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm)
  )

  const filteredDeliveries = deliveries.filter(delivery =>
    delivery.orders?.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.delivery_drivers?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate overall stats
  const totalDrivers = drivers.length
  const activeDrivers = drivers.filter(d => d.active).length
  const totalDeliveries = deliveries.filter(d => d.status === 'delivered').length
  const totalCommissions = deliveries
    .filter(d => d.status === 'delivered')
    .reduce((sum, d) => sum + d.driver_commission, 0)

  if (loading && drivers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Carregando entregadores...</div>
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
            <h1 className="text-3xl font-bold text-white">Sistema de Entregas</h1>
            <p className="text-gray-400 mt-2">Gerencie entregadores e acompanhe entregas</p>
          </div>
        </div>
        <Button onClick={() => setShowDriverModal(true)} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
          <Plus className="w-4 h-4 mr-2" />
          Novo Entregador
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total de Entregadores</p>
                <p className="text-2xl font-bold text-white">{totalDrivers}</p>
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
                <p className="text-sm font-medium text-gray-400">Entregadores Ativos</p>
                <p className="text-2xl font-bold text-white">{activeDrivers}</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Entregas Realizadas</p>
                <p className="text-2xl font-bold text-white">{totalDeliveries}</p>
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
                <p className="text-sm font-medium text-gray-400">Total Comissões</p>
                <p className="text-2xl font-bold text-white">
                  R$ {totalCommissions.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('drivers')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'drivers'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Entregadores
        </button>
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'deliveries'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Entregas
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={activeTab === 'drivers' ? "Buscar entregadores..." : "Buscar entregas..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'drivers' ? (
        /* Drivers List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => {
            const stats = getDriverStats(driver.id)
            
            return (
              <Card key={driver.id} className="hover:border-blue-500 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        driver.active ? 'bg-green-600' : 'bg-gray-600'
                      }`}>
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{driver.name}</h3>
                        <p className="text-gray-400 text-sm">{driver.phone}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      driver.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {driver.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Veículo:</span>
                      <span className="text-white">
                        {vehicleTypes.find(v => v.value === driver.vehicle_type)?.label}
                      </span>
                    </div>
                    
                    {driver.license_plate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Placa:</span>
                        <span className="text-white">{driver.license_plate}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Comissão:</span>
                      <span className="text-white">{(driver.commission_rate * 100).toFixed(1)}%</span>
                    </div>

                    {/* Stats */}
                    <div className="border-t border-gray-700 pt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Entregas:</span>
                        <span className="text-white font-medium">{stats.totalDeliveries}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Ganhos:</span>
                        <span className="text-green-400 font-medium">R$ {stats.totalEarnings.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Avaliação:</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-white font-medium">{stats.avgRating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleEditDriver(driver)}
                      className="flex-1 p-2 text-blue-500 hover:text-blue-400 transition-colors bg-gray-800 hover:bg-gray-700 rounded-lg"
                      title="Editar entregador"
                    >
                      <Edit className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => handleDeleteDriver(driver.id)}
                      className="flex-1 p-2 text-red-500 hover:text-red-400 transition-colors bg-gray-800 hover:bg-red-900/20 rounded-lg"
                      title="Excluir entregador"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Deliveries List */
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-800">
              {filteredDeliveries.map((delivery) => (
                <div key={delivery.id} className="p-6 hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          Entrega #{delivery.id.slice(-6)}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          delivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          delivery.status === 'picked_up' ? 'bg-blue-100 text-blue-800' :
                          delivery.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {deliveryStatuses.find(s => s.value === delivery.status)?.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Cliente</p>
                          <p className="text-white font-medium">{delivery.orders?.customer_name}</p>
                          {delivery.orders?.delivery_address && (
                            <p className="text-gray-400 text-xs mt-1">{delivery.orders.delivery_address}</p>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-gray-400">Entregador</p>
                          <p className="text-white font-medium">{delivery.delivery_drivers?.name}</p>
                          <p className="text-gray-400">Taxa: R$ {delivery.delivery_fee.toFixed(2)}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-400">Comissão</p>
                          <p className="text-green-400 font-bold">R$ {delivery.driver_commission.toFixed(2)}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(delivery.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {delivery.notes && (
                        <div className="mt-3">
                          <p className="text-gray-400 text-sm">Observações</p>
                          <p className="text-white text-sm">{delivery.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <div className="text-right">
                        <p className="text-white font-bold text-lg">
                          R$ {delivery.orders?.total.toFixed(2)}
                        </p>
                        <p className="text-gray-400 text-sm">Valor do pedido</p>
                      </div>
                      
                      {delivery.pickup_time && (
                        <div className="text-right text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Coletado: {new Date(delivery.pickup_time).toLocaleTimeString('pt-BR')}</span>
                          </div>
                        </div>
                      )}
                      
                      {delivery.delivery_time && (
                        <div className="text-right text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>Entregue: {new Date(delivery.delivery_time).toLocaleTimeString('pt-BR')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty States */}
      {activeTab === 'drivers' && filteredDrivers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {searchTerm ? 'Nenhum entregador encontrado' : 'Nenhum entregador cadastrado'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? 'Tente buscar por outro termo.' 
                : 'Cadastre seu primeiro entregador para começar as entregas.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowDriverModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Entregador
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'deliveries' && filteredDeliveries.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {searchTerm ? 'Nenhuma entrega encontrada' : 'Nenhuma entrega registrada'}
            </h3>
            <p className="text-gray-400">
              {searchTerm 
                ? 'Tente buscar por outro termo.' 
                : 'As entregas aparecerão aqui quando os pedidos forem designados aos entregadores.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Driver Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                {editingDriver ? 'Editar Entregador' : 'Novo Entregador'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDriverSubmit} className="space-y-4">
                <Input
                  label="Nome completo *"
                  value={driverFormData.name}
                  onChange={(e) => setDriverFormData({ ...driverFormData, name: e.target.value })}
                  placeholder="Nome do entregador"
                  required
                />
                
                <Input
                  label="Telefone *"
                  value={driverFormData.phone}
                  onChange={(e) => setDriverFormData({ ...driverFormData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tipo de Veículo *
                  </label>
                  <select
                    value={driverFormData.vehicle_type}
                    onChange={(e) => setDriverFormData({ ...driverFormData, vehicle_type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {vehicleTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Placa do Veículo"
                  value={driverFormData.license_plate}
                  onChange={(e) => setDriverFormData({ ...driverFormData, license_plate: e.target.value })}
                  placeholder="ABC-1234"
                />

                <Input
                  label="Taxa de Comissão *"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={driverFormData.commission_rate}
                  onChange={(e) => setDriverFormData({ ...driverFormData, commission_rate: e.target.value })}
                  placeholder="0.10 (10%)"
                  required
                />

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={driverFormData.active}
                    onChange={(e) => setDriverFormData({ ...driverFormData, active: e.target.checked })}
                    className="rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="active" className="text-sm text-gray-300">
                    Entregador ativo
                  </label>
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowDriverModal(false)
                      setEditingDriver(null)
                      resetDriverForm()
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    loading={loading} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {editingDriver ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
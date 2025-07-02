import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye, Package, ArrowLeft, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ImageUpload } from '../components/ui/ImageUpload'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  cost: number | null
  stock: number
  image_url: string | null
  category_id: string
  active: boolean
  categories?: { name: string }
}

export function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    category_id: '',
    image_url: '',
    active: true,
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar categorias')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get establishment ID
      const { data: establishment } = await supabase
        .from('establishments')
        .select('id')
        .limit(1)
        .single()

      if (!establishment) {
        toast.error('Nenhum estabelecimento encontrado')
        return
      }

      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : null,
        stock: parseInt(formData.stock),
        category_id: formData.category_id,
        image_url: formData.image_url || null,
        active: formData.active,
        establishment_id: establishment.id,
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
        toast.success('Produto atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData)

        if (error) throw error
        toast.success('Produto criado com sucesso!')
      }

      setShowModal(false)
      setEditingProduct(null)
      resetForm()
      fetchProducts()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      cost: product.cost?.toString() || '',
      stock: product.stock.toString(),
      category_id: product.category_id,
      image_url: product.image_url || '',
      active: product.active,
    })
    setShowModal(true)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      // Get product to delete image if exists
      const product = products.find(p => p.id === productId)
      
      // Delete product from database
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      // Delete image from storage if exists
      if (product?.image_url) {
        try {
          const url = new URL(product.image_url)
          const filePath = url.pathname.split('/').slice(-2).join('/')
          
          await supabase.storage
            .from('images')
            .remove([filePath])
        } catch (imageError) {
          console.error('Error deleting image:', imageError)
          // Don't fail the whole operation if image deletion fails
        }
      }

      toast.success('Produto excluído com sucesso!')
      fetchProducts()
    } catch (error: any) {
      toast.error('Erro ao excluir produto')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      cost: '',
      stock: '',
      category_id: '',
      image_url: '',
      active: true,
    })
  }

  const calculateProfitMargin = (price: number, cost: number | null) => {
    if (!cost || cost === 0) return 0
    return ((price - cost) / price) * 100
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Sem estoque', color: 'text-red-500' }
    if (stock < 10) return { label: 'Estoque baixo', color: 'text-yellow-500' }
    return { label: 'Em estoque', color: 'text-green-500' }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate stats
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.active).length
  const lowStockProducts = products.filter(p => p.stock < 10).length
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Carregando produtos...</div>
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
            <h1 className="text-3xl font-bold text-white">Produtos</h1>
            <p className="text-gray-400 mt-2">Gerencie seu catálogo de produtos e controle de estoque</p>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total de Produtos</p>
                <p className="text-2xl font-bold text-white">{totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Produtos Ativos</p>
                <p className="text-2xl font-bold text-white">{activeProducts}</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Estoque Baixo</p>
                <p className="text-2xl font-bold text-white">{lowStockProducts}</p>
              </div>
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Valor do Estoque</p>
                <p className="text-2xl font-bold text-white">
                  R$ {totalInventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product.stock)
          const profitMargin = calculateProfitMargin(product.price, product.cost)
          
          return (
            <Card key={product.id} className="overflow-hidden hover:border-green-500 transition-colors">
              <div className="aspect-square bg-gray-800 flex items-center justify-center relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Package className="w-16 h-16 text-gray-500" />
                )}
                
                {/* Status badges */}
                <div className="absolute top-2 left-2 space-y-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.active ? 'Ativo' : 'Inativo'}
                  </span>
                  
                  {product.stock < 10 && (
                    <span className="block bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                      Estoque baixo
                    </span>
                  )}
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-white truncate">{product.name}</h3>
                    <p className="text-gray-400 text-sm">{product.categories?.name}</p>
                    {product.description && (
                      <p className="text-gray-400 text-xs line-clamp-2 mt-1">{product.description}</p>
                    )}
                  </div>
                  
                  {/* Pricing and Stock Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">
                        R$ {product.price.toFixed(2)}
                      </span>
                      {product.cost && (
                        <span className="text-sm text-gray-400">
                          Custo: R$ {product.cost.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    {product.cost && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Margem:</span>
                        <span className={`font-medium ${
                          profitMargin > 30 ? 'text-green-500' : 
                          profitMargin > 15 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {profitMargin.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Estoque:</span>
                      <span className={`font-medium ${stockStatus.color}`}>
                        {product.stock} unidades
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 rounded-lg"
                        title="Editar produto"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors bg-gray-800 hover:bg-red-900/20 rounded-lg"
                        title="Excluir produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Valor total</p>
                      <p className="text-sm font-bold text-white">
                        R$ {(product.price * product.stock).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? 'Tente buscar por outro termo.' 
                : 'Crie seu primeiro produto para começar a vender.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowModal(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Produto
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                    Informações Básicas
                  </h3>
                  
                  <Input
                    label="Nome do Produto *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Pizza Margherita, Hambúrguer Clássico..."
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Descrição detalhada do produto..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Categoria *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <p className="text-yellow-400 text-sm mt-1">
                        Nenhuma categoria encontrada. 
                        <button
                          type="button"
                          onClick={() => navigate('/admin/categories')}
                          className="text-blue-400 hover:text-blue-300 ml-1 underline"
                        >
                          Criar categoria primeiro
                        </button>
                      </p>
                    )}
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                    Imagem do Produto
                  </h3>
                  
                  <ImageUpload
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    onRemove={() => setFormData({ ...formData, image_url: '' })}
                    disabled={loading}
                  />
                </div>

                {/* Pricing and Cost */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                    Preços e Custos
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Preço de Venda *"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                    <Input
                      label="Custo do Produto"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Profit Margin Calculation */}
                  {formData.price && formData.cost && (
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Margem de Lucro:</span>
                        <span className={`font-bold ${
                          calculateProfitMargin(parseFloat(formData.price), parseFloat(formData.cost)) > 30 
                            ? 'text-green-500' 
                            : calculateProfitMargin(parseFloat(formData.price), parseFloat(formData.cost)) > 15
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}>
                          {calculateProfitMargin(parseFloat(formData.price), parseFloat(formData.cost)).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-gray-400 text-sm">Lucro por unidade:</span>
                        <span className="text-white text-sm">
                          R$ {(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stock and Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                    Estoque e Configurações
                  </h3>
                  
                  <Input
                    label="Quantidade em Estoque *"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                    required
                  />

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="rounded border-gray-700 bg-gray-800 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="active" className="text-sm text-gray-300">
                      Produto ativo (visível no cardápio)
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowModal(false)
                      setEditingProduct(null)
                      resetForm()
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    loading={loading} 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={categories.length === 0}
                  >
                    {editingProduct ? 'Atualizar' : 'Criar'} Produto
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
import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Tag, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
}

export function Categories() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCategories(data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
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

      const categoryData = {
        name: formData.name,
        description: formData.description || null,
        establishment_id: establishment.id,
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id)

        if (error) throw error
        toast.success('Categoria atualizada com sucesso!')
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData)

        if (error) throw error
        toast.success('Categoria criada com sucesso!')
      }

      setShowModal(false)
      setEditingCategory(null)
      resetForm()
      fetchCategories()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Todos os produtos desta categoria também serão afetados.')) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error
      toast.success('Categoria excluída com sucesso!')
      fetchCategories()
    } catch (error: any) {
      toast.error('Erro ao excluir categoria')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    })
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Carregando categorias...</div>
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
            <h1 className="text-3xl font-bold text-white">Categorias</h1>
            <p className="text-gray-400 mt-2">Organize seus produtos por categorias</p>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total de Categorias</p>
                <p className="text-2xl font-bold text-white">{categories.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Categorias com Descrição</p>
                <p className="text-2xl font-bold text-white">
                  {categories.filter(c => c.description).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <Edit className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Categoria Mais Recente</p>
                <p className="text-lg font-bold text-white">
                  {categories.length > 0 ? categories[0].name : 'Nenhuma'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
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
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-800">
            {filteredCategories.map((category) => (
              <div key={category.id} className="p-6 hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Tag className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                      {category.description && (
                        <p className="text-gray-400 mt-1">{category.description}</p>
                      )}
                      <p className="text-gray-500 text-sm mt-2">
                        Criado em: {new Date(category.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 rounded-lg"
                      title="Editar categoria"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors bg-gray-800 hover:bg-red-900/20 rounded-lg"
                      title="Excluir categoria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredCategories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Tag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? 'Tente buscar por outro termo.' 
                : 'Crie sua primeira categoria para organizar seus produtos.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Categoria
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nome da Categoria *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Pizzas, Bebidas, Sobremesas..."
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
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descrição opcional da categoria..."
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowModal(false)
                      setEditingCategory(null)
                      resetForm()
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
                    {editingCategory ? 'Atualizar' : 'Criar'}
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
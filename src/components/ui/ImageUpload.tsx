import React, { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove: () => void
  disabled?: boolean
  className?: string
}

export function ImageUpload({ value, onChange, onRemove, disabled, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    setUploading(true)

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `products/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      onChange(publicUrl)
      toast.success('Imagem enviada com sucesso!')

    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error('Erro ao enviar imagem: ' + error.message)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (!value) return

    try {
      // Extract file path from URL
      const url = new URL(value)
      const filePath = url.pathname.split('/').slice(-2).join('/')

      // Delete from Supabase Storage
      const { error } = await supabase.storage
        .from('images')
        .remove([filePath])

      if (error) {
        console.error('Error deleting image:', error)
        // Don't show error to user as the image might already be deleted
      }

      onRemove()
      toast.success('Imagem removida com sucesso!')

    } catch (error: any) {
      console.error('Error removing image:', error)
      // Still remove from form even if storage deletion fails
      onRemove()
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-300">
        Imagem do Produto
      </label>
      
      <div className="flex items-start space-x-4">
        {/* Image Preview */}
        <div className="flex-shrink-0">
          {value ? (
            <div className="relative group">
              <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                <img
                  src={value}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || uploading}
                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-lg bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-500" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-600 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                {value ? 'Alterar Imagem' : 'Enviar Imagem'}
              </>
            )}
          </button>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Formatos aceitos: JPG, PNG, GIF, WebP</p>
            <p>• Tamanho máximo: 5MB</p>
            <p>• Recomendado: 800x800px (quadrada)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
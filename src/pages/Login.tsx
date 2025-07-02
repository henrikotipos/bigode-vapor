import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'

export function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password, name)
      }
      navigate('/admin/dashboard')
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-lg">
                <img
                  src="https://media.discordapp.net/attachments/1355737047943348337/1388967164580724857/BIGODEVAPOR-LOGO-SEM-FUNDO.png?ex=6862e7f9&is=68619679&hm=40a2edabedd9bd1773d50b4a7926fe67539dbacb265570538e20f4195dfa2807&=&format=webp&quality=lossless&width=968&height=968"
                  alt="Logo"
                  className="w-full h-full object-contain p-2"
                />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Bigode Vapor</CardTitle>
            <p className="text-gray-400 text-sm mt-2">Painel Administrativo</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <Input
                  label="Nome"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Seu nome completo"
                />
              )}
              
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
              />
              
              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Sua senha"
              />

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                loading={loading}
              >
                {isLogin ? 'Entrar' : 'Criar Conta'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-red-500 hover:text-red-400 text-sm transition-colors"
              >
                {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800 text-center">
              <a
                href="/"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                ← Voltar ao Menu Principal
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
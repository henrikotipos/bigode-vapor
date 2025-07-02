import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Truck, 
  Settings, 
  LogOut,
  PieChart,
  MessageSquare,
  Tag,
  Kanban,
  X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Produtos', href: '/admin/products', icon: Package },
  { name: 'Categorias', href: '/admin/categories', icon: Tag },
  { name: 'Pedidos', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Kanban', href: '/admin/kanban', icon: Kanban },
  { name: 'Entregas', href: '/admin/deliveries', icon: Truck },
  { name: 'Usuários', href: '/admin/users', icon: Users },
  { name: 'Relatórios', href: '/admin/reports', icon: PieChart },
  { name: 'WhatsApp', href: '/admin/whatsapp', icon: MessageSquare },
  { name: 'Configurações', href: '/admin/settings', icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const { signOut } = useAuth()

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-gray-900 border-r border-gray-800">
        <SidebarContent location={location} signOut={signOut} />
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <img
                src="https://media.discordapp.net/attachments/1355737047943348337/1388967164580724857/BIGODEVAPOR-LOGO-SEM-FUNDO.png?ex=6862e7f9&is=68619679&hm=40a2edabedd9bd1773d50b4a7926fe67539dbacb265570538e20f4195dfa2807&=&format=webp&quality=lossless&width=968&height=968"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">BIGODE SYSTEM</h1>
              <p className="text-xs text-gray-400">Painel Admin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <SidebarContent location={location} signOut={signOut} onItemClick={onClose} />
      </div>
    </>
  )
}

interface SidebarContentProps {
  location: any
  signOut: () => void
  onItemClick?: () => void
}

function SidebarContent({ location, signOut, onItemClick }: SidebarContentProps) {
  return (
    <>
      {/* Logo - Only for Desktop */}
      <div className="hidden lg:flex items-center px-6 py-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img
              src="https://media.discordapp.net/attachments/1355737047943348337/1388967164580724857/BIGODEVAPOR-LOGO-SEM-FUNDO.png?ex=6862e7f9&is=68619679&hm=40a2edabedd9bd1773d50b4a7926fe67539dbacb265570538e20f4195dfa2807&=&format=webp&quality=lossless&width=968&height=968"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">BIGODE SYSTEM</h1>
            <p className="text-xs text-gray-400">Painel Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onItemClick}
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Quick Links */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onItemClick}
            className="flex items-center w-full px-3 py-3 text-sm font-medium text-gray-300 rounded-lg hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Package className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate">Ver Menu Público</span>
          </a>
          <button
            onClick={() => {
              signOut()
              onItemClick?.()
            }}
            className="flex items-center w-full px-3 py-3 text-sm font-medium text-gray-300 rounded-lg hover:text-white hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate">Sair</span>
          </button>
        </div>
      </div>
    </>
  )
}
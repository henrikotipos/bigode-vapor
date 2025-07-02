import React, { useState } from 'react'
import { Bell, Search, User, Menu, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { userProfile } = useAuth()
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile menu button */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar produtos, pedidos..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Mobile Search Toggle */}
          <button 
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            {showMobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-sm hidden md:block">
              <p className="text-white font-medium">{userProfile?.name || 'Usuário'}</p>
              <p className="text-gray-400">{userProfile?.role || 'Admin'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div className="md:hidden mt-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar produtos, pedidos..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
        </div>
      )}
    </header>
  )
}
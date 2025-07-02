import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Phone,
  Users,
  Send,
  Settings,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

export function WhatsApp() {
  const [isConnected, setIsConnected] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessName, setBusinessName] = useState('Bigode System');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoReplyMessage, setAutoReplyMessage] = useState(
    'Olá! Obrigado por entrar em contato. Em breve retornaremos sua mensagem.'
  );

  const handleConnect = () => {
    if (!phoneNumber) {
      toast.error('Por favor, insira o número do WhatsApp Business');
      return;
    }
    setShowQRCode(true);
    toast.success('Escaneie o QR Code no WhatsApp Web para conectar');
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setShowQRCode(false);
    toast.success('WhatsApp desconectado');
  };

  const refreshConnection = () => {
    window.location.reload();
  };

  const openWhatsAppWeb = () => {
    window.open('https://web.whatsapp.com', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">WhatsApp Business</h1>
          <p className="text-gray-400 mt-2">
            Gerencie suas conversas e automatize atendimento
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={refreshConnection} variant="ghost">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={openWhatsAppWeb} variant="secondary">
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir WhatsApp Web
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  Status da Conexão
                </p>
                <p
                  className={`text-lg font-bold ${
                    isConnected ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isConnected ? 'bg-green-600' : 'bg-red-600'
                }`}
              >
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  Mensagens Hoje
                </p>
                <p className="text-2xl font-bold text-white">47</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  Contatos Ativos
                </p>
                <p className="text-2xl font-bold text-white">23</p>
              </div>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Panel */}
      {!isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Configuração do WhatsApp Business
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Número do WhatsApp Business"
                placeholder="(11) 99999-9999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Input
                label="Nome do Negócio"
                placeholder="Atlas System"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoReply"
                  checked={autoReplyEnabled}
                  onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="autoReply" className="text-sm text-gray-300">
                  Ativar resposta automática
                </label>
              </div>

              {autoReplyEnabled && (
                <textarea
                  value={autoReplyMessage}
                  onChange={(e) => setAutoReplyMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Mensagem de resposta automática..."
                />
              )}
            </div>

            <Button onClick={handleConnect} className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Conectar WhatsApp
            </Button>
          </CardContent>
        </Card>
      )}

      {/* WhatsApp Web Integration */}
      <Card className="min-h-[600px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              WhatsApp Web
            </CardTitle>
            {isConnected && (
              <Button onClick={handleDisconnect} variant="danger" size="sm">
                Desconectar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full h-[600px] bg-gray-800 rounded-b-lg overflow-hidden">
            {showQRCode || isConnected ? (
              <iframe
                src="https://web.whatsapp.com"
                className="w-full h-full border-0"
                title="WhatsApp Web"
                allow="camera; microphone; geolocation"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                onLoad={() => {
                  // Simulate connection after iframe loads
                  setTimeout(() => {
                    setIsConnected(true);
                    setShowQRCode(false);
                    toast.success('WhatsApp conectado com sucesso!');
                  }, 3000);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    WhatsApp Web não conectado
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Configure e conecte seu WhatsApp Business para começar a
                    usar
                  </p>
                  <Button onClick={() => setShowQRCode(true)}>
                    Conectar Agora
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-red-500 transition-colors">
          <CardContent className="p-4 text-center">
            <Send className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-semibold text-white">Enviar Cardápio</h3>
            <p className="text-gray-400 text-sm">Compartilhar produtos</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-red-500 transition-colors">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold text-white">Lista de Contatos</h3>
            <p className="text-gray-400 text-sm">Gerenciar clientes</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-red-500 transition-colors">
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold text-white">Mensagens em Massa</h3>
            <p className="text-gray-400 text-sm">Campanhas promocionais</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-red-500 transition-colors">
          <CardContent className="p-4 text-center">
            <Settings className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-semibold text-white">Configurações</h3>
            <p className="text-gray-400 text-sm">Personalizar bot</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Mensagens Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: 'João Silva',
                message: 'Gostaria de fazer um pedido',
                time: '14:30',
                unread: true,
              },
              {
                name: 'Maria Santos',
                message: 'Qual o horário de funcionamento?',
                time: '13:45',
                unread: false,
              },
              {
                name: 'Pedro Costa',
                message: 'Obrigado pelo atendimento!',
                time: '12:20',
                unread: false,
              },
              {
                name: 'Ana Oliveira',
                message: 'Vocês fazem entrega?',
                time: '11:15',
                unread: true,
              },
            ].map((contact, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {contact.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{contact.name}</p>
                    <p className="text-gray-400 text-sm truncate max-w-xs">
                      {contact.message}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">{contact.time}</p>
                  {contact.unread && (
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1 ml-auto"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

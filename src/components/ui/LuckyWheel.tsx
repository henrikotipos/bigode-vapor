import React, { useState, useEffect } from 'react';
import { X, Gift, Percent, Star, Zap, Crown, Trophy, Info, Shield, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface LuckyWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onWin: (discount: number, couponCode: string) => void;
}

interface WheelSegment {
  id: number;
  label: string;
  color: string;
  icon: React.ComponentType<any>;
  value: number;
  type: 'discount' | 'product';
  productName?: string;
  probability: number; // 0-100, but we'll always give 5%
}

const wheelSegments: WheelSegment[] = [
  {
    id: 1,
    label: '5% OFF',
    color: '#DC2626',
    icon: Percent,
    value: 5,
    type: 'discount',
    probability: 100,
  },
  {
    id: 2,
    label: 'Pod gratuito',
    color: '#7C2D12',
    icon: Gift,
    value: 0,
    type: 'product',
    productName: 'Pizza Margherita',
    probability: 0,
  },
  {
    id: 3,
    label: '10% OFF',
    color: '#991B1B',
    icon: Star,
    value: 10,
    type: 'discount',
    probability: 0,
  },
  {
    id: 4,
    label: '20% OFF',
    color: '#B91C1C',
    icon: Crown,
    value: 0,
    type: 'product',
    productName: 'X-Burger',
    probability: 0,
  },
  {
    id: 5,
    label: '25% OFF',
    color: '#DC2626',
    icon: Zap,
    value: 15,
    type: 'discount',
    probability: 0,
  },
  {
    id: 6,
    label: 'Entrega gratuita',
    color: '#7C2D12',
    icon: Trophy,
    value: 0,
    type: 'product',
    productName: 'Coca-Cola',
    probability: 0,
  },
  {
    id: 7,
    label: '30% OFF',
    color: '#991B1B',
    icon: Star,
    value: 20,
    type: 'discount',
    probability: 0,
  },
  {
    id: 8,
    label: '50% OFF',
    color: '#B91C1C',
    icon: Gift,
    value: 0,
    type: 'product',
    productName: 'Pudim de Leite',
    probability: 0,
  },
];

export function LuckyWheel({ isOpen, onClose, onWin }: LuckyWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [canSpin, setCanSpin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userIP, setUserIP] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [winningSegment, setWinningSegment] = useState<WheelSegment | null>(
    null
  );
  const [spinPhase, setSpinPhase] = useState<
    'idle' | 'spinning' | 'slowing' | 'stopped'
  >('idle');
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkSpinEligibility();
    }
  }, [isOpen]);

  const getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting IP:', error);
      return 'unknown';
    }
  };

  const checkSpinEligibility = async () => {
    try {
      setLoading(true);
      const ip = await getUserIP();
      setUserIP(ip);

      // Check if user already spun today
      const today = new Date().toISOString().split('T')[0];

      const { data: existingSpins, error } = await supabase
        .from('wheel_spins')
        .select('*')
        .eq('user_ip', ip)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (error) {
        throw error;
      }

      setCanSpin(existingSpins.length === 0);
    } catch (error: any) {
      console.error('Error checking spin eligibility:', error);
      toast.error('Erro ao verificar elegibilidade');
    } finally {
      setLoading(false);
    }
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'BIGODE';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const spinWheel = async () => {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);
    setSpinPhase('spinning');

    // Always select the 5% discount segment (index 0)
    const winningSegmentIndex = 0;
    const winningSegmentData = wheelSegments[winningSegmentIndex];

    // Calculate precise angles
    const segmentAngle = 360 / wheelSegments.length; // 45 degrees per segment
    const segmentCenter = winningSegmentIndex * segmentAngle + segmentAngle / 2; // Center of winning segment

    // Random direction (clockwise or counterclockwise)
    const isClockwise = Math.random() > 0.5;

    // Random number of full rotations (8-12 for good suspense)
    const fullRotations = 8 + Math.random() * 4;

    // Calculate final position
    // The pointer is at the top (0 degrees), so we need to align the segment center with 0
    const targetAngle = 360 - segmentCenter; // Invert because we want the segment to align with the pointer

    // Add some randomness within the segment (±15 degrees from center for more precision)
    const randomOffset = (Math.random() - 0.5) * 30;
    const finalTargetAngle = targetAngle + randomOffset;

    // Calculate total rotation
    let totalRotation;
    if (isClockwise) {
      totalRotation = rotation + fullRotations * 360 + finalTargetAngle;
    } else {
      totalRotation = rotation - fullRotations * 360 - finalTargetAngle;
    }

    // Ensure we don't have negative rotations for CSS
    while (totalRotation < 0) {
      totalRotation += 360;
    }

    // Generate coupon code
    const newCouponCode = generateCouponCode();
    setCouponCode(newCouponCode);

    // Apply smooth rotation animation
    const wheelElement = document.getElementById('lucky-wheel');
    if (wheelElement) {
      // Phase 1: Fast spinning with acceleration (4 seconds)
      wheelElement.style.transition =
        'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      wheelElement.style.transform = `rotate(${totalRotation - 90}deg)`; // Stop a bit before final position

      setTimeout(() => {
        setSpinPhase('slowing');
        // Phase 2: Slow down to exact position with deceleration (3 seconds)
        wheelElement.style.transition =
          'transform 3s cubic-bezier(0.23, 1, 0.32, 1)';
        wheelElement.style.transform = `rotate(${totalRotation}deg)`;

        setTimeout(() => {
          setSpinPhase('stopped');

          // Phase 3: Final micro-adjustment for perfect alignment (0.5 seconds)
          setTimeout(async () => {
            // Small bounce effect for final stop
            wheelElement.style.transition =
              'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            wheelElement.style.transform = `rotate(${totalRotation + 5}deg)`;

            setTimeout(() => {
              wheelElement.style.transition = 'transform 0.2s ease-out';
              wheelElement.style.transform = `rotate(${totalRotation}deg)`;

              setTimeout(async () => {
                setIsSpinning(false);
                setWinningSegment(winningSegmentData);
                setShowResult(true);
                setCanSpin(false);
                setRotation(totalRotation % 360); // Update rotation state

                // Record the spin in database
                try {
                  const { error } = await supabase.from('wheel_spins').insert({
                    user_ip: userIP,
                    winning_segment: winningSegmentData.label,
                    discount_value: winningSegmentData.value,
                    coupon_code: newCouponCode,
                    created_at: new Date().toISOString(),
                  });

                  if (error) throw error;

                  // Call parent callback with discount info
                  onWin(winningSegmentData.value, newCouponCode);

                  // Show celebration toast
                  toast.success(
                    `🎉 Parabéns! Você ganhou ${winningSegmentData.label}!`,
                    {
                      duration: 5000,
                      style: {
                        background: '#DC2626',
                        color: '#FFFFFF',
                        fontSize: '16px',
                        fontWeight: 'bold',
                      },
                    }
                  );
                } catch (error: any) {
                  console.error('Error recording spin:', error);
                  toast.error('Erro ao processar o giro');
                }
              }, 200);
            }, 300);
          }, 500);
        }, 3000);
      }, 4000);
    }
  };

  const handleClose = () => {
    setShowResult(false);
    setWinningSegment(null);
    setSpinPhase('idle');
    setShowInfo(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-gray-900 border-red-600 shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-white flex items-center">
              <Target className="w-6 h-6 mr-2 text-red-600" />
              Bigode da Sorte
            </CardTitle>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 rounded-lg"
                title="Saiba mais"
              >
                <Info className="w-5 h-5" />
              </button>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
                disabled={isSpinning}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <p className="text-gray-400">
            Gire a roleta e ganhe descontos incríveis! 1 giro por dia.
          </p>
        </CardHeader>

        <CardContent className="p-8">
          {/* Info Panel */}
          {showInfo && (
            <div className="mb-6 p-6 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-blue-500" />
                Como Funciona o Bigode da Sorte
              </h3>
              
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">1</div>
                  <div>
                    <h4 className="font-semibold text-white">Gire uma vez por dia</h4>
                    <p className="text-sm">Cada pessoa pode girar a roleta apenas uma vez por dia.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">2</div>
                  <div>
                    <h4 className="font-semibold text-white">Prêmios garantidos</h4>
                    <p className="text-sm">Todos os giros são premiados! Você sempre ganha algum desconto.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">3</div>
                  <div>
                    <h4 className="font-semibold text-white">Resgate automático</h4>
                    <p className="text-sm">Seu desconto é aplicado automaticamente no carrinho. Não precisa digitar código!</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">4</div>
                  <div>
                    <h4 className="font-semibold text-white">Válido por 24 horas</h4>
                    <p className="text-sm">Use seu desconto em qualquer pedido dentro de 24 horas.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-green-900/20 border border-green-600 rounded-lg">
                <div className="flex items-center space-x-2 text-green-400">
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold">100% Seguro e Confiável</span>
                </div>
                <p className="text-green-300 text-sm mt-1">
                  Sistema justo e transparente. Todos os prêmios são honrados automaticamente.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white">Verificando elegibilidade...</p>
            </div>
          ) : !canSpin && !showResult ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Você já girou hoje!
              </h3>
              <p className="text-gray-400 mb-6">
                Volte amanhã para uma nova chance de ganhar descontos incríveis!
              </p>
              <Button
                onClick={handleClose}
                className="bg-red-600 hover:bg-red-700"
              >
                Entendi
              </Button>
            </div>
          ) : showResult && winningSegment ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <winningSegment.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2 animate-pulse">
                🎉 Parabéns!
              </h3>
              <p className="text-xl text-red-400 font-bold mb-4">
                Você ganhou: {winningSegment.label}
              </p>
              <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-red-600">
                <p className="text-gray-400 text-sm mb-2">
                  Seu cupom de desconto:
                </p>
                <p className="text-2xl font-mono font-bold text-white bg-red-600 rounded px-4 py-2 inline-block animate-pulse">
                  {couponCode}
                </p>
              </div>
              <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-2 text-green-400 mb-2">
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold">Desconto Aplicado Automaticamente!</span>
                </div>
                <p className="text-green-300 text-sm">
                  Seu desconto já foi aplicado no carrinho. Finalize seu pedido para aproveitar!
                </p>
              </div>
              <Button
                onClick={handleClose}
                className="bg-red-600 hover:bg-red-700 transform hover:scale-105 transition-all"
              >
                Usar Desconto Agora
              </Button>
            </div>
          ) : (
            <div className="text-center">
              {/* Status Messages */}
              {isSpinning && (
                <div className="mb-6">
                  {spinPhase === 'spinning' && (
                    <div className="text-yellow-400 font-bold text-lg animate-pulse">
                      🎯 Girando a roleta da sorte...
                    </div>
                  )}
                  {spinPhase === 'slowing' && (
                    <div className="text-orange-400 font-bold text-lg animate-pulse">
                      ⏳ Diminuindo a velocidade...
                    </div>
                  )}
                  {spinPhase === 'stopped' && (
                    <div className="text-green-400 font-bold text-lg animate-pulse">
                      🎉 Descobrindo seu prêmio...
                    </div>
                  )}
                </div>
              )}

              {/* Wheel Container */}
              <div className="relative w-80 h-80 mx-auto mb-8">
                {/* Glow effect when spinning */}
                {isSpinning && (
                  <div className="absolute inset-0 rounded-full bg-red-600 opacity-20 animate-ping"></div>
                )}

                {/* Wheel */}
                <div
                  id="lucky-wheel"
                  className="relative w-full h-full rounded-full border-8 border-red-600 shadow-2xl"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    background: `conic-gradient(${wheelSegments
                      .map((segment, index) => {
                        const startAngle = (index * 360) / wheelSegments.length;
                        const endAngle =
                          ((index + 1) * 360) / wheelSegments.length;
                        return `${segment.color} ${startAngle}deg ${endAngle}deg`;
                      })
                      .join(', ')})`,
                  }}
                >
                  {/* Segments with text */}
                  {wheelSegments.map((segment, index) => {
                    const angle = (index * 360) / wheelSegments.length;
                    const Icon = segment.icon;

                    return (
                      <div
                        key={segment.id}
                        className="absolute w-full h-full flex items-center justify-center"
                        style={{
                          transform: `rotate(${angle + 22.5}deg)`,
                          transformOrigin: 'center',
                        }}
                      >
                        <div
                          className="flex flex-col items-center text-white font-bold text-xs drop-shadow-lg"
                          style={{ transform: 'translateY(-120px)' }}
                        >
                          <Icon className="w-4 h-4 mb-1 drop-shadow-md" />
                          <span className="text-center leading-tight drop-shadow-md">
                            {segment.label.split(' ').map((word, i) => (
                              <div key={i}>{word}</div>
                            ))}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pointer with glow */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                  <div
                    className={`w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-600 drop-shadow-lg ${
                      isSpinning ? 'animate-pulse' : ''
                    }`}
                  ></div>
                </div>

                {/* Center circle with animation */}
                <div
                  className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-red-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center z-10 ${
                    isSpinning ? 'animate-pulse' : ''
                  }`}
                >
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Spin Button */}
              <Button
                onClick={spinWheel}
                disabled={isSpinning || !canSpin}
                className={`text-xl px-8 py-4 font-bold text-white ${
                  isSpinning
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 transform hover:scale-105 shadow-lg hover:shadow-red-600/50'
                } transition-all duration-200`}
              >
                {isSpinning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {spinPhase === 'spinning'
                      ? 'Girando...'
                      : spinPhase === 'slowing'
                      ? 'Parando...'
                      : 'Revelando...'}
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5 mr-2" />
                    GIRAR ROLETA
                  </>
                )}
              </Button>

              <p className="text-gray-400 text-sm mt-4">
                {isSpinning
                  ? 'Aguarde o resultado...'
                  : 'Clique para girar e descobrir seu prêmio!'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
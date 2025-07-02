import React from 'react'
import { clsx } from 'clsx'

interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={clsx(
      'bg-gray-900 border border-gray-800 rounded-xl shadow-lg',
      className
    )}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div className={clsx('px-6 py-4 border-b border-gray-800', className)}>
      {children}
    </div>
  )
}

export function CardContent({ className, children }: CardProps) {
  return (
    <div className={clsx('px-6 py-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children }: CardProps) {
  return (
    <h3 className={clsx('text-lg font-semibold text-white', className)}>
      {children}
    </h3>
  )
}
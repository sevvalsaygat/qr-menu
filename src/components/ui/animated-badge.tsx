import React from 'react'
import { cn } from '@/lib/utils'

interface AnimatedBadgeProps {
  count: number
  className?: string
  variant?: 'default' | 'destructive' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  showZero?: boolean
}

export function AnimatedBadge({ 
  count, 
  className, 
  variant = 'default',
  size = 'sm',
  showZero = false 
}: AnimatedBadgeProps) {
  // Don't show badge if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null
  }

  const baseClasses = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200"
  
  const variantClasses = {
    default: "bg-blue-600 text-white",
    destructive: "bg-red-600 text-white",
    secondary: "bg-gray-100 text-gray-900",
    outline: "border border-gray-300 bg-white text-gray-900"
  }
  
  const sizeClasses = {
    sm: "h-5 w-5 text-xs min-w-[20px]",
    md: "h-6 w-6 text-sm min-w-[24px]",
    lg: "h-7 w-7 text-sm min-w-[28px]"
  }

  return (
    <span
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        count > 0 && "animate-pulse",
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

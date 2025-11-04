'use client'

import { useRef } from 'react'
import QRCode from 'react-qr-code'

interface QRCodeDisplayProps {
  value: string
  size?: number
  bgColor?: string
  fgColor?: string
  level?: 'L' | 'M' | 'Q' | 'H'
  title?: string
  className?: string
}

export function QRCodeDisplay({
  value,
  size = 256,
  bgColor = '#FFFFFF',
  fgColor = '#000000',
  level = 'M',
  title,
  className = ''
}: QRCodeDisplayProps) {
  return (
    <div 
      style={{ 
        background: 'white', 
        padding: '16px',
        display: 'inline-block'
      }}
      className={className}
    >
      <QRCode
        value={value}
        size={size}
        bgColor={bgColor}
        fgColor={fgColor}
        level={level}
        title={title}
        style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
        viewBox={`0 0 ${size} ${size}`}
      />
    </div>
  )
}


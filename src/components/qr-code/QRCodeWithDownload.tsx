'use client'

import { useRef, useState } from 'react'
import { QRCodeDisplay } from './QRCodeDisplay'
import { Button } from '../ui/button'
import { Download } from 'lucide-react'

interface QRCodeWithDownloadProps {
  value: string
  filename?: string
  size?: number
  bgColor?: string
  fgColor?: string
  level?: 'L' | 'M' | 'Q' | 'H'
  title?: string
  className?: string
  showDownload?: boolean
}

export function QRCodeWithDownload({
  value,
  filename = 'qr-code',
  size = 256,
  bgColor = '#FFFFFF',
  fgColor = '#000000',
  level = 'M',
  title,
  className = '',
  showDownload = true
}: QRCodeWithDownloadProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const downloadQRCode = () => {
    if (!qrCodeRef.current) return

    setDownloading(true)
    try {
      // Get the SVG element from the QR code
      const svgElement = qrCodeRef.current.querySelector('svg')
      if (!svgElement) {
        throw new Error('SVG element not found')
      }

      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement
      
      // Ensure proper dimensions
      clonedSvg.setAttribute('width', size.toString())
      clonedSvg.setAttribute('height', size.toString())
      clonedSvg.setAttribute('viewBox', `0 0 ${size} ${size}`)

      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(clonedSvg)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)

      // Create a canvas to convert SVG to PNG
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        URL.revokeObjectURL(svgUrl)
        throw new Error('Could not get canvas context')
      }

      canvas.width = size
      canvas.height = size

      img.onload = () => {
        try {
          // Draw white background (quiet zone)
          ctx.fillStyle = bgColor
          ctx.fillRect(0, 0, size, size)
          
          // Draw the QR code image
          ctx.drawImage(img, 0, 0)

          // Convert to PNG and download
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.download = `${filename}.png`
              link.href = url
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              URL.revokeObjectURL(url)
            }
            URL.revokeObjectURL(svgUrl)
            setDownloading(false)
          }, 'image/png')
        } catch (error) {
          console.error('Error processing QR code:', error)
          URL.revokeObjectURL(svgUrl)
          setDownloading(false)
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(svgUrl)
        setDownloading(false)
        console.error('Failed to load SVG image')
      }

      img.src = svgUrl
    } catch (error) {
      console.error('Error downloading QR code:', error)
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div ref={qrCodeRef}>
        <QRCodeDisplay
          value={value}
          size={size}
          bgColor={bgColor}
          fgColor={fgColor}
          level={level}
          title={title}
          className={className}
        />
      </div>
      {showDownload && (
        <Button
          variant="outline"
          onClick={downloadQRCode}
          disabled={downloading}
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading ? 'Downloading...' : 'Download QR Code'}
        </Button>
      )}
    </div>
  )
}


import QRCode from 'qrcode'

export interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}

export const generateQRCode = async (
  text: string,
  options: QRCodeOptions = {}
): Promise<string> => {
  try {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    }

    return await QRCode.toDataURL(text, defaultOptions)
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export const generateTableMenuUrl = (
  restaurantId: string,
  tableId: string,
  baseUrl?: string
): string => {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/menu/${restaurantId}/${tableId}`
}

export const downloadQRCode = (
  dataUrl: string,
  filename: string = 'qr-code.png'
): void => {
  if (typeof window === 'undefined') return
  
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const generateTableQRCode = async (
  restaurantId: string,
  tableId: string,
  tableName: string,
  options?: QRCodeOptions
): Promise<{ qrCodeUrl: string; menuUrl: string; filename: string }> => {
  const menuUrl = generateTableMenuUrl(restaurantId, tableId)
  const qrCodeUrl = await generateQRCode(menuUrl, options)
  const filename = `table-${tableName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-qr.png`
  
  return {
    qrCodeUrl,
    menuUrl,
    filename
  }
}

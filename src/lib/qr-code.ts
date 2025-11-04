// Note: QR code generation is now handled by react-qr-code components
// This utility file provides helper functions for URL generation

export interface QRCodeOptions {
  size?: number
  bgColor?: string
  fgColor?: string
  level?: 'L' | 'M' | 'Q' | 'H'
}

export const generateTableMenuUrl = (
  restaurantId: string,
  tableId: string,
  baseUrl?: string
): string => {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/menu/${restaurantId}/${tableId}`
}

// Download functionality is now handled by QRCodeWithDownload component
// This function is kept for backward compatibility but is deprecated
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

// Generate table menu URL helper
export const generateTableQRCode = (
  restaurantId: string,
  tableId: string,
  tableName: string,
  baseUrl?: string
): { menuUrl: string; filename: string } => {
  const menuUrl = generateTableMenuUrl(restaurantId, tableId, baseUrl)
  const filename = `table-${tableName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-qr.png`
  
  return {
    menuUrl,
    filename
  }
}

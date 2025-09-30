import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currencySymbol: string = '$') {
  if (Number.isNaN(amount)) return `${currencySymbol}0.00`
  return `${currencySymbol}${amount.toFixed(2)}`
}

'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { DollarSign, BarChart3 } from 'lucide-react'
import { DailyRevenueStats } from '../../lib/monthly-revenue-analytics'

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface DailyRevenueAreaChartProps {
  data: DailyRevenueStats
  loading?: boolean
}

export default function DailyRevenueAreaChart({ data, loading }: DailyRevenueAreaChartProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const { totalRevenue } = data

  // Prepare area chart data
  const categories = data.data.map(item => item.dateName)
  
  // For area chart: Only daily revenue (blue)
  const dailyData = data.data.map(item => item.revenue)

  // Modern ApexCharts Area Chart configuration
  const chartOptions = {
    chart: {
      type: 'area' as const,
      height: 280,
      toolbar: {
        show: false
      },
      background: 'transparent',
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    colors: ['#3b82f6'], // Blue for daily revenue
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.25,
        gradientToColors: ['#60a5fa'], // Light blue
        inverseColors: false,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    stroke: {
      curve: 'smooth' as const,
      width: 2
    },
    dataLabels: {
      enabled: false // Disable data labels for cleaner area chart
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
          fontWeight: 500
        },
        rotate: -45
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        formatter: function (val: number) {
          if (val >= 1000) {
            return '$' + (val / 1000).toFixed(1) + 'k'
          }
          return '$' + val.toFixed(0)
        },
        style: {
          colors: '#6b7280',
          fontSize: '12px',
          fontWeight: 500
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    grid: {
      show: true,
      borderColor: '#f3f4f6',
      strokeDashArray: 3,
      position: 'back' as const,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      row: {
        colors: undefined,
        opacity: 0.5
      },
      column: {
        colors: undefined,
        opacity: 0.5
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    },
    tooltip: {
      enabled: true,
      theme: 'light',
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
      },
      custom: function({ dataPointIndex }: { dataPointIndex: number }) {
        const dayData = data.data[dataPointIndex]
        const dailyRevenue = dayData.revenue
        const dateName = dayData.dateName
        
        return `
          <div style="padding: 8px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="font-weight: 600; margin-bottom: 8px; color: #374151;">${dateName}</div>
            <div style="display: flex; align-items: center;">
              <div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; margin-right: 8px;"></div>
              <span style="color: #6b7280;">Daily Revenue: </span>
              <span style="font-weight: 600; color: #374151;">$${dailyRevenue.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}</span>
            </div>
          </div>
        `
      },
      x: {
        show: false // Hide default x-axis tooltip since we're using custom
      },
      y: {
        formatter: undefined // Disable default y-axis formatter
      },
      marker: {
        show: true
      },
      fillSeriesColor: false,
      followCursor: false,
      inverseOrder: false,
      shared: false, // Disable shared tooltip since we're using custom
      intersect: false
    },
    legend: {
      show: true,
      position: 'bottom' as const,
      horizontalAlign: 'center' as const,
      fontSize: '12px',
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      markers: {
        size: 4
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          xaxis: {
            labels: {
              rotate: -90
            }
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ]
  }

  const series = [
    {
      name: 'Daily Revenue',
      data: dailyData
    }
  ]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Daily Revenue
          </CardTitle>
          <CardDescription>Revenue performance over the last 2 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[280px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">Loading chart data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Daily Revenue
        </CardTitle>
        <CardDescription>
          Revenue performance over the last 2 weeks
        </CardDescription>
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                ${totalRevenue.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          {isClient && (
            <Chart
              options={chartOptions}
              series={series}
              type="area"
              height={280}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

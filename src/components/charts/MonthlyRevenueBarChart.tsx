'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { TrendingUp, DollarSign, BarChart3 } from 'lucide-react'
import { MonthlyRevenueStats } from '../../lib/monthly-revenue-analytics'

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface MonthlyRevenueBarChartProps {
  data: MonthlyRevenueStats
  loading?: boolean
}

export default function MonthlyRevenueBarChart({ data, loading }: MonthlyRevenueBarChartProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const { totalRevenue, growthPercentage } = data

  // Prepare chart data
  const chartData = data.data.map(item => ({
    x: item.monthName,
    y: item.revenue
  }))

  // Debug: Verify chart data matches total revenue
  const chartTotal = chartData.reduce((sum, item) => sum + item.y, 0)
  console.log('📊 Chart Data Verification:', {
    totalRevenue: data.totalRevenue,
    chartDataSum: chartTotal,
    mismatch: Math.abs(data.totalRevenue - chartTotal) > 0.01 ? `⚠️ MISMATCH` : '✅ Match',
    chartData: chartData.slice(-3), // Show last 3 months
    dataLength: chartData.length
  })

  // Modern ApexCharts Bar Chart configuration inspired by "Dashboards > Modern" design
  const chartOptions = {
    chart: {
      type: 'bar' as const,
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
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '60%',
        distributed: false,
        dataLabels: {
          position: 'top'
        }
      }
    },
    colors: ['#3b82f6'], // Modern blue color
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.25,
        gradientToColors: ['#60a5fa'],
        inverseColors: false,
        opacityFrom: 0.85,
        opacityTo: 0.55,
        stops: [0, 100]
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        if (val >= 1000) {
          return '$' + (val / 1000).toFixed(1) + 'k'
        }
        return '$' + val.toFixed(0)
      },
      offsetY: -20,
      style: {
        fontSize: '12px',
        fontWeight: 600,
        colors: ['#374151']
      }
    },
    xaxis: {
      categories: data.data.map(item => item.monthName),
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
      x: {
        show: true,
        format: 'MMM yyyy'
      },
      y: {
        formatter: function (val: number) {
          return '$' + val.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })
        }
      },
      marker: {
        show: true
      },
      custom: undefined,
      fillSeriesColor: false,
      followCursor: false,
      inverseOrder: false,
      shared: false,
      intersect: false
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '80%'
            }
          },
          dataLabels: {
            enabled: false
          },
          xaxis: {
            labels: {
              rotate: -90
            }
          }
        }
      }
    ]
  }

  const series = [
    {
      name: 'Monthly Revenue',
      data: chartData.map(item => item.y)
    }
  ]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Revenue
          </CardTitle>
          <CardDescription>Revenue performance over the last 6 months</CardDescription>
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
          Monthly Revenue
        </CardTitle>
        <CardDescription>
          Revenue performance over the last 6 months
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
          <div className="flex items-center gap-2">
            <TrendingUp className={`h-4 w-4 ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <div>
              <p className={`text-2xl font-bold ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Quarterly Growth</p>
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
              type="bar"
              height={280}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

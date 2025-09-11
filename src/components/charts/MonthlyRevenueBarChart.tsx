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

  // Prepare stacked chart data
  const categories = data.data.map(item => item.monthName)
  
  // For stacked bars: 
  // - Bottom series: Monthly revenue minus weekly revenue (blue)
  // - Top series: Weekly revenue (green)
  const remainingMonthlyData = data.data.map(item => {
    const monthly = item.revenue
    const weekly = item.weeklyRevenue || 0
    return Math.max(0, monthly - weekly) // Remaining monthly revenue after subtracting weekly
  })
  
  const weeklyData = data.data.map(item => item.weeklyRevenue ?? 0)

  

  // Modern ApexCharts Bar Chart configuration inspired by "Dashboards > Modern" design
  const chartOptions = {
    chart: {
      type: 'bar' as const,
      height: 280,
      stacked: true, // Enable stacked bars
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
    colors: ['#3b82f6', '#10b981'], // Blue for monthly, green for weekly
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.25,
        gradientToColors: ['#60a5fa', '#34d399'], // Light blue and light green
        inverseColors: false,
        opacityFrom: 0.85,
        opacityTo: 0.55,
        stops: [0, 100]
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number, opts: { seriesIndex: number, dataPointIndex: number }) {
        if (val === 0) return '' // Don't show labels for zero values
        
        // For stacked bars, show total on top segment only
        if (opts.seriesIndex === 1 && val > 0) {
          // This is the weekly revenue (top segment), show the total monthly revenue
          const totalMonthly = data.data[opts.dataPointIndex].revenue
          if (totalMonthly >= 1000) {
            return '$' + (totalMonthly / 1000).toFixed(1) + 'k'
          }
          return '$' + totalMonthly.toFixed(0)
        } else if (opts.seriesIndex === 0 && weeklyData[opts.dataPointIndex] === 0) {
          // This is monthly revenue with no weekly data, show the monthly total
          if (val >= 1000) {
            return '$' + (val / 1000).toFixed(1) + 'k'
          }
          return '$' + val.toFixed(0)
        }
        
        return '' // Don't show label for bottom segment when stacked
      },
      offsetY: -20,
      style: {
        fontSize: '12px',
        fontWeight: 600,
        colors: ['#374151']
      }
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
        const monthData = data.data[dataPointIndex]
        const monthlyRevenue = monthData.revenue
        const weeklyRevenue = monthData.weeklyRevenue || 0
        const monthName = monthData.monthName
        
        let tooltipContent = `
          <div style="padding: 8px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="font-weight: 600; margin-bottom: 8px; color: #374151;">${monthName}</div>
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; margin-right: 8px;"></div>
              <span style="color: #6b7280;">Monthly Revenue: </span>
              <span style="font-weight: 600; color: #374151;">$${monthlyRevenue.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}</span>
            </div>
        `
        
        // Only show weekly revenue if it exists
        if (weeklyRevenue > 0) {
          tooltipContent += `
            <div style="display: flex; align-items: center;">
              <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-right: 8px;"></div>
              <span style="color: #6b7280;">Weekly Revenue: </span>
              <span style="font-weight: 600; color: #374151;">$${weeklyRevenue.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}</span>
            </div>
          `
        }
        
        tooltipContent += `</div>`
        
        return tooltipContent
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
      data: remainingMonthlyData
    },
    {
      name: 'Weekly Revenue', 
      data: weeklyData
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

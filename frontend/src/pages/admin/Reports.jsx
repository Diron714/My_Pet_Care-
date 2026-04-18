import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { FileText, Download, Calendar, DollarSign, ShoppingCart, Users, Sparkles, TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, ArrowUpRight, ArrowDownRight, Filter, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line } from 'recharts';
import toast from 'react-hot-toast';

// Format currency as LKR
const formatCurrencyLKR = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount || 0);
};

// Internal Component for Revenue Trend
const RevenueTrendChart = ({ data }) => (
  <div className="h-80 w-full mb-8 rounded-3xl border border-slate-100 p-6 bg-white shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Revenue Trend</h3>
        <p className="text-xs text-slate-500 font-medium italic">Daily income performance over time</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-emerald-500" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue (LKR)</span>
      </div>
    </div>
    <ResponsiveContainer width="100%" height="80%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
          tickFormatter={(v) => `LKR ${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
        />
        <Tooltip 
          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          formatter={(v) => [`LKR ${v.toLocaleString()}`, 'Revenue']}
        />
        <Area 
          type="monotone" 
          dataKey="sales" 
          stroke="#10b981" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorSales)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

// Internal Component for Product Popularity Trends
const ProductPopularityChart = ({ trends }) => {
  const lineColors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];
  
  // Transform data for multi-line chart
  const allDates = [...new Set(trends.flatMap(t => t.data.map(d => d.date)))].sort();
  const chartData = allDates.map(date => {
    const entry = { date };
    trends.forEach(t => {
      const dayData = t.data.find(d => d.date === date);
      entry[t.name] = dayData ? dayData.quantity : 0;
    });
    return entry;
  });

  return (
    <div className="h-80 w-full mb-8 rounded-3xl border border-slate-100 p-6 bg-white shadow-sm">
       <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Product Popularity</h3>
          <p className="text-xs text-slate-500 font-medium italic">Daily sales units for top performers</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
          {trends.map((t, i) => (
            <Line 
              key={t.name} 
              type="monotone" 
              dataKey={t.name} 
              stroke={lineColors[i % lineColors.length]} 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 6 }} 
              animationDuration={1500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};


const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: '',
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'sales', label: 'Sales Report', icon: DollarSign, color: 'emerald' },
    { id: 'appointments', label: 'Appointment Report', icon: Calendar, color: 'blue' },
    { id: 'customers', label: 'Customer Report', icon: Users, color: 'purple' },
    { id: 'loyalty', label: 'Loyalty Report', icon: Sparkles, color: 'amber' },
  ];

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      loadReport();
    } else {
      setReportData(null);
    }
  }, [activeTab, dateRange]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('from', dateRange.from);
      params.append('to', dateRange.to);

      const response = await api.get(`/admin/reports/${activeTab}?${params.toString()}`);
      setReportData(response.data.data);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error('Please select date range first');
      return;
    }
    try {
      const params = new URLSearchParams();
      params.append('from', dateRange.from);
      params.append('to', dateRange.to);
      params.append('format', 'csv');

      const response = await api.get(`/admin/reports/${activeTab}/export?${params.toString()}`, {
        responseType: 'blob',
      });
      const disposition = response.headers['content-disposition'];
      const filenameMatch = disposition && /filename="?([^";\n]+)"?/.exec(disposition);
      const filename = filenameMatch ? filenameMatch[1] : `${activeTab}-report-${dateRange.from}-to-${dateRange.to}.csv`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to export report');
    }
  };

  const getTabStyles = (tab) => {
    const colors = {
      emerald: {
        active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30',
        inactive: 'text-emerald-600 border-emerald-200 hover:bg-emerald-50',
        gradient: 'from-emerald-500 to-emerald-600',
      },
      blue: {
        active: 'bg-blue-600 text-white shadow-lg shadow-blue-500/30',
        inactive: 'text-blue-600 border-blue-200 hover:bg-blue-50',
        gradient: 'from-blue-500 to-blue-600',
      },
      purple: {
        active: 'bg-purple-600 text-white shadow-lg shadow-purple-500/30',
        inactive: 'text-purple-600 border-purple-200 hover:bg-purple-50',
        gradient: 'from-purple-500 to-purple-600',
      },
      amber: {
        active: 'bg-amber-600 text-white shadow-lg shadow-amber-500/30',
        inactive: 'text-amber-600 border-amber-200 hover:bg-amber-50',
        gradient: 'from-amber-500 to-amber-600',
      },
    };
    return colors[tab.color] || colors.emerald;
  };

  return (
    <div className="page-shell">

        {/* Date Range Selector */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">Select Date Range</h2>
            </div>
            <div className="flex items-center gap-4">
              {loading && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                  Loading report
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">From Date</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">To Date</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={loadReport}
                disabled={!dateRange.from || !dateRange.to}
                className="w-full !bg-slate-800 hover:!bg-slate-900"
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>

        {/* Report Tabs */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-3 border-b border-slate-100 pb-4">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const styles = getTabStyles(tab);
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${isActive
                      ? styles.active
                      : `bg-white border-2 ${styles.inactive}`
                    }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Content */}
        {reportData ? (
          <div
            className={`space-y-6 transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeTab === 'sales' && (
                <>
                  <div className="card card-muted group hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales</p>
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${getTabStyles(tabs[0]).gradient} flex items-center justify-center shadow-lg`}>
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mb-1">{formatCurrencyLKR(reportData.totalSales || 0)}</p>
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                      <ArrowUpRight className="w-3 h-3" />
                      {reportData.growth || 0}% growth
                    </div>
                  </div>
                  <div className="card card-muted group hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</p>
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <ShoppingCart className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mb-1">{reportData.totalOrders || 0}</p>
                    <p className="text-xs text-slate-500">Avg: {formatCurrencyLKR(reportData.averageOrderValue || 0)}</p>
                  </div>
                </>
              )}
              {activeTab === 'appointments' && (
                <>
                  <div className="card card-muted group hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</p>
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mb-1">{reportData.totalAppointments || 0}</p>
                    <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold">
                      <ArrowUpRight className="w-3 h-3" />
                      {reportData.growth || 0}% growth
                    </div>
                  </div>
                  <div className="card card-muted group hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-emerald-600 mb-1">{reportData.completed || 0}</p>
                    <p className="text-xs text-slate-500">{Math.round(((reportData.completed || 0) / (reportData.totalAppointments || 1)) * 100)}% completion rate</p>
                  </div>
                </>
              )}
              {activeTab === 'customers' && (
                <>
                  <div className="card card-muted group hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Customers</p>
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mb-1">{reportData.totalCustomers || 0}</p>
                    <div className="flex items-center gap-2 text-xs text-purple-600 font-semibold">
                      <ArrowUpRight className="w-3 h-3" />
                      {reportData.growth || 0}% growth
                    </div>
                  </div>
                  <div className="card card-muted group hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Customers</p>
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-emerald-600 mb-1">{reportData.newCustomers || 0}</p>
                    <p className="text-xs text-slate-500">Active: {reportData.activeCustomers || 0}</p>
                  </div>
                </>
              )}
              {activeTab === 'loyalty' && (
                <>
                  <div className="card card-muted group hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Points</p>
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mb-1">{reportData.totalPoints?.toLocaleString() || 0}</p>
                    <div className="flex items-center gap-2 text-xs text-amber-600 font-semibold">
                      <ArrowUpRight className="w-3 h-3" />
                      {reportData.growth || 0}% growth
                    </div>
                  </div>
                  <div className="card card-muted group hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Members</p>
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-blue-600 mb-1">{reportData.activeMembers || 0}</p>
                    <p className="text-xs text-slate-500">Redeemed: {reportData.pointsRedeemed?.toLocaleString() || 0}</p>
                  </div>
                </>
              )}
            </div>

            {/* Report Details */}
            <div className="card">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{tabs.find(t => t.id === activeTab)?.label}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {dateRange.from && dateRange.to && `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="w-4 h-4 inline mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
              {/* Detailed Data */}
              <div className="space-y-6">
                {activeTab === 'sales' && reportData.topProducts && (
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      Highly Sold Products
                    </h3>
                    <div className="space-y-3">
                      {reportData.topProducts.map((product, index) => (
                        <div key={index} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-lg">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-lg">{product.name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{product.orders} total orders</span>
                                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                                  <span className={`text-xs font-black uppercase tracking-widest ${product.current_stock <= 10 ? 'text-rose-500' : 'text-slate-500'}`}>
                                    Stock: {product.current_stock}
                                    {product.current_stock <= 10 && ' (Low Stock!)'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-black text-emerald-600">{formatCurrencyLKR(product.sales)}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total Revenue</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'appointments' && reportData.topDoctors && (
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Top Doctors
                    </h3>
                    <div className="space-y-3">
                      {reportData.topDoctors.map((doctor, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-900">{doctor.name}</p>
                            <p className="text-lg font-black text-blue-600">{doctor.appointments} appointments</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'customers' && reportData.topSegments && (
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      Customer Segments
                    </h3>
                    <div className="space-y-3">
                      {reportData.topSegments.map((segment, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-900">{segment.segment}</p>
                            <p className="text-lg font-black text-purple-600">{segment.count} customers</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'loyalty' && reportData.topTiers && (
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                      Loyalty Tiers
                    </h3>
                    <div className="space-y-3">
                      {reportData.topTiers.map((tier, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-900">{tier.tier}</p>
                            <p className="text-lg font-black text-amber-600">{tier.members} members</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Analytics */}
                <div className="mt-6">
                  <h3 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-slate-600" />
                    Visual Analytics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeTab === 'sales' && reportData.revenueTrend && (
                      <div className="md:col-span-2">
                        <RevenueTrendChart data={reportData.revenueTrend} />
                        {reportData.productTrends && reportData.productTrends.length > 0 && (
                          <ProductPopularityChart trends={reportData.productTrends} />
                        )}
                      </div>
                    )}
                    {activeTab === 'sales' && reportData.topProducts && reportData.topProducts.length > 0 && (
                      <div className="h-[432px] rounded-3xl border border-slate-100 p-6 bg-white shadow-sm overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                          <p className="text-sm font-bold text-slate-800 uppercase tracking-widest">Revenue Contribution</p>
                          <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={reportData.topProducts} layout="vertical" margin={{ left: 30, right: 30 }}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip formatter={(value) => [formatCurrencyLKR(value), 'Revenue']} cursor={{ fill: '#f8fafc' }} />
                            <Bar dataKey="sales" fill="#10b981" radius={[0, 10, 10, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {activeTab === 'loyalty' && reportData.topTiers && reportData.topTiers.length > 0 && (
                      <div className="h-64 rounded-2xl border border-slate-200 p-4 bg-white">
                        <p className="text-sm font-semibold text-slate-700 mb-2">Loyalty Tier Distribution</p>
                        <ResponsiveContainer width="100%" height="90%">
                          <PieChart>
                            <Pie data={reportData.topTiers} dataKey="members" nameKey="tier" cx="50%" cy="50%" outerRadius={80} label={({ tier, members }) => `${tier}: ${members}`}>
                              {reportData.topTiers.map((_, i) => (
                                <Cell key={i} fill={['#f59e0b', '#6366f1', '#10b981', '#ec4899'][i % 4]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, 'Members']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {activeTab === 'appointments' && reportData.topDoctors && reportData.topDoctors.length > 0 && (
                      <div className="h-64 rounded-2xl border border-slate-200 p-4 bg-white">
                        <p className="text-sm font-semibold text-slate-700 mb-2">Top Doctors by Appointments</p>
                        <ResponsiveContainer width="100%" height="90%">
                          <BarChart data={reportData.topDoctors.slice(0, 8)} margin={{ left: 0, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="appointments" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {activeTab === 'customers' && reportData.topSegments && reportData.topSegments.length > 0 && (
                      <div className="h-64 rounded-2xl border border-slate-200 p-4 bg-white">
                        <p className="text-sm font-semibold text-slate-700 mb-2">Customer Segments</p>
                        <ResponsiveContainer width="100%" height="90%">
                          <PieChart>
                            <Pie data={reportData.topSegments} dataKey="count" nameKey="segment" cx="50%" cy="50%" outerRadius={80} label={({ segment, count }) => `${segment}: ${count}`}>
                              {reportData.topSegments.map((_, i) => (
                                <Cell key={i} fill={['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][i % 4]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, 'Customers']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {((activeTab === 'sales' && !reportData.topProducts?.length) ||
                      (activeTab === 'loyalty' && !reportData.topTiers?.length) ||
                      (activeTab === 'appointments' && !reportData.topDoctors?.length) ||
                      (activeTab === 'customers' && !reportData.topSegments?.length)) && (
                      <div className="h-64 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 md:col-span-2">
                        <PieChartIcon className="w-12 h-12 text-slate-300 mb-2" />
                        <p className="text-sm font-semibold">No chart data for this report</p>
                        <p className="text-xs">Select a date range with data to see charts</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`card transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 font-semibold mb-2">No Report Generated</p>
              <p className="text-sm text-slate-500">Select a date range and click "Generate Report" to view analytics</p>
            </div>
          </div>
        )}
      </div>
  );
};

export default Reports;

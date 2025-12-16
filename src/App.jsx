// src/App.jsx

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, message, Badge } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  TruckOutlined,
  LogoutOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  InboxOutlined,
  BellOutlined,
} from '@ant-design/icons';

// Існуючі сторінки
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import AddClientPage from './pages/AddClientPage';
import EditClientPage from './pages/EditClientPage';
import ProtectedRoute from './components/ProtectedRoute';
import TrucksPage from './pages/TrucksPage';
import AddTruckPage from './pages/AddTruckPage';
import EditTruckPage from './pages/EditTruckPage';
import TruckDetailPage from './pages/TruckDetailPage';
import OrdersPage from './pages/OrdersPage';
import AddOrderPage from './pages/AddOrderPage';
import OrderDetailPage from './pages/OrderDetailPage';
import EditOrderPage from './pages/EditOrderPage';

// НОВІ сторінки
import ProductsPage from './pages/ProductsPage';
import StockPage from './pages/StockPage';
import RemindersPage from './pages/RemindersPage';

import axiosInstance from './api/axios';

const { Header, Sider, Content } = Layout;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      fetchOverdueReminders();
    }
  }, []);

  const fetchOverdueReminders = async () => {
    try {
      const response = await axiosInstance.get('/maintenance/reminders/overdue/');
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setOverdueCount(data.length);
    } catch (error) {
      console.error('Error fetching overdue reminders:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete axiosInstance.defaults.headers['Authorization'];
    setIsAuthenticated(false);
    message.info('Ви вийшли з системи.');
    navigate('/login');
  };

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="*" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
      </Routes>
    );
  }

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Головна' },
    { key: '/clients', icon: <UserOutlined />, label: 'Клієнти' },
    { key: '/trucks', icon: <TruckOutlined />, label: 'Вантажівки' },
    { key: '/orders', icon: <FileTextOutlined />, label: 'Наряд-замовлення' },
    { type: 'divider' },
    { key: '/products', icon: <ExperimentOutlined />, label: 'Товари' },
    { key: '/stock', icon: <InboxOutlined />, label: 'Склад' },
    { 
      key: '/reminders', 
      icon: <BellOutlined />, 
      label: (
        <span>
          Нагадування ТО
          {overdueCount > 0 && (
            <Badge 
              count={overdueCount} 
              size="small" 
              style={{ marginLeft: 8 }}
            />
          )}
        </span>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ 
          height: '32px', 
          margin: '16px', 
          background: 'rgba(255, 255, 255, 0.2)', 
          textAlign: 'center', 
          color: 'white', 
          lineHeight: '32px',
          borderRadius: '4px',
        }}>
          {collapsed ? 'TM' : 'TRUCKMASTER'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 16px', 
          background: '#fff', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Button type="primary" icon={<LogoutOutlined />} onClick={handleLogout}>
            Вийти
          </Button>
        </Header>
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          minHeight: 280, 
          background: '#fff', 
          borderRadius: '8px' 
        }}>
          <Routes>
            {/* Головна */}
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            
            {/* Клієнти */}
            <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
            <Route path="/clients/new" element={<ProtectedRoute><AddClientPage /></ProtectedRoute>} />
            <Route path="/clients/:clientId/edit" element={<ProtectedRoute><EditClientPage /></ProtectedRoute>} />
            <Route path="/clients/:id" element={<ProtectedRoute><ClientDetailPage /></ProtectedRoute>} />
            
            {/* Вантажівки */}
            <Route path="/trucks" element={<ProtectedRoute><TrucksPage /></ProtectedRoute>} />
            <Route path="/trucks/new" element={<ProtectedRoute><AddTruckPage /></ProtectedRoute>} />
            <Route path="/trucks/:id" element={<ProtectedRoute><TruckDetailPage /></ProtectedRoute>} />
            <Route path="/trucks/:id/edit" element={<ProtectedRoute><EditTruckPage /></ProtectedRoute>} />
            
            {/* Замовлення */}
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/orders/new" element={<ProtectedRoute><AddOrderPage /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/orders/:id/edit" element={<ProtectedRoute><EditOrderPage /></ProtectedRoute>} />
            
            {/* НОВІ: Товари та склад */}
            <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
            <Route path="/stock" element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
            <Route path="/reminders" element={<ProtectedRoute><RemindersPage /></ProtectedRoute>} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;

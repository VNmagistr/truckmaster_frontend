import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, message } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  CarOutlined,
  LogoutOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import AddClientPage from './pages/AddClientPage';
import EditClientPage from './pages/EditClientPage';
import ProtectedRoute from './components/ProtectedRoute';
import TrucksPage from './pages/TrucksPage';
import AddTruckPage from './pages/AddTruckPage';
import axiosInstance from './api/axios';
import TruckDetailPage from './pages/TruckDetailPage';
import EditTruckPage from './pages/EditTruckPage';
import OrdersPage from './pages/OrdersPage';
import AddOrderPage from './pages/AddOrderPage';

const { Header, Sider, Content } = Layout;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', color: 'white', lineHeight: '32px' }}>
          {collapsed ? 'TM' : 'TRUCKMASTER'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={[
            { key: '/', icon: <DashboardOutlined />, label: 'Головна' },
            { key: '/clients', icon: <UserOutlined />, label: 'Клієнти' },
            { key: '/trucks', icon: <CarOutlined />, label: 'Вантажівки' },
            { key: '/orders', icon: <FileTextOutlined />, label: 'Наряд-замовлення' },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: '#fff', borderRadius: '8px' }}>
          <Routes>
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
            <Route path="/clients/new" element={<ProtectedRoute><AddClientPage /></ProtectedRoute>} />
            <Route path="/clients/:clientId" element={<ProtectedRoute><ClientDetailPage /></ProtectedRoute>} />
            <Route path="/clients/:clientId/edit" element={<ProtectedRoute><EditClientPage /></ProtectedRoute>} />
            <Route path="/trucks" element={<ProtectedRoute><TrucksPage /></ProtectedRoute>} />
            <Route path="/trucks/new" element={<ProtectedRoute><AddTruckPage /></ProtectedRoute>} />
            <Route path="/trucks/:id" element={<ProtectedRoute><TruckDetailPage /></ProtectedRoute>} />
            <Route path="/trucks/:id/edit" element={<ProtectedRoute><EditTruckPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/orders/new" element={<ProtectedRoute><AddOrderPage /></ProtectedRoute>} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
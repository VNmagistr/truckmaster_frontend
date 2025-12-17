import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, message, Typography, List, Tag } from 'antd';
import { CarOutlined, UserOutlined, FileTextOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { format, parseISO } from 'date-fns';

const { Title } = Typography;

// Допоміжна функція для розрахунку відсотків та іконки
const renderComparison = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? <span style={{ color: '#3f8600' }}><ArrowUpOutlined /> {current}</span> : <span>{current}</span>;
  }
  const percentChange = ((current - previous) / previous) * 100;
  const isUp = percentChange >= 0;
  
  return (
    <span style={{ color: isUp ? '#3f8600' : '#cf1322' }}>
      {isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
      {percentChange.toFixed(1)}%
    </span>
  );
};

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const results = await Promise.allSettled([
        axiosInstance.get('/trucks/'),
        axiosInstance.get('/clients/'),
        axiosInstance.get('/orders/'),
        axiosInstance.get('/recent-orders/'),
        axiosInstance.get('/dashboard-order-stats/')
      ]);

      // Обробляємо пагіновані відповіді
      const trucksData = results[0].status === 'fulfilled' 
        ? (results[0].value.data.results || results[0].value.data) 
        : [];
      const clientsData = results[1].status === 'fulfilled' 
        ? (results[1].value.data.results || results[1].value.data) 
        : [];
      const ordersData = results[2].status === 'fulfilled' 
        ? (results[2].value.data.results || results[2].value.data) 
        : [];
      const recentOrdersData = results[3].status === 'fulfilled' ? results[3].value.data : [];
      const periodStatsData = results[4].status === 'fulfilled' ? results[4].value.data : {};

      setStats({
        totalTrucks: trucksData.length,
        totalClients: clientsData.length,
        totalOrders: ordersData.length,
        ...periodStatsData
      });
      setRecentOrders(recentOrdersData);

    } catch (error) {
      message.error('Не вдалося завантажити дані для дашборду');
    } finally {
      setLoading(false);
    }
  };
  fetchDashboardData();
    }, []);
  
  const getStatusColor = (status) => {
    switch (status) {
        case 'Нове': return 'blue';
        case 'В роботі': return 'processing';
        case 'Завершено': return 'success';
        case 'Скасовано': return 'default';
        default: return 'default';
    }
  };

  if (loading || !stats) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>Інформаційна панель</Title>
      
      {/* --- БЛОК 1: КАРТКИ-ПОСИЛАННЯ --- */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8}>
          <Link to="/trucks">
            <Card hoverable>
              <Statistic
                title="Всього вантажівок"
                value={stats.totalTrucks}
                prefix={<CarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Link to="/clients">
            <Card hoverable>
              <Statistic
                title="Всього клієнтів"
                value={stats.totalClients}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Link to="/orders">
            <Card hoverable>
              <Statistic
                title="Всього наряд-замовлень"
                value={stats.totalOrders}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Link>
        </Col>
      </Row>

      {/* --- БЛОК 2: СТАТИСТИКА ЗА ПЕРІОДАМИ --- */}
      <Row gutter={16}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="Авто за тиждень" value={stats.this_week} />
            <div style={{ color: 'gray', marginTop: '10px' }}>
              Порівняно з минулим роком: {renderComparison(stats.this_week, stats.compare_week)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="Авто за місяць" value={stats.this_month} />
            <div style={{ color: 'gray', marginTop: '10px' }}>
              Порівняно з минулим роком: {renderComparison(stats.this_month, stats.compare_month)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="Авто за рік" value={stats.this_year} />
            <div style={{ color: 'gray', marginTop: '10px' }}>
              Порівняно з минулим роком: {renderComparison(stats.this_year, stats.compare_year)}
            </div>
          </Card>
        </Col>
      </Row>

      {/* --- БЛОК 3: ОСТАННІ ЗАМОВЛЕННЯ --- */}
      <Title level={3} style={{ marginTop: '32px' }}>Останні замовлення</Title>
      <List
        itemLayout="horizontal"
        dataSource={recentOrders}
        renderItem={(item) => (
          <List.Item actions={[<Link to={`/orders/${item.id}`}>Деталі</Link>]}>
            <List.Item.Meta
              title={<Link to={`/orders/${item.id}`}>Наряд-замовлення №{item.order_number || item.id}</Link>}
              description={`${item.client} - ${item.truck}`}
            />
            <div>
              <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
              <span style={{ marginLeft: '16px', color: '#888' }}>
                {item.start_date ? format(parseISO(item.start_date), 'dd.MM.yyyy') : ''}
              </span>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}

export default DashboardPage;
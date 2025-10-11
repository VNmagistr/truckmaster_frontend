import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, message, Typography, List, Tag } from 'antd';
import { CarOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { format, parseISO } from 'date-fns';

const { Title } = Typography;

function DashboardPage() {
  const [stats, setStats] = useState({
    trucksCount: 0,
    clientsCount: 0,
    ordersCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const results = await Promise.allSettled([
          axiosInstance.get('/trucks/'),
          axiosInstance.get('/clients/'),
          axiosInstance.get('/orders/'),
          axiosInstance.get('/recent-orders/')
        ]);

        // --- ВИПРАВЛЕНО: Повертаємось до .length ---
        const trucksData = results[0].status === 'fulfilled' ? results[0].value.data : [];
        const clientsData = results[1].status === 'fulfilled' ? results[1].value.data : [];
        const ordersData = results[2].status === 'fulfilled' ? results[2].value.data : [];
        const recentOrdersData = results[3].status === 'fulfilled' ? results[3].value.data : [];

        setStats({
          trucksCount: trucksData.length,
          clientsCount: clientsData.length,
          ordersCount: ordersData.length,
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>Інформаційна панель</Title>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Link to="/trucks">
            <Card hoverable>
              <Statistic
                title="Загальна кількість вантажівок"
                value={stats.trucksCount}
                prefix={<CarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Link to="/clients">
            <Card hoverable>
              <Statistic
                title="Загальна кількість клієнтів"
                value={stats.clientsCount}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Link to="/orders">
            <Card hoverable>
              <Statistic
                title="Наряд-замовлення"
                value={stats.ordersCount}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Link>
        </Col>
      </Row>

      <Title level={3} style={{ marginTop: '32px' }}>Останні замовлення</Title>
      <List
        itemLayout="horizontal"
        dataSource={recentOrders}
        renderItem={(item) => (
          <List.Item
            actions={[<Link to={`/orders/${item.id}`}>Деталі</Link>]}
          >
            <List.Item.Meta
              title={<Link to={`/orders/${item.id}`}>Наряд-замовлення №{item.order_number || item.id}</Link>}
              description={`${item.client} - ${item.truck}`}
            />
            <div>
              <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
              <span style={{ marginLeft: '16px', color: '#888' }}>
                {format(parseISO(item.start_date), 'dd.MM.yyyy')}
              </span>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}

export default DashboardPage;
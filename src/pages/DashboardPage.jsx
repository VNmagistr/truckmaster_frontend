import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, message, Typography } from 'antd';
import { CarOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';

const { Title } = Typography;

function DashboardPage() {
  const [stats, setStats] = useState({
    trucksCount: 0,
    clientsCount: 0,
    ordersCount: 0, // <-- Додано новий лічильник
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Завантажуємо дані з трьох джерел паралельно
        const [trucksResponse, clientsResponse, ordersResponse] = await Promise.all([
          axiosInstance.get('/trucks/'),
          axiosInstance.get('/clients/'),
          axiosInstance.get('/orders/'), // <-- Додано запит для замовлень
        ]);

        setStats({
          trucksCount: trucksResponse.data.length,
          clientsCount: clientsResponse.data.length,
          ordersCount: ordersResponse.data.length, // <-- Зберігаємо кількість замовлень
        });

      } catch (error) {
        message.error('Не вдалося завантажити статистику');
        console.error("Помилка завантаження статистики:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
        {/* --- НОВА КАРТКА ДЛЯ ЗАМОВЛЕНЬ --- */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Link to="/orders">
            <Card hoverable>
              <Statistic
                title="Наряди-замовлення"
                value={stats.ordersCount}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#faad14' }} // Помаранчевий колір для виділення
              />
            </Card>
          </Link>
        </Col>
      </Row>
    </div>
  );
}

export default DashboardPage;
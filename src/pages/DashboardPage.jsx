import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, message, Typography } from 'antd';
import { CarOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom'; // <-- 1. Імпортуємо Link
import axiosInstance from '../api/axios';

const { Title } = Typography;

function DashboardPage() {
  const [stats, setStats] = useState({
    trucksCount: 0,
    clientsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [trucksResponse, clientsResponse] = await Promise.all([
          axiosInstance.get('/trucks/'),
          axiosInstance.get('/clients/')
        ]);

        setStats({
          trucksCount: trucksResponse.data.length,
          clientsCount: clientsResponse.data.length,
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
          {/* --- 2. Обгортаємо картку в Link --- */}
          <Link to="/trucks">
            {/* --- 3. Додаємо властивість hoverable --- */}
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
      </Row>
    </div>
  );
}

export default DashboardPage;
// src/pages/DashboardPage.jsx

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
    ordersCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const results = await Promise.allSettled([
          axiosInstance.get('/trucks/'),
          axiosInstance.get('/clients/'),
          axiosInstance.get('/orders/'),
        ]);

        const trucksData = results[0].status === 'fulfilled' ? results[0].value.data : [];
        const clientsData = results[1].status === 'fulfilled' ? results[1].value.data : [];
        const ordersData = results[2].status === 'fulfilled' ? results[2].value.data : [];

        // Перевіряємо, чи були невдалі запити, і показуємо повідомлення
        const failedRequests = results.filter(res => res.status === 'rejected');
        if (failedRequests.length > 0) {
            // --- ОСЬ ВИПРАВЛЕННЯ: warn замінено на warning ---
            message.warning('Не вдалося завантажити частину статистики.');
            console.error("Невдалі запити:", failedRequests);
        }

        setStats({
          trucksCount: trucksData.length,
          clientsCount: clientsData.length,
          ordersCount: ordersData.length,
        });

      } catch (error) {
        message.error('Сталася критична помилка при завантаженні статистики');
        console.error("Критична помилка:", error);
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
    </div>
  );
}

export default DashboardPage;
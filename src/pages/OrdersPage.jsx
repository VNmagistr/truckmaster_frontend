// src/pages/OrdersPage.jsx

import React, { useState, useEffect } from 'react';
import { Table, Button, message, Spin, Tag } from 'antd';
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Припускаємо, що API для замовлень знаходиться тут
        const response = await axiosInstance.get('/orders/');
        setOrders(response.data);
      } catch (error) {
        message.error('Не вдалося завантажити список замовлень');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Функція для надання кольору статусу
  const getStatusColor = (status) => {
    switch (status) {
      case 'Нове': return 'blue';
      case 'В роботі': return 'processing';
      case 'Завершено': return 'success';
      case 'Скасовано': return 'default';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: '№ Замовлення',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Link to={`/orders/${id}`}>#{id}</Link>,
    },
    {
      title: 'Клієнт',
      dataIndex: 'client_name', // Припускаємо, що API повертатиме ім'я
      key: 'client',
    },
    {
      title: 'Вантажівка',
      dataIndex: 'truck_license_plate', // Припускаємо, що API повертатиме номерний знак
      key: 'truck',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Дата створення',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    // Тут буде колонка "Дії"
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Наряд-замовлення</h1>
        <Link to="/orders/new">
          <Button type="primary" icon={<PlusOutlined />}>Створити замовлення</Button>
        </Link>
      </div>
      <Table columns={columns} dataSource={orders} rowKey="id" />
    </div>
  );
}

export default OrdersPage;
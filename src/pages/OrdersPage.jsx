import React, { useState, useEffect } from 'react';
import { Table, Button, message, Spin, Tag } from 'antd';
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { format, parseISO } from 'date-fns'; // 1. Імпортуємо функції

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
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

  const getStatusColor = (status) => {
    // Ваша функція getStatusColor без змін
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
      render: (id) => <Link to={`/orders/${id}`}>Наряд-замовлення #{id}</Link>,
    },
    {
      title: 'Клієнт',
      dataIndex: 'client', // Оновлено відповідно до ListSerializer
      key: 'client',
    },
    {
      title: 'Вантажівка',
      dataIndex: 'truck', // Оновлено відповідно до ListSerializer
      key: 'truck',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        status ? <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag> : '-'
      ),
    },
    {
      title: 'Дата створення',
      dataIndex: 'start_date', // Оновлено відповідно до ListSerializer
      key: 'start_date',
      // 2. Використовуємо date-fns для надійного форматування
      render: (dateString) => {
        if (!dateString) return '-';
        try {
          const date = parseISO(dateString);
          return format(date, 'dd.MM.yyyy HH:mm');
        } catch (error) {
          return 'Invalid Date';
        }
      },
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
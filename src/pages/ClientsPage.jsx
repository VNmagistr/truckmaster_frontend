import React, { useState, useEffect } from 'react';
import { Table, Spin, message, Button } from 'antd';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axiosInstance.get('/clients/');
        setClients(response.data);
      } catch (error) {
        message.error('Не вдалося завантажити список клієнтів');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const columns = [
    { 
      title: 'Ім\'я', 
      dataIndex: 'name', 
      key: 'name',
      render: (text, record) => (
        <Link 
          to={`/clients/${record.id}`} 
          style={{ fontWeight: 'bold', color: 'gray' }}
        >
          {text}
        </Link>
      ),
    },
    { title: 'Телефон', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
  ];

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Клієнти</h1>
        {/* 👇 ДОДАЛИ КНОПКУ 👇 */}
        <Link to="/clients/new">
          <Button type="primary">Додати клієнта</Button>
        </Link>
      </div>
      <Table dataSource={clients} columns={columns} rowKey="id" />
    </div>
  );
}

export default ClientsPage;
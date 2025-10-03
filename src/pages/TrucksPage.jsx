import React, { useState, useEffect } from 'react';
import { Table, Spin, message, Button } from 'antd';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';

function TrucksPage() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trucksResponse, clientsResponse] = await Promise.all([
          axiosInstance.get('/trucks/'),
          axiosInstance.get('/clients/')
        ]);
        
        const clientsData = clientsResponse.data;
        const trucksData = trucksResponse.data;

        // Створюємо карту клієнтів для швидкого доступу
        const clientsMap = clientsData.reduce((acc, client) => {
          acc[client.id] = client.name;
          return acc;
        }, {});

        // "Збагачуємо" дані вантажівок, додаючи ім'я клієнта прямо в об'єкт
        const enrichedTrucks = trucksData.map(truck => ({
          ...truck,
          clientName: clientsMap[truck.client] || 'Невідомий клієнт',
        }));

        setTrucks(enrichedTrucks); // Встановлюємо вже оброблені дані

      } catch (error) {
        message.error('Не вдалося завантажити дані');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = [
    { 
      title: 'Модель', 
      dataIndex: 'specific_model_name', 
      key: 'model',
      render: (text, record) => <Link to={`/trucks/${record.id}`}>{text}</Link>,
    },
    { title: 'VIN-код', dataIndex: 'last_seven_vin', key: 'vin_code' },
    { title: 'Номерний знак', dataIndex: 'license_plate', key: 'license_plate' },
    { 
      title: 'Клієнт', 
      dataIndex: 'clientName', // <-- Тепер використовуємо нове поле 'clientName'
      key: 'client',
      render: (text, record) => (
        // ID клієнта для посилання беремо з оригінального поля 'client'
        <Link to={`/clients/${record.client}`}>{text}</Link>
      ),
    },
  ];

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Вантажівки</h1>
        <Link to="/trucks/new">
          <Button type="primary">Додати вантажівку</Button>
        </Link>
      </div>
      <Table dataSource={trucks} columns={columns} rowKey="id" />
    </div>
  );
}

export default TrucksPage;
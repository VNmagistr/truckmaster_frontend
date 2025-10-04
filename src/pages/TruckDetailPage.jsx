// src/pages/TruckDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Spin, message, Button, Popconfirm } from 'antd';
import axiosInstance from '../api/axios';

function TruckDetailPage() {
  const [truck, setTruck] = useState(null);
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTruckData = async () => {
      try {
        setLoading(true);
        // Крок 1: Завантажуємо дані про вантажівку
        const response = await axiosInstance.get(`/trucks/${id}/`);
        const truckData = response.data;
        setTruck(truckData);

        // Крок 2: Якщо є ID клієнта, завантажуємо його ім'я
        if (truckData && truckData.client) {
          const clientResponse = await axiosInstance.get(`/clients/${truckData.client}/`);
          setClientName(clientResponse.data.name);
        }
      } catch (error) {
        message.error('Не вдалося завантажити дані');
        console.error("Помилка завантаження:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTruckData();
  }, [id]);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/trucks/${id}/`);
      message.success(`Вантажівку (ID: ${id}) було успішно видалено.`);
      navigate('/trucks'); // Перенаправляємо на сторінку зі списком
    } catch (error) {
      message.error('Не вдалося видалити вантажівку.');
      console.error("Помилка видалення:", error);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Spin size="large" /></div>;
  }

  if (!truck) {
    return <div>Вантажівку не знайдено</div>;
  }

  return (
    <Card 
      title={`Вантажівка: ${truck.specific_model_name} (${truck.license_plate})`}
      extra={<Link to={`/trucks/${id}/edit`}><Button type="primary">Редагувати</Button></Link>}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Модель">{truck.specific_model_name}</Descriptions.Item>
        <Descriptions.Item label="VIN-код">{truck.last_seven_vin}</Descriptions.Item>
        <Descriptions.Item label="Номерний знак">{truck.license_plate}</Descriptions.Item>
        <Descriptions.Item label="Клієнт-власник">
          {truck.client ? (
            <Link to={`/clients/${truck.client}`}>{clientName || 'Завантаження...'}</Link>
          ) : (
            'Не вказано'
          )}
        </Descriptions.Item>
      </Descriptions>
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <Link to="/trucks">
          <Button>Назад до списку</Button>
        </Link>
        <Popconfirm
          title="Видалити вантажівку?"
          description="Цю дію неможливо буде скасувати. Ви впевнені?"
          onConfirm={handleDelete}
          okText="Так, видалити"
          cancelText="Скасувати"
        >
          <Button type="primary" danger>Видалити</Button>
        </Popconfirm>
      </div>
    </Card>
  );
}

export default TruckDetailPage;
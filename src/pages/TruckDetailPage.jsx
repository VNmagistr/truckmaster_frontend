import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Spin, message, Button } from 'antd';
import axiosInstance from '../api/axios';

function TruckDetailPage() {
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const { truckId } = useParams();

  useEffect(() => {
    const fetchTruck = async () => {
      try {
        const response = await axiosInstance.get(`/trucks/${truckId}/`);
        setTruck(response.data);
      } catch (error) {
        message.error('Не вдалося завантажити дані вантажівки');
      } finally {
        setLoading(false);
      }
    };
    fetchTruck();
  }, [truckId]);

  if (loading) {
    return <Spin size="large" />;
  }

  if (!truck) {
    return <div>Вантажівку не знайдено</div>;
  }

  return (
    <Card 
      title={`Вантажівка: ${truck.model} (${truck.license_plate})`}
      extra={<Link to={`/trucks/${truckId}/edit`}><Button type="primary">Редагувати</Button></Link>}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Модель">{truck.model}</Descriptions.Item>
        <Descriptions.Item label="VIN-код">{truck.vin_code}</Descriptions.Item>
        <Descriptions.Item label="Номерний знак">{truck.license_plate}</Descriptions.Item>
        <Descriptions.Item label="Клієнт-власник">
          {truck.client ? <Link to={`/clients/${truck.client.id}`}>{truck.client.name}</Link> : 'Не вказано'}
        </Descriptions.Item>
      </Descriptions>
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <Link to="/trucks">
          <Button>Назад до списку</Button>
        </Link>
        <Button type="primary" danger>Видалити</Button>
      </div>
    </Card>
  );
}

export default TruckDetailPage;
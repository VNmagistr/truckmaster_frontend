import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Spin, message, Button, Typography, Table, Tag, Image, Space } from 'antd';
import axiosInstance from '../api/axios';
import { format, parseISO } from 'date-fns';

const { Title, Text } = Typography;

function OrderDetailPage() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axiosInstance.get(`/orders/${id}/`);
        setOrder(response.data);
      } catch (error) {
        message.error('Не вдалося завантажити дані замовлення');
        console.error("Помилка завантаження замовлення:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const workColumns = [
    {
      title: 'Назва роботи з прайсу',
      dataIndex: ['work', 'name'],
      key: 'work_name',
    },
    {
      title: 'Додатковий опис',
      dataIndex: 'custom_description',
      key: 'custom_description',
    },
    {
        title: 'Витрачено годин',
        dataIndex: 'duration_hours',
        key: 'duration_hours',
    },
    {
      title: 'Вартість, грн',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost) => parseFloat(cost).toFixed(2),
    },
    {
      title: 'Виконавець',
      dataIndex: 'employee',
      key: 'employee',
      render: (employee) => employee || 'Не призначено',
    },
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Spin size="large" /></div>;
  }

  if (!order) {
    return <Title level={3}>Наряд-замовлення не знайдено</Title>;
  }

  return (
    <Card
      title={`Наряд-замовлення №${order.order_number}`}
      extra={<Link to={`/orders/${id}/edit`}><Button type="primary">Редагувати</Button></Link>}
    >
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Статус">
          <Tag color="blue">{order.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Клієнт">
          <Link to={`/clients/${order.client.id}`}>{order.client.name} {order.client.last_name}</Link>
        </Descriptions.Item>
        <Descriptions.Item label="Вантажівка">
          <Link to={`/trucks/${order.truck.id}`}>{order.truck.specific_model_name} ({order.truck.license_plate})</Link>
        </Descriptions.Item>
        <Descriptions.Item label="Дата створення">
          {format(parseISO(order.start_date), 'dd.MM.yyyy HH:mm')}
        </Descriptions.Item>
        <Descriptions.Item label="Загальна вартість">
          <Text strong>{parseFloat(order.total_cost).toFixed(2)} грн</Text>
        </Descriptions.Item>
      </Descriptions>

      <Title level={4} style={{ marginTop: 24 }}>Фотографії автомобіля</Title>
      <Space wrap>
        {order.car_photo && <Image width={200} src={order.car_photo} placeholder={<Spin />} />}
        {order.odometer_photo && <Image width={200} src={order.odometer_photo} placeholder={<Spin />} />}
        {order.dashboard_photo && <Image width={200} src={order.dashboard_photo} placeholder={<Spin />} />}
      </Space>

      {order.repair_photos && order.repair_photos.length > 0 && (
        <>
            <Title level={4} style={{ marginTop: 24 }}>Фотографії поломок</Title>
            <Image.PreviewGroup>
                <Space wrap>
                    {order.repair_photos.map(photo => (
                        <div key={photo.id} style={{ textAlign: 'center' }}>
                            <Image width={200} src={photo.image} placeholder={<Spin />} />
                            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                {photo.caption}
                            </Text>
                        </div>
                    ))}
                </Space>
            </Image.PreviewGroup>
        </>
      )}

      <Title level={4} style={{ marginTop: 24 }}>Виконані роботи</Title>
      <Table
        columns={workColumns}
        dataSource={order.works}
        rowKey="id"
        pagination={false}
      />

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <Link to="/orders">
          <Button>Назад до списку</Button>
        </Link>
      </div>
    </Card>
  );
}

export default OrderDetailPage;
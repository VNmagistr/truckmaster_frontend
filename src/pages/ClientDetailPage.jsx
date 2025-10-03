import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Spin, message, Button, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axios';

function ClientDetailPage() {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const { clientId } = useParams();
  const navigate = useNavigate();
  
  // 👇 1. Ініціалізуємо хук useModal 👇
  const [modal, contextHolder] = Modal.useModal();

  useEffect(() => {
    // ... (код завантаження клієнта без змін)
    const fetchClient = async () => {
      try {
        const response = await axiosInstance.get(`/clients/${clientId}/`);
        setClient(response.data);
      } catch (error) {
        message.error('Не вдалося завантажити дані клієнта');
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [clientId]);

  // 👇 2. Оновлюємо функцію, щоб вона використовувала екземпляр modal 👇
  const showDeleteConfirm = () => {
    modal.confirm({ // <-- Використовуємо modal.confirm замість просто confirm
      title: 'Ви впевнені, що хочете видалити цього клієнта?',
      icon: <ExclamationCircleOutlined />,
      content: 'Цю дію неможливо буде скасувати.',
      okText: 'Так, видалити',
      okType: 'danger',
      cancelText: 'Скасувати',
      onOk: async () => {
        try {
          await axiosInstance.delete(`/clients/${clientId}/`);
          message.success('Клієнта успішно видалено');
          navigate('/clients');
        } catch (error) {
          message.error('Помилка при видаленні клієнта');
        }
      },
    });
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (!client) {
    return <div>Клієнта не знайдено</div>;
  }

  return (
    <> {/* Обгортаємо у фрагмент */}
      <Card 
        title={`Клієнт: ${client.name}`}
        extra={<Link to={`/clients/${clientId}/edit`}><Button type="primary">Редагувати</Button></Link>}
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Ім'я">{client.name}</Descriptions.Item>
          <Descriptions.Item label="Прізвище">{client.surname}</Descriptions.Item>
          <Descriptions.Item label="Телефон">{client.phone}</Descriptions.Item>
          <Descriptions.Item label="Email">{client.email}</Descriptions.Item>
        </Descriptions>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <Link to="/clients">
            <Button>Назад до списку</Button>
          </Link>
          <Button type="primary" danger onClick={showDeleteConfirm}>
            Видалити
          </Button>
        </div>
      </Card>
      
      {/* 👇 3. Додаємо contextHolder у розмітку. Це обов'язково! 👇 */}
      {contextHolder}
    </>
  );
}

export default ClientDetailPage;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import axiosInstance from '../api/axios';

function AddClientPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Відправляємо POST-запит для створення нового клієнта
      await axiosInstance.post('/clients/', values);
      message.success('Клієнта успішно створено!');
      navigate('/clients'); // Повертаємось до списку клієнтів
    } catch (error) {
      message.error('Помилка при створенні клієнта');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = (_, value) => {
    if (value && !value.startsWith('+3')) {
      return Promise.reject(new Error('Номер має починатись з +3!'));
    }
    return Promise.resolve();
  };

  return (
    <Card title="Створення нового клієнта">
      <Form
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label="Ім'я / Назва компанії"
          name="name"
          rules={[{ required: true, message: 'Будь ласка, введіть ім\'я клієнта!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Прізвище (для фіз. осіб)"
          name="surname"
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Телефон"
          name="phone"
          rules={[
            { required: true, message: 'Будь ласка, введіть номер телефону!' },
            { validator: validatePhoneNumber } // Додаємо наш валідатор
          ]}
        >
          <Input placeholder="+380..." />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[{ type: 'email', message: 'Неправильний формат email!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Створити
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default AddClientPage;
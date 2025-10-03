import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Spin } from 'antd';
import axiosInstance from '../api/axios';

function EditClientPage() {
  const [form] = Form.useForm(); // Отримуємо доступ до екземпляра форми
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState(null);

  // 1. Завантажуємо існуючі дані клієнта
  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/clients/${clientId}/`);
        setInitialData(response.data);
      } catch (error) {
        message.error('Не вдалося завантажити дані клієнта');
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [clientId]);

  // 2. Встановлюємо дані у форму, коли вони завантажені
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
    }
  }, [initialData, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 3. Відправляємо PATCH-запит для оновлення даних
      await axiosInstance.patch(`/clients/${clientId}/`, values);
      message.success('Дані клієнта успішно оновлено!');
      navigate(`/clients/${clientId}`); // Повертаємось на сторінку перегляду
    } catch (error) {
      message.error('Помилка при оновленні даних');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !initialData) {
    return <Spin size="large" />;
  }

  return (
    <Card title="Редагування клієнта">
      <Form
        form={form} // Прив'язуємо екземпляр форми
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialData}
      >
        <Form.Item
          label="Ім'я"
          name="name"
          rules={[{ required: true, message: 'Будь ласка, введіть ім\'я клієнта!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Прізвище"
          name="surname"
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Телефон"
          name="phone"
          rules={[{ required: true, message: 'Будь ласка, введіть номер телефону!' }]}
        >
          <Input />
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
            Зберегти зміни
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default EditClientPage;
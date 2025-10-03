// src/pages/EditTruckPage.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Spin } from 'antd';
import axiosInstance from '../api/axios';

function EditTruckPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const { id } = useParams(); // Отримуємо ID з URL
  const navigate = useNavigate();

  // Завантажуємо дані вантажівки при завантаженні сторінки
  useEffect(() => {
    const fetchTruckData = async () => {
      try {
        const response = await axiosInstance.get(`/trucks/${id}/`);
        // Заповнюємо форму отриманими даними
        form.setFieldsValue(response.data);
      } catch (error) {
        message.error('Не вдалося завантажити дані для редагування');
      } finally {
        setLoading(false);
      }
    };
    fetchTruckData();
  }, [id, form]);

  // Обробляємо відправку форми
  const handleFinish = async (values) => {
    try {
      await axiosInstance.patch(`/trucks/${id}/`, values);
      message.success('Дані вантажівки успішно оновлено!');
      navigate(`/trucks/${id}`); // Повертаємось на сторінку перегляду
    } catch (error) {
      message.error('Помилка при оновленні даних');
      console.error(error);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Spin size="large" /></div>;
  }

  return (
    <Card title={`Редагування вантажівки (ID: ${id})`}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item name="specific_model_name" label="Модель" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="last_seven_vin" label="VIN-код (останні 7)" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="license_plate" label="Номерний знак" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Зберегти зміни
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate(`/trucks/${id}`)}>
            Скасувати
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default EditTruckPage;
// src/pages/AddOrderPage.jsx

import React, { useState, useEffect } from 'react';
import { Form, Button, Card, message, Select, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const { Option } = Select;
const { TextArea } = Input;

function AddOrderPage() {
  const [form] = Form.useForm();
  const [clients, setClients] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const navigate = useNavigate();

  // Завантажуємо список клієнтів при завантаженні сторінки
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axiosInstance.get('/clients/');
        setClients(response.data);
      } catch (error) {
        message.error('Не вдалося завантажити список клієнтів');
      }
    };
    fetchClients();
  }, []);

  // Завантажуємо вантажівки, коли обрано клієнта
  useEffect(() => {
    if (!selectedClientId) {
      setTrucks([]);
      form.setFieldsValue({ truck: null }); // Скидаємо значення вантажівки у формі
      return;
    }

    const fetchTrucks = async () => {
      try {
        // Запитуємо вантажівки, фільтруючи за ID клієнта
        const response = await axiosInstance.get(`/trucks/?client=${selectedClientId}`);
        setTrucks(response.data);
      } catch (error) {
        message.error('Не вдалося завантажити список вантажівок для цього клієнта');
      }
    };
    fetchTrucks();
  }, [selectedClientId, form]);

  const handleClientChange = (value) => {
    setSelectedClientId(value);
  };

  const onFinish = async (values) => {
    try {
      await axiosInstance.post('/orders/', values);
      message.success('Наряд-замовлення успішно створено!');
      navigate('/orders');
    } catch (error) {
      message.error('Помилка при створенні замовлення');
      console.error(error);
    }
  };

  return (
    <Card title="Створення нового наряд-замовлення">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="client" label="Клієнт" rules={[{ required: true, message: 'Будь ласка, оберіть клієнта!' }]}>
          <Select
            showSearch
            placeholder="Оберіть клієнта"
            onChange={handleClientChange}
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {clients.map(client => (
              <Option key={client.id} value={client.id}>{client.name} {client.last_name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="truck" label="Вантажівка" rules={[{ required: true, message: 'Будь ласка, оберіть вантажівку!' }]}>
          <Select
            showSearch
            placeholder="Оберіть вантажівку"
            disabled={!selectedClientId} // Поле неактивне, поки не обрано клієнта
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {trucks.map(truck => (
              <Option key={truck.id} value={truck.id}>{truck.specific_model_name} ({truck.license_plate})</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="description" label="Опис проблеми / робіт" rules={[{ required: true, message: 'Будь ласка, введіть опис!' }]}>
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item name="status" label="Статус" initialValue="Нове" rules={[{ required: true }]}>
           <Select>
             <Option value="Нове">Нове</Option>
             <Option value="В роботі">В роботі</Option>
             <Option value="Очікує запчастин">Очікує запчастин</Option>
             <Option value="Завершено">Завершено</Option>
             <Option value="Скасовано">Скасовано</Option>
           </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Створити замовлення
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate('/orders')}>
            Скасувати
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default AddOrderPage;
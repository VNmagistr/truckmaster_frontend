import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Select } from 'antd';
import axiosInstance from '../api/axios';

const { Option } = Select;

function AddTruckPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]); // Стан для зберігання списку клієнтів

  // Завантажуємо список клієнтів для випадаючого меню
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

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await axiosInstance.post('/trucks/', values);
      message.success('Вантажівку успішно створено!');
      navigate('/trucks'); // Повертаємось до списку вантажівок
    } catch (error) {
      message.error('Помилка при створенні вантажівки');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Додавання нової вантажівки">
      <Form
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label="Клієнт-власник"
          name="client"
          rules={[{ required: true, message: 'Будь ласка, оберіть клієнта!' }]}
        >
          <Select
            showSearch
            placeholder="Оберіть клієнта"
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {clients.map(client => (
              <Option key={client.id} value={client.id}>{client.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Модель"
          name="model"
          rules={[{ required: true, message: 'Будь ласка, введіть модель!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="VIN-код"
          name="vin_code"
          rules={[{ required: true, message: 'Будь ласка, введіть VIN-код!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Номерний знак"
          name="license_plate"
          rules={[{ required: true, message: 'Будь ласка, введіть номерний знак!' }]}
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

export default AddTruckPage;
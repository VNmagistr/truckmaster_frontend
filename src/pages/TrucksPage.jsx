import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm, Spin } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';

function TrucksPage() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trucksResponse, clientsResponse] = await Promise.all([
          axiosInstance.get('/trucks/'),
          axiosInstance.get('/clients/')
        ]);
        
        const clientsData = clientsResponse.data;
        const trucksData = trucksResponse.data;

        // --- КРОКИ ДЛЯ ДІАГНОСТИКИ ---
        console.log("1. Дані, отримані з API /clients/:", clientsData);
        console.log("2. Дані, отримані з API /trucks/ (перша вантажівка):", trucksData[0]);
        // -----------------------------

        const clientsMap = clientsData.reduce((acc, client) => {
          acc[client.id] = client.name;
          return acc;
        }, {});

        // --- КРОКИ ДЛЯ ДІАГНОСТИКИ ---
        console.log("3. Створена карта клієнтів (clientsMap):", clientsMap);
        if (trucksData && trucksData.length > 0) {
          console.log("4. ID клієнта, який шукаємо в карті (truck.client):", trucksData[0].client);
        }
        // -----------------------------

        const enrichedTrucks = trucksData.map(truck => ({
          ...truck,
          clientName: clientsMap[truck.client_id] || 'Невідомий клієнт',
        }));

        setTrucks(enrichedTrucks);
      } catch (error) {
        message.error('Не вдалося завантажити дані');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/trucks/${id}/`);
      setTrucks(trucks.filter(truck => truck.id !== id));
      message.success('Вантажівку успішно видалено!');
    } catch (error) {
      message.error('Не вдалося видалити вантажівку.');
      console.error('Помилка видалення:', error);
    }
  };

  const handleEdit = (record) => {
    setEditingTruck(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingTruck(null);
  };

  const handleModalSubmit = async (values) => {
    try {
      const response = await axiosInstance.patch(`/trucks/${editingTruck.id}/`, values);
      
      setTrucks(trucks.map(truck => {
        if (truck.id === editingTruck.id) {
          return { ...truck, ...response.data };
        }
        return truck;
      }));
      
      message.success('Дані вантажівки оновлено!');
      handleCancel();
    } catch (error) {
      message.error('Не вдалося оновити дані.');
      console.error('Помилка оновлення:', error);
    }
  };


  
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
      dataIndex: 'clientName',
      key: 'client',
      render: (text, record) => (
        <Link to={`/clients/${record.client_id}`}>{text}</Link>
      ),
    },
    {
      title: 'Дії',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)} 
          >
            Редагувати
          </Button>
          <Popconfirm
            title="Ви впевнені, що хочете видалити?"
            onConfirm={() => handleDelete(record.id)} 
            okText="Так"
            cancelText="Ні"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Видалити
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Вантажівки</h1>
        <Link to="/trucks/new">
          <Button type="primary">Додати вантажівку</Button>
        </Link>
      </div>
      <Table dataSource={trucks} columns={columns} rowKey="id" loading={loading} />

      {/* --- НОВЕ МОДАЛЬНЕ ВІКНО ДЛЯ РЕДАГУВАННЯ --- */}
      <Modal
        title="Редагувати дані вантажівки"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
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
          {}
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Зберегти
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={handleCancel}>
              Скасувати
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default TrucksPage;
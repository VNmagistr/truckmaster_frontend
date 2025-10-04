import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, message, Popconfirm, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';

function TrucksPage() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Стани для пошуку
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [trucksResponse, clientsResponse] = await Promise.all([
          axiosInstance.get('/trucks/'),
          axiosInstance.get('/clients/')
        ]);
        
        const clientsData = clientsResponse.data;
        const trucksData = trucksResponse.data;

        const clientsMap = clientsData.reduce((acc, client) => {
          acc[client.id] = client.name;
          return acc;
        }, {});

        const enrichedTrucks = trucksData.map(truck => ({
          ...truck,
          clientName: clientsMap[truck.client_id] || 'Невідомий клієнт',
        }));

        setTrucks(enrichedTrucks);
      } catch (error) {
        message.error('Не вдалося завантажити дані');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex, columnTitle) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          placeholder={`Пошук по ${columnTitle}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button type="primary" onClick={() => handleSearch(selectedKeys, confirm, dataIndex)} icon={<SearchOutlined />} size="small" style={{ width: 90 }}>
            Пошук
          </Button>
          <Button onClick={() => clearFilters && handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Скинути
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
  });
  
  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/trucks/${id}/`);
      setTrucks(trucks.filter(truck => truck.id !== id));
      message.success('Вантажівку успішно видалено!');
    } catch (error) {
      message.error('Не вдалося видалити вантажівку.');
    }
  };

  const columns = [
    { 
      title: 'Модель', 
      dataIndex: 'specific_model_name', 
      key: 'model',
      render: (text, record) => <Link to={`/trucks/${record.id}`}>{text}</Link>,
      sorter: (a, b) => a.specific_model_name.localeCompare(b.specific_model_name),
      ...getColumnSearchProps('specific_model_name', 'моделі'),
    },
    { 
      title: 'VIN-код', 
      dataIndex: 'last_seven_vin', 
      key: 'vin_code',
      ...getColumnSearchProps('last_seven_vin', 'VIN-коду'),
    },
    { 
      title: 'Номерний знак', 
      dataIndex: 'license_plate', 
      key: 'license_plate',
      ...getColumnSearchProps('license_plate', 'номерному знаку'),
    },
    { 
      title: 'Клієнт', 
      dataIndex: 'clientName',
      key: 'client',
      render: (text, record) => <Link to={`/clients/${record.client_id}`}>{text}</Link>,
      sorter: (a, b) => a.clientName.localeCompare(b.clientName),
    },
    {
      title: 'Дії',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/trucks/${record.id}/edit`}>
            <Button type="link" icon={<EditOutlined />}>Редагувати</Button>
          </Link>
          <Popconfirm
            title="Видалити вантажівку?"
            description="Ви впевнені?"
            onConfirm={() => handleDelete(record.id)}
            okText="Так"
            cancelText="Ні"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>Видалити</Button>
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
    </div>
  );
}

export default TrucksPage;
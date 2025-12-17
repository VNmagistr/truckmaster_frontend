import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, message, Popconfirm, Spin, Menu } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';

function TrucksPage() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientFilters, setClientFilters] = useState([]);
  const [clientFilterSearch, setClientFilterSearch] = useState(''); // Стан для пошуку в фільтрі клієнтів

  // Стани для загального пошуку в колонках
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const trucksResponse = await axiosInstance.get('/trucks/');
      
      const trucksData = trucksResponse.data.results || trucksResponse.data;

      // Просто використовуємо дані як є, без додаткового маппінгу
      setTrucks(trucksData);

      // Створюємо список унікальних клієнтів для фільтра
      const uniqueClients = [...new Set(trucksData.map(t => t.client_name).filter(Boolean))];
      const filters = uniqueClients.map(clientName => ({
        text: clientName,
        value: clientName,
      }));
      setClientFilters(filters);

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
  dataIndex: 'client_name',
  key: 'client',
  render: (text, record) => <Link to={`/clients/${record.client_id}`}>{text}</Link>,
  sorter: (a, b) => (a.client_name || '').localeCompare(b.client_name || ''),
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
    const filteredClients = clientFilters.filter(client => 
      client.text.toLowerCase().includes(clientFilterSearch.toLowerCase())
    );
    return (
      <div style={{ padding: 8 }}>
        <Input
          placeholder="Знайти клієнта..."
          value={clientFilterSearch}
          onChange={e => setClientFilterSearch(e.target.value)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {filteredClients.map(client => (
            <div 
              key={client.value}
              onClick={() => {
                setSelectedKeys([client.value]);
                confirm();
              }}
              style={{ 
                padding: '5px 12px', 
                cursor: 'pointer', 
                background: selectedKeys[0] === client.value ? '#e6f7ff' : 'transparent' 
              }}
            >
              {client.text}
            </div>
          ))}
        </div>
        <Button 
          onClick={() => {
            if (clearFilters) clearFilters();
            setClientFilterSearch('');
            confirm();
          }} 
          size="small" 
          style={{ width: '100%', marginTop: 8 }}
        >
          Скинути фільтр
        </Button>
      </div>
    );
  },
  filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
  onFilter: (value, record) => record.client_name === value,
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
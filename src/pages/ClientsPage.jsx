import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, message, Spin, Popconfirm } from 'antd';
import { UserOutlined, SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');

  useEffect(() => {
  const fetchClients = async () => {
    try {
      const response = await axiosInstance.get('/clients/');
      setClients(response.data.results || response.data);
    } catch (error) {
      message.error('Не вдалося завантажити список клієнтів');
    } finally {
      setLoading(false);
    }
  };
  fetchClients();
}, []);

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/clients/${id}/`);
      setClients(clients.filter(client => client.id !== id));
      message.success('Клієнта успішно видалено!');
    } catch (error) {
      message.error('Не вдалося видалити клієнта.');
      console.error("Помилка видалення:", error);
    }
  };

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
      record[dataIndex] ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()) : '',
  });

  const columns = [
    {
      title: 'Ім\'я',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => <Link to={`/clients/${record.id}`}>{text}</Link>,
      sorter: (a, b) => a.name.localeCompare(b.name),
      ...getColumnSearchProps('name', 'імені'),
    },
    {
      title: 'Прізвище',
      dataIndex: 'surname', 
      key: 'surname',
      sorter: (a, b) => (a.last_name || '').localeCompare(b.last_name || ''),
      ...getColumnSearchProps('surname', 'прізвищу'),
    },
    {
      title: 'Телефон',
      dataIndex: 'phone_number',
      key: 'phone',
       ...getColumnSearchProps('phone_number', 'телефону'),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
      ...getColumnSearchProps('email', 'email'),
    },
    {
      title: 'Дії',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/clients/${record.id}/edit`}>
            <Button type="link" icon={<EditOutlined />}>
              Редагувати
            </Button>
          </Link>
          <Popconfirm
            title="Видалити клієнта?"
            description="Ця дія також може вплинути на пов'язані дані. Ви впевнені?"
            onConfirm={() => handleDelete(record.id)}
            okText="Так, видалити"
            cancelText="Скасувати"
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
        <h1>Клієнти</h1>
        <Link to="/clients/new">
          <Button type="primary" icon={<PlusOutlined />}>Додати клієнта</Button>
        </Link>
      </div>
      <Table columns={columns} dataSource={clients} rowKey="id" />
    </div>
  );
}

export default ClientsPage;
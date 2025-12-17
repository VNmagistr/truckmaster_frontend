import React, { useState, useEffect } from 'react';
import { Table, Button, message, Spin, Tag, Input, Space } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { format, parseISO } from 'date-fns';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');

  useEffect(() => {
  const fetchOrders = async () => {
    try {
      const response = await axiosInstance.get('/orders/');
      setOrders(response.data.results || response.data);
    } catch (error) {
      message.error('Не вдалося завантажити список замовлень');
    } finally {
      setLoading(false);
    }
  };
  fetchOrders();
}, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Нове': return 'blue';
      case 'В роботі': return 'processing';
      case 'Завершено': return 'success';
      case 'Скасовано': return 'default';
      default: return 'default';
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
      title: '№ Замовлення',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (text, record) => <Link to={`/orders/${record.id}`}>#{text}</Link>,
      sorter: (a, b) => parseInt(a.order_number) - parseInt(b.order_number),
      ...getColumnSearchProps('order_number', 'номеру'),
    },
    {
      title: 'Клієнт',
      dataIndex: 'client',
      key: 'client',
      sorter: (a, b) => a.client.localeCompare(b.client),
      ...getColumnSearchProps('client', 'клієнту'),
    },
    {
      title: 'Вантажівка',
      dataIndex: 'truck',
      key: 'truck',
      sorter: (a, b) => a.truck.localeCompare(b.truck),
      ...getColumnSearchProps('truck', 'вантажівці'),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        status ? <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag> : '-'
      ),
      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: [
        { text: 'Нове', value: 'Нове' },
        { text: 'В роботі', value: 'В роботі' },
        { text: 'Завершено', value: 'Завершено' },
        { text: 'Скасовано', value: 'Скасовано' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Дата створення',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (dateString) => {
        if (!dateString) return '-';
        try {
          const date = parseISO(dateString);
          return format(date, 'dd.MM.yyyy HH:mm');
        } catch (error) {
          return 'Invalid Date';
        }
      },
      sorter: (a, b) => new Date(a.start_date) - new Date(b.start_date),
    },
    {
        title: 'Дії',
        key: 'actions',
        render: (_, record) => (
          <Space size="middle">
            <Link to={`/orders/${record.id}`}>Переглянути</Link>
            <Link to={`/orders/${record.id}/edit`}>Редагувати</Link>
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
        <h1>Наряд-замовлення</h1>
        <Link to="/orders/new">
          <Button type="primary" icon={<PlusOutlined />}>Створити замовлення</Button>
        </Link>
      </div>
      <Table columns={columns} dataSource={orders} rowKey="id" />
    </div>
  );
}

export default OrdersPage;
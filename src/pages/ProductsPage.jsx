// src/pages/ProductsPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Input,
  Space,
  Tag,
  Select,
  Row,
  Col,
  Statistic,
  message,
  Tooltip,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ExperimentOutlined,
  FilterOutlined,
  DropboxOutlined,
  CarOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import axiosInstance from '../api/axios';

const { Title } = Typography;
const { Option } = Select;

const ProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    oils: 0,
    filters: 0,
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedSubcategory]);

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/inventory/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      const response = await axiosInstance.get(`/inventory/subcategories/?category=${categoryId}`);
      setSubcategories(response.data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/inventory/products/';
      const params = new URLSearchParams();
      
      if (selectedCategory) params.append('subcategory__category', selectedCategory);
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory);
      if (searchText) params.append('search', searchText);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axiosInstance.get(url);
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setProducts(data);
      
      // Рахуємо статистику
      setStats({
        total: data.length,
        lowStock: data.filter(p => p.current_stock <= p.min_stock_level).length,
        oils: data.filter(p => p.subcategory_type === 'oil').length,
        filters: data.filter(p => p.subcategory_type === 'filter').length,
      });
    } catch (error) {
      message.error('Помилка завантаження товарів');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setSelectedSubcategory(null);
    if (value) {
      fetchSubcategories(value);
    } else {
      setSubcategories([]);
    }
  };

  const getCategoryIcon = (type) => {
    switch (type) {
      case 'oil': return <ExperimentOutlined style={{ color: '#faad14' }} />;
      case 'filter': return <FilterOutlined style={{ color: '#1890ff' }} />;
      case 'fluid': return <DropboxOutlined style={{ color: '#13c2c2' }} />;
      default: return <CarOutlined />;
    }
  };

  const getCategoryColor = (type) => {
    switch (type) {
      case 'oil': return 'gold';
      case 'filter': return 'blue';
      case 'fluid': return 'cyan';
      case 'washer': return 'green';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Артикул',
      dataIndex: 'sku_code',
      key: 'sku_code',
      width: 120,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Назва',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {getCategoryIcon(record.subcategory_type)}
          <span>{record.brand ? `${record.brand} ` : ''}{text}</span>
          {record.viscosity && <Tag>{record.viscosity}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Категорія',
      dataIndex: 'subcategory_name',
      key: 'subcategory_name',
      render: (text, record) => (
        <Tag color={getCategoryColor(record.subcategory_type)}>
          {text || 'Без категорії'}
        </Tag>
      ),
    },
    {
      title: 'Ціна',
      dataIndex: 'selling_price',
      key: 'selling_price',
      width: 120,
      align: 'right',
      render: (price, record) => (
        <div>
          <div><strong>{parseFloat(price).toLocaleString()} ₴</strong></div>
          {record.price_per_liter && (
            <small style={{ color: '#888' }}>
              {parseFloat(record.price_per_liter).toFixed(2)} ₴/л
            </small>
          )}
        </div>
      ),
    },
    {
      title: 'Залишок',
      dataIndex: 'current_stock',
      key: 'current_stock',
      width: 120,
      align: 'center',
      render: (stock, record) => {
        const isLow = stock <= record.min_stock_level;
        return (
          <Tooltip title={isLow ? 'Низький залишок!' : ''}>
            <Tag color={isLow ? 'red' : 'green'} icon={isLow ? <WarningOutlined /> : null}>
              {stock} {record.unit}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/products/${record.id}`)}>
          Деталі
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          <ExperimentOutlined /> Товари та матеріали
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>
          Додати товар
        </Button>
      </div>

      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Всього товарів" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Низький залишок" 
              value={stats.lowStock} 
              valueStyle={{ color: stats.lowStock > 0 ? '#cf1322' : '#3f8600' }}
              prefix={stats.lowStock > 0 ? <WarningOutlined /> : null}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Оливи" value={stats.oils} prefix={<ExperimentOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Фільтри" value={stats.filters} prefix={<FilterOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Фільтри */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Пошук по назві або артикулу"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={fetchProducts}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="Категорія"
            style={{ width: 180 }}
            allowClear
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            {categories.map(cat => (
              <Option key={cat.id} value={cat.id}>
                {getCategoryIcon(cat.category_type)} {cat.name}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Підкатегорія"
            style={{ width: 200 }}
            allowClear
            value={selectedSubcategory}
            onChange={setSelectedSubcategory}
            disabled={!selectedCategory}
          >
            {subcategories.map(sub => (
              <Option key={sub.id} value={sub.id}>{sub.name}</Option>
            ))}
          </Select>
          <Button onClick={fetchProducts}>Застосувати</Button>
          <Button onClick={() => {
            setSearchText('');
            setSelectedCategory(null);
            setSelectedSubcategory(null);
            fetchProducts();
          }}>
            Скинути
          </Button>
        </Space>
      </Card>

      {/* Таблиця товарів */}
      <Card>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Всього: ${total} товарів`,
          }}
        />
      </Card>
    </div>
  );
};

export default ProductsPage;

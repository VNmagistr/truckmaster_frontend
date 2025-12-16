// src/pages/StockPage.jsx

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
  Tabs,
  Progress,
  Modal,
  Form,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  WarningOutlined,
  SwapOutlined,
  ImportOutlined,
  ExportOutlined,
  HomeOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import axiosInstance from '../api/axios';

const { Title } = Typography;
const { Option } = Select;

const StockPage = () => {
  const navigate = useNavigate();
  const [stock, setStock] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
  });

  // Модалки
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (warehouses.length > 0) {
      const defaultWarehouse = warehouses.find(w => w.is_default);
      setSelectedWarehouse(defaultWarehouse?.id || warehouses[0]?.id);
    }
  }, [warehouses]);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchStock();
    }
  }, [selectedWarehouse, showLowStock]);

  const fetchWarehouses = async () => {
    try {
      const response = await axiosInstance.get('/inventory/warehouses/');
      setWarehouses(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchStock = async () => {
    setLoading(true);
    try {
      let url = `/inventory/stock/?warehouse=${selectedWarehouse}`;
      if (showLowStock) url += '&low_stock=true';
      if (searchText) url += `&search=${searchText}`;
      
      const response = await axiosInstance.get(url);
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setStock(data);
      
      // Статистика
      const lowStock = data.filter(s => s.is_low_stock).length;
      const totalValue = data.reduce((sum, s) => sum + (parseFloat(s.product_price || 0) * parseFloat(s.quantity || 0)), 0);
      
      setStats({
        totalItems: data.length,
        lowStockItems: lowStock,
        totalValue: totalValue,
      });
    } catch (error) {
      message.error('Помилка завантаження залишків');
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveStock = async (values) => {
    try {
      await axiosInstance.post('/inventory/movements/', {
        movement_type: 'in',
        product: values.product,
        quantity: values.quantity,
        warehouse_to: selectedWarehouse,
        supplier: values.supplier,
        invoice_number: values.invoice_number,
        purchase_price: values.purchase_price,
        notes: values.notes,
      });
      message.success('Товар оприбутковано');
      setReceiveModalVisible(false);
      form.resetFields();
      fetchStock();
    } catch (error) {
      message.error('Помилка оприбуткування');
      console.error(error);
    }
  };

  const handleTransferStock = async (values) => {
    try {
      await axiosInstance.post('/inventory/movements/', {
        movement_type: 'transfer',
        product: selectedProduct.product_id,
        quantity: values.quantity,
        warehouse_from: selectedWarehouse,
        warehouse_to: values.warehouse_to,
        notes: values.notes,
      });
      message.success('Товар переміщено');
      setTransferModalVisible(false);
      form.resetFields();
      setSelectedProduct(null);
      fetchStock();
    } catch (error) {
      message.error('Помилка переміщення');
      console.error(error);
    }
  };

  const getStockStatus = (record) => {
    const percentage = record.product_min_stock > 0 
      ? (record.quantity / record.product_min_stock) * 100 
      : 100;
    
    if (percentage <= 25) return { color: '#ff4d4f', status: 'Критично' };
    if (percentage <= 50) return { color: '#faad14', status: 'Низький' };
    if (percentage <= 100) return { color: '#52c41a', status: 'Норма' };
    return { color: '#1890ff', status: 'Достатньо' };
  };

  const columns = [
    {
      title: 'Товар',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text, record) => (
        <div>
          <div><strong>{text}</strong></div>
          <small style={{ color: '#888' }}>{record.product_sku}</small>
        </div>
      ),
    },
    {
      title: 'Категорія',
      dataIndex: 'product_category',
      key: 'product_category',
      render: (text) => <Tag>{text || 'Без категорії'}</Tag>,
    },
    {
      title: 'Кількість',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 150,
      render: (qty, record) => {
        const { color, status } = getStockStatus(record);
        const percentage = record.product_min_stock > 0 
          ? Math.min((qty / record.product_min_stock) * 100, 100) 
          : 100;
        
        return (
          <div>
            <div style={{ marginBottom: 4 }}>
              <strong style={{ fontSize: 16 }}>{qty}</strong>
              <span style={{ color: '#888' }}> {record.product_unit}</span>
              {record.reserved > 0 && (
                <Tooltip title="Зарезервовано">
                  <Tag color="orange" style={{ marginLeft: 8 }}>-{record.reserved}</Tag>
                </Tooltip>
              )}
            </div>
            <Progress 
              percent={percentage} 
              size="small" 
              strokeColor={color}
              showInfo={false}
            />
            <small style={{ color }}>{status}</small>
          </div>
        );
      },
    },
    {
      title: 'Мін. залишок',
      dataIndex: 'product_min_stock',
      key: 'product_min_stock',
      width: 100,
      align: 'center',
    },
    {
      title: 'Місце',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Переміщення">
            <Button 
              icon={<SwapOutlined />} 
              size="small"
              onClick={() => {
                setSelectedProduct(record);
                setTransferModalVisible(true);
              }}
            />
          </Tooltip>
          <Button 
            type="link" 
            size="small"
            onClick={() => navigate(`/stock/movements?product=${record.product_id}`)}
          >
            Історія
          </Button>
        </Space>
      ),
    },
  ];

  const warehouseTabs = warehouses.map(w => ({
    key: w.id.toString(),
    label: (
      <span>
        {w.is_default ? <HomeOutlined /> : <InboxOutlined />} {w.name}
      </span>
    ),
  }));

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          <InboxOutlined /> Склад
        </Title>
        <Space>
          <Button 
            type="primary" 
            icon={<ImportOutlined />} 
            onClick={() => setReceiveModalVisible(true)}
          >
            Прийняти товар
          </Button>
          <Button 
            icon={<ExportOutlined />} 
            onClick={() => navigate('/stock/movements')}
          >
            Рух товарів
          </Button>
        </Space>
      </div>

      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="Позицій на складі" value={stats.totalItems} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Низький залишок" 
              value={stats.lowStockItems}
              valueStyle={{ color: stats.lowStockItems > 0 ? '#cf1322' : '#3f8600' }}
              prefix={stats.lowStockItems > 0 ? <WarningOutlined /> : null}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Вартість залишків" 
              value={stats.totalValue}
              precision={2}
              suffix="₴"
            />
          </Card>
        </Col>
      </Row>

      {/* Вкладки складів */}
      <Card>
        <Tabs 
          activeKey={selectedWarehouse?.toString()} 
          onChange={(key) => setSelectedWarehouse(parseInt(key))}
          items={warehouseTabs}
        />
        
        {/* Фільтри */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="Пошук товару"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={fetchStock}
            style={{ width: 250 }}
            allowClear
          />
          <Button 
            type={showLowStock ? 'primary' : 'default'}
            danger={showLowStock}
            icon={<WarningOutlined />}
            onClick={() => setShowLowStock(!showLowStock)}
          >
            Тільки низький залишок
          </Button>
          <Button onClick={fetchStock}>Оновити</Button>
        </Space>

        {/* Таблиця */}
        <Table
          columns={columns}
          dataSource={stock}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Всього: ${total} позицій`,
          }}
          rowClassName={(record) => record.is_low_stock ? 'low-stock-row' : ''}
        />
      </Card>

      {/* Модалка прийому товару */}
      <Modal
        title="Прийняти товар на склад"
        open={receiveModalVisible}
        onCancel={() => {
          setReceiveModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Прийняти"
        cancelText="Скасувати"
      >
        <Form form={form} layout="vertical" onFinish={handleReceiveStock}>
          <Form.Item 
            name="product" 
            label="Товар" 
            rules={[{ required: true, message: 'Виберіть товар' }]}
          >
            <Select
              showSearch
              placeholder="Виберіть товар"
              optionFilterProp="children"
            >
              {/* Тут буде список товарів */}
            </Select>
          </Form.Item>
          <Form.Item 
            name="quantity" 
            label="Кількість" 
            rules={[{ required: true, message: 'Введіть кількість' }]}
          >
            <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="supplier" label="Постачальник">
            <Input />
          </Form.Item>
          <Form.Item name="invoice_number" label="Номер накладної">
            <Input />
          </Form.Item>
          <Form.Item name="purchase_price" label="Закупівельна ціна">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} addonAfter="₴" />
          </Form.Item>
          <Form.Item name="notes" label="Примітки">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Модалка переміщення */}
      <Modal
        title={`Переміщення: ${selectedProduct?.product_name || ''}`}
        open={transferModalVisible}
        onCancel={() => {
          setTransferModalVisible(false);
          form.resetFields();
          setSelectedProduct(null);
        }}
        onOk={() => form.submit()}
        okText="Перемістити"
        cancelText="Скасувати"
      >
        <Form form={form} layout="vertical" onFinish={handleTransferStock}>
          <Form.Item 
            name="warehouse_to" 
            label="На склад" 
            rules={[{ required: true, message: 'Виберіть склад' }]}
          >
            <Select placeholder="Виберіть склад призначення">
              {warehouses
                .filter(w => w.id !== selectedWarehouse)
                .map(w => (
                  <Option key={w.id} value={w.id}>{w.name}</Option>
                ))
              }
            </Select>
          </Form.Item>
          <Form.Item 
            name="quantity" 
            label={`Кількість (доступно: ${selectedProduct?.quantity || 0})`}
            rules={[
              { required: true, message: 'Введіть кількість' },
              { type: 'number', max: selectedProduct?.quantity, message: 'Недостатньо на складі' }
            ]}
          >
            <InputNumber 
              min={0.01} 
              max={selectedProduct?.quantity} 
              step={0.01} 
              style={{ width: '100%' }} 
            />
          </Form.Item>
          <Form.Item name="notes" label="Примітки">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .low-stock-row {
          background-color: #fff2f0;
        }
      `}</style>
    </div>
  );
};

export default StockPage;

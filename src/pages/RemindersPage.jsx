// src/pages/RemindersPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Select,
  Row,
  Col,
  Statistic,
  message,
  Typography,
  Modal,
  Tooltip,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CarOutlined,
} from '@ant-design/icons';
import axiosInstance from '../api/axios';

const { Title } = Typography;
const { Option } = Select;

const RemindersPage = () => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active'); // active, all, completed
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    overdue: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchReminders();
  }, [statusFilter, priorityFilter]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      let url = '/maintenance/reminders/';
      
      if (statusFilter === 'active') {
        url = '/maintenance/reminders/pending/';
      } else if (statusFilter === 'overdue') {
        url = '/maintenance/reminders/overdue/';
      }
      
      const params = new URLSearchParams();
      if (priorityFilter) params.append('priority', priorityFilter);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axiosInstance.get(url);
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setReminders(data);
      
      // Отримуємо статистику
      const allResponse = await axiosInstance.get('/maintenance/reminders/');
      const allData = Array.isArray(allResponse.data) ? allResponse.data : allResponse.data.results || [];
      
      setStats({
        pending: allData.filter(r => r.status === 'pending').length,
        overdue: allData.filter(r => r.status === 'overdue').length,
        completed: allData.filter(r => r.status === 'completed').length,
      });
    } catch (error) {
      message.error('Помилка завантаження нагадувань');
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    Modal.confirm({
      title: 'Позначити як виконано?',
      content: 'Це нагадування буде позначено як виконане.',
      okText: 'Так, виконано',
      cancelText: 'Скасувати',
      onOk: async () => {
        try {
          await axiosInstance.post(`/maintenance/reminders/${id}/complete/`);
          message.success('Нагадування виконано');
          fetchReminders();
        } catch (error) {
          message.error('Помилка');
        }
      },
    });
  };

  const handleDismiss = async (id) => {
    Modal.confirm({
      title: 'Відхилити нагадування?',
      content: 'Це нагадування буде відхилено.',
      okText: 'Відхилити',
      cancelText: 'Скасувати',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await axiosInstance.post(`/maintenance/reminders/${id}/dismiss/`);
          message.success('Нагадування відхилено');
          fetchReminders();
        } catch (error) {
          message.error('Помилка');
        }
      },
    });
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'blue', icon: <ClockCircleOutlined />, text: 'Очікує' },
      notified: { color: 'orange', icon: <BellOutlined />, text: 'Сповіщено' },
      overdue: { color: 'red', icon: <ExclamationCircleOutlined />, text: 'Прострочено' },
      completed: { color: 'green', icon: <CheckCircleOutlined />, text: 'Виконано' },
      dismissed: { color: 'default', icon: <CloseCircleOutlined />, text: 'Відхилено' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const getPriorityTag = (priority) => {
    const priorityConfig = {
      low: { color: 'default', text: 'Низький' },
      medium: { color: 'blue', text: 'Середній' },
      high: { color: 'orange', text: 'Високий' },
      critical: { color: 'red', text: 'Критичний' },
    };
    const config = priorityConfig[priority] || priorityConfig.medium;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'Вантажівка',
      dataIndex: 'truck_display',
      key: 'truck_display',
      render: (text, record) => (
        <Button 
          type="link" 
          icon={<CarOutlined />}
          onClick={() => navigate(`/trucks/${record.truck}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Нагадування',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div><strong>{text}</strong></div>
          {record.subcategory_name && (
            <small style={{ color: '#888' }}>{record.subcategory_name}</small>
          )}
        </div>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Пріоритет',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      render: (priority) => getPriorityTag(priority),
    },
    {
      title: 'Цільова дата',
      dataIndex: 'target_date',
      key: 'target_date',
      width: 120,
      render: (date, record) => {
        if (!date) return '-';
        const isOverdue = record.is_overdue;
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : 'inherit' }}>
            {new Date(date).toLocaleDateString('uk-UA')}
          </span>
        );
      },
    },
    {
      title: 'Цільовий пробіг',
      dataIndex: 'target_mileage',
      key: 'target_mileage',
      width: 130,
      render: (mileage) => mileage ? `${mileage.toLocaleString()} км` : '-',
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 150,
      render: (_, record) => {
        if (record.status === 'completed' || record.status === 'dismissed') {
          return <span style={{ color: '#888' }}>—</span>;
        }
        return (
          <Space>
            <Tooltip title="Виконано">
              <Button 
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleComplete(record.id)}
              />
            </Tooltip>
            <Tooltip title="Відхилити">
              <Button 
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleDismiss(record.id)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          <BellOutlined /> Нагадування про ТО
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/reminders/new')}>
          Створити нагадування
        </Button>
      </div>

      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card 
            hoverable 
            onClick={() => setStatusFilter('active')}
            style={{ cursor: 'pointer', borderColor: statusFilter === 'active' ? '#1890ff' : undefined }}
          >
            <Statistic 
              title="Очікують" 
              value={stats.pending} 
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            hoverable 
            onClick={() => setStatusFilter('overdue')}
            style={{ cursor: 'pointer', borderColor: statusFilter === 'overdue' ? '#ff4d4f' : undefined }}
          >
            <Statistic 
              title="Прострочені" 
              value={stats.overdue}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: stats.overdue > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            hoverable 
            onClick={() => setStatusFilter('all')}
            style={{ cursor: 'pointer', borderColor: statusFilter === 'all' ? '#52c41a' : undefined }}
          >
            <Statistic 
              title="Виконано" 
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Фільтри і таблиця */}
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
          >
            <Option value="active">Активні</Option>
            <Option value="overdue">Прострочені</Option>
            <Option value="all">Всі</Option>
          </Select>
          <Select
            placeholder="Пріоритет"
            allowClear
            value={priorityFilter}
            onChange={setPriorityFilter}
            style={{ width: 150 }}
          >
            <Option value="critical">Критичний</Option>
            <Option value="high">Високий</Option>
            <Option value="medium">Середній</Option>
            <Option value="low">Низький</Option>
          </Select>
          <Button onClick={fetchReminders}>Оновити</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={reminders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 15,
            showTotal: (total) => `Всього: ${total} нагадувань`,
          }}
          rowClassName={(record) => {
            if (record.status === 'overdue') return 'overdue-row';
            if (record.priority === 'critical') return 'critical-row';
            return '';
          }}
        />
      </Card>

      <style>{`
        .overdue-row {
          background-color: #fff2f0;
        }
        .critical-row {
          background-color: #fff7e6;
        }
      `}</style>
    </div>
  );
};

export default RemindersPage;

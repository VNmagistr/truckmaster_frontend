import React, { useState, useEffect, useMemo } from 'react';
import { Form, Button, Card, message, Select, Input, InputNumber, Space, Typography, Statistic } from 'antd';
import { useNavigate } from 'react-router-dom';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axios';

const { Option, OptGroup } = Select;
const { Title } = Typography;

function AddOrderPage() {
  const [form] = Form.useForm();
  const [clients, setClients] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [workCategories, setWorkCategories] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axiosInstance.get('/clients/');
        setClients(response.data);
      } catch (error) {
        message.error('Не вдалося завантажити список клієнтів');
      }
    };
    const fetchWorkCategories = async () => {
      try {
        const response = await axiosInstance.get('/work-categories/');
        setWorkCategories(response.data);
      } catch (error) {
        message.error('Не вдалося завантажити прайс-лист робіт');
      }
    };
    fetchClients();
    fetchWorkCategories();
  }, []);

  useEffect(() => {
    if (!selectedClientId) {
      setTrucks([]);
      form.setFieldsValue({ truck: null, works: [] });
      return;
    }
    axiosInstance.get(`/trucks/?client=${selectedClientId}`).then(res => setTrucks(res.data));
  }, [selectedClientId, form]);

  const worksPriceMap = useMemo(() => {
    const map = new Map();
    if (workCategories) {
      workCategories.forEach(category => {
        const price = category.price_per_hour;
        if (category.works) {
          category.works.forEach(work => {
            map.set(work.id, price);
          });
        }
      });
    }
    return map;
  }, [workCategories]);

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
      <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
        <Form.Item name="order_number" label="Номер наряду-замовлення (необов'язково)">
          <Input placeholder="Залиште порожнім для автоматичної нумерації" />
        </Form.Item>

        <Form.Item name="client" label="Клієнт" rules={[{ required: true }]}>
          <Select showSearch placeholder="Оберіть клієнта" onChange={(value) => setSelectedClientId(value)} filterOption={(input, option) => (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())}>
            {clients.map(client => (
              <Option key={client.id} value={client.id}>{client.name} {client.last_name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="truck" label="Вантажівка" rules={[{ required: true }]}>
          <Select showSearch placeholder="Оберіть вантажівку" disabled={!selectedClientId} filterOption={(input, option) => (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())}>
            {trucks.map(truck => (
              <Option key={truck.id} value={truck.id}>{truck.specific_model_name} ({truck.license_plate})</Option>
            ))}
          </Select>
        </Form.Item>

        <Title level={4} style={{ marginTop: '20px' }}>Список робіт</Title>
        <Form.List name="works">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8, flexWrap: 'wrap' }} align="baseline">
                  <Form.Item {...restField} name={[name, 'work']} rules={[{ required: true, message: 'Оберіть роботу' }]} style={{ width: '400px' }}>
                    <Select 
                      placeholder="Оберіть роботу з прайсу" 
                      showSearch
                      filterOption={(input, option) => 
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {workCategories.map(category => (
                        <OptGroup label={`${category.name} (${category.price_per_hour} грн/год)`} key={category.id}>
                          {category.works.map(work => (
                            <Option key={work.id} value={work.id} label={work.name}>
                              {work.name}
                            </Option>
                          ))}
                        </OptGroup>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item {...restField} name={[name, 'duration_hours']} rules={[{ required: true, message: 'Вкажіть години' }]}>
                    <InputNumber placeholder="Години" min={0} step={0.5} style={{ width: '100px' }} />
                  </Form.Item>

                  <Form.Item {...restField} name={[name, 'custom_description']} style={{ width: '300px' }}>
                    <Input placeholder="Додатковий опис (необов'язково)" />
                  </Form.Item>

                  <Form.Item noStyle shouldUpdate>
                    {() => {
                      const workId = form.getFieldValue(['works', name, 'work']);
                      const hours = form.getFieldValue(['works', name, 'duration_hours']) || 0;
                      const pricePerHour = parseFloat(worksPriceMap.get(workId)) || 0;
                      const price = pricePerHour * hours;
                      return <Statistic value={price} precision={2} suffix="грн" style={{ width: '120px' }} />;
                    }}
                  </Form.Item>

                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add({ duration_hours: 1 })} block icon={<PlusOutlined />}>Додати роботу</Button>
              </Form.Item>
            </>
          )}
        </Form.List>
        
        <Form.Item label="Загальна сума">
          <Form.Item noStyle shouldUpdate>
            {() => {
              const works = form.getFieldValue('works') || [];
              const total = works.reduce((sum, currentWork) => {
                const pricePerHour = parseFloat(worksPriceMap.get(currentWork?.work)) || 0;
                const hours = currentWork?.duration_hours || 0;
                return sum + (pricePerHour * hours);
              }, 0);
              return <Statistic value={total} precision={2} suffix="грн" />;
            }}
          </Form.Item>
        </Form.Item>

        <Form.Item name="status" label="Статус" initialValue="new" rules={[{ required: true }]}>
           <Select>
             <Option value="new">Нове</Option>
             <Option value="in_progress">В роботі</Option>
             <Option value="completed">Завершено</Option>
             <Option value="canceled">Скасовано</Option>
           </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">Створити замовлення</Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate('/orders')}>Скасувати</Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default AddOrderPage;
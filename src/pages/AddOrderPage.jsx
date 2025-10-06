import React, { useState, useEffect } from 'react';
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
  
  const handleWorkChange = (workId, fieldName) => {
    let selectedWork = null;
    for (const category of workCategories) {
      const foundWork = category.works.find(w => w.id === workId);
      if (foundWork) {
        selectedWork = foundWork;
        break;
      }
    }

    if (selectedWork) {
      const works = form.getFieldValue('works');
      const newWorks = [...works];
      newWorks[fieldName] = {
        ...newWorks[fieldName],
        cost: selectedWork.price,
      };
      form.setFieldsValue({ works: newWorks });
    }
  };

  return (
    <Card title="Створення нового наряд-замовлення">
      <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
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
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  {/* Поле 1: Опис проблеми */}
                  <Form.Item {...restField} name={[name, 'custom_description']} rules={[{ required: true, message: 'Введіть опис проблеми' }]} style={{ width: '350px' }}>
                    <Input placeholder="Опис проблеми зі слів водія" />
                  </Form.Item>
                  
                  {/* Поле 2: Підбір роботи (з автофільтрацією) */}
                  <Form.Item 
                    noStyle 
                    shouldUpdate={(prevValues, currentValues) => 
                      prevValues.works?.[name]?.custom_description !== currentValues.works?.[name]?.custom_description
                    }
                  >
                    {({ getFieldValue }) => {
                      const description = getFieldValue(['works', name, 'custom_description']) || '';
                      const keywords = description.toLowerCase().split(' ').filter(word => word.length > 2);
                      
                      const filteredCategories = keywords.length > 0
                        ? workCategories.map(category => ({
                            ...category,
                            works: category.works.filter(work =>
                              keywords.some(keyword => work.name.toLowerCase().includes(keyword))
                            )
                          })).filter(category => category.works.length > 0)
                        : workCategories;

                      return (
                        <Form.Item {...restField} name={[name, 'work']} rules={[{ required: true, message: 'Оберіть роботу' }]} style={{ width: '350px' }}>
                          <Select placeholder="Підбір роботи з прайсу" showSearch onChange={(value) => handleWorkChange(value, name)} filterOption={(input, option) => (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())}>
                            {filteredCategories.map(category => (
                              <OptGroup label={category.name} key={category.id}>
                                {category.works.map(work => (
                                  <Option key={work.id} value={work.id}>{work.name}</Option>
                                ))}
                              </OptGroup>
                            ))}
                          </Select>
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                  
                  {/* Поле 3: Вартість (автозаповнюється) */}
                  <Form.Item {...restField} name={[name, 'cost']} rules={[{ required: true, message: 'Вкажіть вартість' }]}>
                    <InputNumber placeholder="Вартість, грн" min={0} style={{ width: '150px' }} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add({ cost: 0 })} block icon={<PlusOutlined />}>Додати роботу</Button>
              </Form.Item>
            </>
          )}
        </Form.List>
        
        <Form.Item label="Загальна сума">
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.works !== curr.works}>
            {({ getFieldValue }) => {
              const works = getFieldValue('works') || [];
              const total = works.reduce((sum, work) => sum + (parseFloat(work?.cost) || 0), 0);
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
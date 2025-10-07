import React, { useState, useEffect, useMemo } from 'react';
import { Form, Button, Card, message, Select, Input, InputNumber, Space, Typography, Statistic, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axios';

const { Option, OptGroup } = Select;
const { Title } = Typography;

function EditOrderPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null); // Стан для збереження початкових даних
  const [clients, setClients] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [workCategories, setWorkCategories] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  // Завантажуємо всі довідники та дані існуючого замовлення
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, workCategoriesRes, orderRes] = await Promise.all([
          axiosInstance.get('/clients/'),
          axiosInstance.get('/work-categories/'),
          axiosInstance.get(`/orders/${id}/`)
        ]);
        
        const loadedClients = clientsRes.data;
        const loadedWorkCategories = workCategoriesRes.data;
        const loadedOrder = orderRes.data;

        setClients(loadedClients);
        setWorkCategories(loadedWorkCategories);
        setOrderData(loadedOrder);

        const initialClientId = loadedOrder.client.id;
        setSelectedClientId(initialClientId);

        const trucksRes = await axiosInstance.get(`/trucks/?client=${initialClientId}`);
        setTrucks(trucksRes.data);
        
        // Заповнюємо форму отриманими даними
        form.setFieldsValue({
          order_number: loadedOrder.order_number,
          client: initialClientId,
          truck: loadedOrder.truck.id,
          status: loadedOrder.status, // Використовуємо код статусу ('new', 'in_progress' etc.)
          works: loadedOrder.works.map(work => ({
            work: work.work.id,
            duration_hours: work.duration_hours,
            custom_description: work.custom_description,
            cost: work.cost // Заповнюємо вартість, яка вже є
          }))
        });

      } catch (error) {
        message.error('Не вдалося завантажити дані для редагування');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, form]);

  // Реакція на зміну клієнта у формі
  useEffect(() => {
    if (!selectedClientId) return;
    axiosInstance.get(`/trucks/?client=${selectedClientId}`).then(res => {
        setTrucks(res.data);
        // Скидаємо вибір вантажівки, якщо вона не належить новому клієнту
        const currentTruckId = form.getFieldValue('truck');
        if (currentTruckId && !res.data.some(truck => truck.id === currentTruckId)) {
            form.setFieldsValue({ truck: null });
        }
    });
  }, [selectedClientId, form]);

  const worksMap = useMemo(() => {
    const map = new Map();
    if (workCategories) {
      workCategories.forEach(category => {
        if (category.works) {
          category.works.forEach(work => {
            map.set(work.id, work);
          });
        }
      });
    }
    return map;
  }, [workCategories]);

  const onFinish = async (values) => {
  try {
    // Створюємо копію даних, щоб їх можна було безпечно змінювати
    const valuesToSend = { ...values };

    // Перевіряємо, чи є список робіт, і видаляємо з нього поле 'cost'
    if (valuesToSend.works) {
      valuesToSend.works = valuesToSend.works.map(work => {
        const { cost, ...rest } = work; // Видаляємо 'cost' з кожного об'єкта роботи
        return rest;
      });
    }

    // Відправляємо очищені дані
    await axiosInstance.patch(`/orders/${id}/`, valuesToSend);
    
    message.success('Наряд-замовлення успішно оновлено!');
    navigate(`/orders/${id}`);
  } catch (error) {
    message.error('Помилка при оновленні замовлення');
    console.error("Помилка валідації від сервера:", error.response?.data);
  }
};

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Spin size="large" /></div>;
  }

  return (
    <Card title={`Редагування наряд-замовлення №${orderData?.order_number || id}`}>
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
                    <Select placeholder="Оберіть роботу з прайсу" showSearch>
                      {workCategories.map(category => (
                        <OptGroup label={category.name} key={category.id}>
                          {category.works.map(work => (
                            <Option key={work.id} value={work.id}>{work.name}</Option>
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
                      const work = worksMap.get(workId);
                      const price = work ? parseFloat(work.price_per_hour) * hours : 0;
                      // Встановлюємо значення вартості в поле форми для відправки на бекенд
                      const works = form.getFieldValue('works');
                      if (works && works[name] && works[name].cost !== price) {
                        const newWorks = [...works];
                        newWorks[name] = { ...newWorks[name], cost: price };
                        form.setFieldsValue({ works: newWorks });
                      }
                      return <Statistic value={price} precision={2} suffix="грн" style={{ width: '120px' }} />;
                    }}
                  </Form.Item>
                  
                  {/* Це поле потрібне, щоб зберігати розраховану вартість, але воно невидиме */}
                  <Form.Item {...restField} name={[name, 'cost']} noStyle><Input type="hidden" /></Form.Item>

                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add({ duration_hours: 1, cost: 0 })} block icon={<PlusOutlined />}>Додати роботу</Button>
              </Form.Item>
            </>
          )}
        </Form.List>
        
        <Form.Item label="Загальна сума">
          <Form.Item noStyle shouldUpdate>
            {() => {
              const works = form.getFieldValue('works') || [];
              const total = works.reduce((sum, currentWork) => sum + (parseFloat(currentWork?.cost) || 0), 0);
              return <Statistic value={total} precision={2} suffix="грн" />;
            }}
          </Form.Item>
        </Form.Item>

        <Form.Item name="status" label="Статус" rules={[{ required: true }]}>
           <Select>
             <Option value="new">Нове</Option>
             <Option value="in_progress">В роботі</Option>
             <Option value="completed">Завершено</Option>
             <Option value="canceled">Скасовано</Option>
           </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">Зберегти зміни</Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate(`/orders/${id}`)}>Скасувати</Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default EditOrderPage;
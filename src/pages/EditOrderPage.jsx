import React, { useState, useEffect, useMemo } from 'react';
import { Form, Button, Card, message, Select, Input, InputNumber, Space, Typography, Statistic, Spin, Upload } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axios';

const { Option, OptGroup } = Select;
const { Title } = Typography;

function EditOrderPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [clients, setClients] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [workCategories, setWorkCategories] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  const carPhotoList = Form.useWatch('car_photo', form);
  const odometerPhotoList = Form.useWatch('odometer_photo', form);
  const dashboardPhotoList = Form.useWatch('dashboard_photo', form);

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
        
        form.setFieldsValue({
          order_number: loadedOrder.order_number,
          client: initialClientId,
          truck: loadedOrder.truck.id,
          status: loadedOrder.status,
          car_photo: loadedOrder.car_photo ? [{ uid: '-1', name: 'image.png', status: 'done', url: loadedOrder.car_photo }] : [],
          odometer_photo: loadedOrder.odometer_photo ? [{ uid: '-1', name: 'image.png', status: 'done', url: loadedOrder.odometer_photo }] : [],
          dashboard_photo: loadedOrder.dashboard_photo ? [{ uid: '-1', name: 'image.png', status: 'done', url: loadedOrder.dashboard_photo }] : [],
          works: loadedOrder.works.map(work => ({
            work: work.work.id,
            duration_hours: work.duration_hours,
            custom_description: work.custom_description,
            cost: work.cost
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

  useEffect(() => {
    if (!selectedClientId) return;
    axiosInstance.get(`/trucks/?client=${selectedClientId}`).then(res => {
        setTrucks(res.data);
        const currentTruckId = form.getFieldValue('truck');
        if (currentTruckId && !res.data.some(truck => truck.id === currentTruckId)) {
            form.setFieldsValue({ truck: null });
        }
    });
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
    // ... логіка відправки форми без змін ...
  };

  const normFile = (e) => {
    if (Array.isArray(e)) { return e; }
    return e && e.fileList;
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Обрати</div>
    </div>
  );

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
            {clients.map(client => (<Option key={client.id} value={client.id}>{client.name} {client.last_name}</Option>))}
          </Select>
        </Form.Item>
        <Form.Item name="truck" label="Вантажівка" rules={[{ required: true }]}>
          <Select showSearch placeholder="Оберіть вантажівку" disabled={!selectedClientId} filterOption={(input, option) => (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())}>
            {trucks.map(truck => (<Option key={truck.id} value={truck.id}>{truck.specific_model_name} ({truck.license_plate})</Option>))}
          </Select>
        </Form.Item>
        <Space align="start">
          <Form.Item name="car_photo" label="Фото держномера" valuePropName="fileList" getValueFromEvent={normFile} rules={[{ required: true, message: 'Будь ласка, завантажте фото держномера!' }]}>
            <Upload listType="picture-card" maxCount={1} beforeUpload={() => false}>{(carPhotoList || []).length < 1 && uploadButton}</Upload>
          </Form.Item>
          <Form.Item name="odometer_photo" label="Фото пробігу" valuePropName="fileList" getValueFromEvent={normFile} rules={[{ required: true, message: 'Будь ласка, завантажте фото пробігу!' }]}>
            <Upload listType="picture-card" maxCount={1} beforeUpload={() => false}>{(odometerPhotoList || []).length < 1 && uploadButton}</Upload>
          </Form.Item>
          <Form.Item name="dashboard_photo" label="Фото панелі приладів" valuePropName="fileList" getValueFromEvent={normFile} rules={[{ required: true, message: 'Будь ласка, завантажте фото панелі!' }]}>
            <Upload listType="picture-card" maxCount={1} beforeUpload={() => false}>{(dashboardPhotoList || []).length < 1 && uploadButton}</Upload>
          </Form.Item>
        </Space>
        <Title level={4} style={{ marginTop: '20px' }}>Список робіт</Title>
        <Form.List name="works">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8, flexWrap: 'wrap' }} align="baseline">
                  <Form.Item {...restField} name={[name, 'work']} rules={[{ required: true, message: 'Оберіть роботу' }]} style={{ width: '400px' }}>
                    <Select placeholder="Оберіть роботу з прайсу" showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}>
                      {workCategories.map(category => (<OptGroup label={`${category.name} (${category.price_per_hour} грн/год)`} key={category.id}>{category.works.map(work => (<Option key={work.id} value={work.id} label={work.name}>{work.name}</Option>))}</OptGroup>))}
                    </Select>
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'duration_hours']} rules={[{ required: true, message: 'Вкажіть години' }]}>
                    <InputNumber placeholder="Години" min={0} step={0.5} style={{ width: '100px' }} />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'custom_description']} style={{ width: '300px' }}><Input placeholder="Додатковий опис (необов'язково)" /></Form.Item>
                  <Form.Item {...restField} name={[name, 'cost']} noStyle><Input type="hidden" /></Form.Item>
                  <Form.Item noStyle shouldUpdate>
                    {() => {
                      const workId = form.getFieldValue(['works', name, 'work']);
                      const hours = form.getFieldValue(['works', name, 'duration_hours']) || 0;
                      const pricePerHour = parseFloat(worksPriceMap.get(workId)) || 0;
                      const price = pricePerHour * hours;
                      const currentWorks = form.getFieldValue('works');
                      if (currentWorks && currentWorks[name] && currentWorks[name].cost !== price) {
                        const newWorks = [...currentWorks];
                        newWorks[name] = { ...newWorks[name], cost: price };
                        form.setFieldsValue({ works: newWorks });
                      }
                      return <Statistic value={price} precision={2} suffix="грн" style={{ width: '120px' }} />;
                    }}
                  </Form.Item>
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
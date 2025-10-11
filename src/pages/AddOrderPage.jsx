import React, { useState, useEffect, useMemo } from 'react';
import { Form, Button, Card, message, Select, Input, InputNumber, Space, Typography, Statistic, Upload } from 'antd';
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

  const carPhotoList = Form.useWatch('car_photo', form);
  const odometerPhotoList = Form.useWatch('odometer_photo', form);
  const dashboardPhotoList = Form.useWatch('dashboard_photo', form);

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
    const formData = new FormData();
    Object.keys(values).forEach(key => {
      if (!['works', 'car_photo', 'odometer_photo', 'dashboard_photo', 'repair_photos'].includes(key) && values[key] != null) {
        formData.append(key, values[key]);
      }
    });

    if (values.works) {
      values.works.forEach((work, index) => {
        Object.keys(work).forEach(workKey => {
          if (work[workKey] != null) {
            formData.append(`works[${index}].${workKey}`, work[workKey]);
          }
        });
      });
    }

    if (values.repair_photos) {
      values.repair_photos.forEach((photo, index) => {
        if (photo.image && photo.image.length > 0) {
          formData.append(`repair_photos[${index}].image`, photo.image[0].originFileObj);
        }
        if (photo.caption) {
          formData.append(`repair_photos[${index}].caption`, photo.caption);
        }
      });
    }

    if (values.car_photo && values.car_photo.length > 0) formData.append('car_photo', values.car_photo[0].originFileObj);
    if (values.odometer_photo && values.odometer_photo.length > 0) formData.append('odometer_photo', values.odometer_photo[0].originFileObj);
    if (values.dashboard_photo && values.dashboard_photo.length > 0) formData.append('dashboard_photo', values.dashboard_photo[0].originFileObj);

    try {
      await axiosInstance.post('/orders/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success('Наряд-замовлення успішно створено!');
      navigate('/orders');
    } catch (error) {
      message.error('Помилка при створенні замовлення');
      console.error(error.response?.data || error);
    }
  };
  
  const normFile = (e) => {
    if (Array.isArray(e)) { return e; }
    return e && e.fileList;
  };

  const uploadButton = (<div><PlusOutlined /><div style={{ marginTop: 8 }}>Обрати</div></div>);

  return (
    <Card title="Створення нового наряд-замовлення">
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
        <Title level={4} style={{ marginTop: '20px' }}>Фотографії поломок</Title>
        <Form.List name="repair_photos">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                  <Form.Item {...restField} name={[name, 'image']} valuePropName="fileList" getValueFromEvent={normFile} rules={[{ required: true, message: 'Оберіть файл' }]}>
                    <Upload listType="picture-card" maxCount={1} beforeUpload={() => false}>
                      {(form.getFieldValue(['repair_photos', name, 'image']) || []).length < 1 && uploadButton}
                    </Upload>
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'caption']} rules={[{ required: true, message: 'Введіть опис/хештег' }]} style={{ flexGrow: 1 }}>
                    <Input placeholder="Опис / Хештег" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Додати фото поломки</Button>
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
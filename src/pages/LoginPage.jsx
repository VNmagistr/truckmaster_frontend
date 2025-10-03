import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axios'; // <-- Імпортуємо наш axios

function LoginPage({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Відправляємо запит на отримання токену
      const response = await axiosInstance.post('/token/', {
        username: values.username,
        password: values.password,
      });

      // Зберігаємо токени у localStorage
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setIsAuthenticated(true);
      
      // Оновлюємо заголовок для майбутніх запитів
      axiosInstance.defaults.headers['Authorization'] = 'Bearer ' + response.data.access;

      // Показуємо сповіщення про успіх
      message.success('Вхід виконано успішно!');

      // Перенаправляємо на головну сторінку
      navigate('/'); 

    } catch (error) {
      // Показуємо сповіщення про помилку
      message.error('Помилка! Неправильний логін або пароль.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card title="Вхід у truckmaster_frontend" style={{ width: 400 }}>
        <Form
          name="normal_login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Будь ласка, введіть логін!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Логін" />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Будь ласка, введіть пароль!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Пароль" />
          </Form.Item>

          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Запам'ятати мене</Checkbox>
            </Form.Item>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
              Увійти
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default LoginPage;
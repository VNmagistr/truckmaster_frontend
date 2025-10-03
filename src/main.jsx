import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App as AntApp } from 'antd'; // <-- 1. Імпортуємо App з antd і перейменовуємо його
import App from './App.jsx';
import 'antd/dist/reset.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AntApp> {/* <-- 2. Обгортаємо наш додаток */}
        <App />
      </AntApp>
    </BrowserRouter>
  </React.StrictMode>,
);
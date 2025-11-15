import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import DiscussionDetailPage from './pages/DiscussionDetail.page';
import HomePage from './pages/Home.page';
import LoginPage from './pages/Login.page';
import NotFoundPage from './pages/NotFound.page';
import RegisterPage from './pages/Register.page';

import '@ant-design/v5-patch-for-react-19';
import './assets/css/style.css';
import AntDesignProvider from './providers/AntDesignProvider';

dayjs.extend(relativeTime);




function App() {
  return (
    <AntDesignProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/discussion/:id" element={<DiscussionDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AntDesignProvider>
  );
}

export default App;

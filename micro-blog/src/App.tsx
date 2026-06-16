import React from 'react';
import { useLocation } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import Layout from './components/Layout';
import AppRouter from './router';
import RightSidebar from './layouts/RightSidebar';

const MainApp: React.FC = () => (
  <Layout sidebar={<RightSidebar />}>
    <AppRouter />
  </Layout>
);

const App: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <AppProvider>
      {isLoginPage ? <AppRouter /> : <MainApp />}
    </AppProvider>
  );
};

export default App;

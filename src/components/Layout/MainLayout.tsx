import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <Outlet />
    </div>
  );
};

export default MainLayout;

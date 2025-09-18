import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Login from '../features/auth/Login';
import Desktop from '../features/desktop/Desktop';
import GridTest from '../pages/GridTest';
import GridSystemTest from '../test/GridSystemTest';
import TestPage from '../pages/TestPage';
import ProtectedRoute from './ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <Desktop />,
      },
      {
        path: '/desktop',
        element: <Desktop />,
      },
      {
        path: '/grid-test',
        element: <GridTest />,
      },
      {
        path: '/test',
        element: <GridSystemTest />,
      },
      {
        path: '/test-page',
        element: <TestPage />,
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}

// 命名导出
export { AppRouter };
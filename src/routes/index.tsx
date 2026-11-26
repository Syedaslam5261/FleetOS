import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { DieselDashboardPage } from '../pages/diesel/DieselDashboard';
import { LorryManagementPage } from '../pages/fleet/LorryManagementPage';
import { ModulePlaceholder } from '../pages/common/ModulePlaceholder';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/fleet" replace />,
      },
      {
        path: 'dashboard',
        element: <Navigate to="/fleet" replace />,
      },
      {
        path: 'fleet',
        element: <LorryManagementPage />,
      },
      {
        path: 'diesel',
        element: <DieselDashboardPage />,
      },
      {
        path: 'trips',
        element: (
          <ModulePlaceholder
            moduleName="Trips & Deliveries"
            moduleDescription="Manage dispatch orders, routes, e-Way bills, POD collection, and transit checkpoints."
          />
        ),
      },
      {
        path: 'maintenance',
        element: (
          <ModulePlaceholder
            moduleName="Vehicle Maintenance & Service"
            moduleDescription="Schedule periodic engine services, tyre rotations, fitness certificates, and workshop repairs."
          />
        ),
      },
      {
        path: 'expenses',
        element: (
          <ModulePlaceholder
            moduleName="Expenses & FASTag Tolls"
            moduleDescription="Reconcile FASTag tolls, driver DA/bata allowances, border entry taxes, and transit expenses."
          />
        ),
      },
      {
        path: 'reports',
        element: (
          <ModulePlaceholder
            moduleName="Profitability & Fleet Reports"
            moduleDescription="End-to-end trip P&L, per-kilometer profit analysis, and fleet operating performance metrics."
          />
        ),
      },
      {
        path: '*',
        element: <Navigate to="/fleet" replace />,
      },
    ],
  },
]);

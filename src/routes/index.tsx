import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { DieselDashboardPage } from '../pages/diesel/DieselDashboard';
import { LorryManagementPage } from '../pages/fleet/LorryManagementPage';
import { LorryProfilePage } from '../pages/fleet/LorryProfilePage';
import { ModulePlaceholder } from '../pages/common/ModulePlaceholder';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

export const router = createBrowserRouter(
  [
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
          path: 'fleet/:lorryId',
          element: <LorryProfilePage />,
        },
        {
          path: 'fleet/:lorryId/:section',
          element: <LorryProfilePage />,
        },
        {
          path: 'fleet/:lorryId/:section/:subSection',
          element: <LorryProfilePage />,
        },
        {
          path: 'trips',
          element: (
            <ModulePlaceholder
              moduleName="Trips"
              moduleDescription="Manage dispatch orders, routes, e-Way bills, POD collection, and transit checkpoints."
            />
          ),
        },
        {
          path: 'diesel',
          element: <DieselDashboardPage />,
        },
        {
          path: 'maintenance',
          element: (
            <ModulePlaceholder
              moduleName="Maintenance"
              moduleDescription="Schedule periodic engine services, tyre rotations, fitness certificates, and workshop repairs."
            />
          ),
        },
        {
          path: 'expenses',
          element: (
            <ModulePlaceholder
              moduleName="Expenses"
              moduleDescription="Reconcile FASTag tolls, driver DA/bata allowances, border entry taxes, and transit expenses."
            />
          ),
        },
        {
          path: 'reports',
          element: (
            <ModulePlaceholder
              moduleName="Reports"
              moduleDescription="End-to-end trip P&L, per-kilometer profit analysis, and fleet operating performance metrics."
            />
          ),
        },
        {
          path: 'settings',
          element: (
            <ModulePlaceholder
              moduleName="Settings"
              moduleDescription="Configure company profile, tenant preferences, role-based access, and system integrations."
            />
          ),
        },
        {
          path: '*',
          element: <Navigate to="/fleet" replace />,
        },
      ],
    },
  ],
  {
    basename: basename,
  }
);

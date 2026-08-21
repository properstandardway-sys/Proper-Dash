import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { subscribeToAllOpenFlags } from '../../lib/admin';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminOverview }   from './AdminOverview';
import { AdminJobs }       from './AdminJobs';
import { AdminProperties } from './AdminProperties';
import { AdminTeam }       from './AdminTeam';
import { AdminFlags }      from './AdminFlags';
import type { JobFlag } from '../../types';

export const AdminRoot: React.FC = () => {
  const [openFlags, setOpenFlags] = useState<JobFlag[]>([]);

  useEffect(() => {
    const unsub = subscribeToAllOpenFlags(setOpenFlags);
    return unsub;
  }, []);

  const flagCount = openFlags.length;

  return (
    <AdminLayout flagCount={flagCount}>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="jobs"         element={<AdminJobs />} />
        <Route path="jobs/new"     element={<AdminJobs />} />
        <Route path="jobs/:jobId"  element={<AdminJobs />} />
        <Route path="properties"   element={<AdminProperties />} />
        <Route path="properties/new" element={<AdminProperties />} />
        <Route path="team"         element={<AdminTeam />} />
        <Route path="team/new"     element={<AdminTeam />} />
        <Route path="flags"        element={<AdminFlags />} />
        <Route path="clients/code" element={<AdminProperties />} />
        <Route path="*"            element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};
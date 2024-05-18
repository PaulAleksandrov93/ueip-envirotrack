import React from 'react';

const AdminPage = () => {
  // URL административной панели Django
  const adminUrl = '/aB3cD7eF/';

  return (
    <div className="admin-page">
      <iframe src={adminUrl} title="Admin Panel" width="100%" height="100%" />
    </div>
  );
};

export default AdminPage;
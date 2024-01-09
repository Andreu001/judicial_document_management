import React from 'react';

const DjangoAdmin = () => {
  return (
    <div>
      <h2>Django Admin</h2>
      <iframe
        title="Django Admin"
        src="http://127.0.0.1:8000/admin/"
        width="100%"
        height="600px"
        frameBorder="0"
      />
    </div>
  );
};

export default DjangoAdmin;

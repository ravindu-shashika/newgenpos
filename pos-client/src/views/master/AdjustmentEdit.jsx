import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const AdjustmentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="container-fluid">
      <h5 className="mb-3">Update Adjustment</h5>
      <p className="text-muted">Edit adjustment (ID: {id}) — coming soon. Use the legacy app to edit for now.</p>
      <button type="button" className="btn btn-secondary" onClick={() => navigate('/adjustment-list')}>
        Back to list
      </button>
    </div>
  );
};

export default AdjustmentEdit;

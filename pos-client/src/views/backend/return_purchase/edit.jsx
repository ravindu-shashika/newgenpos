import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageLayout } from '../../../components/ui';

/** SPA edit is not supported yet — delete and recreate the return instead. */
export default function BackendReturnPurchaseEdit() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/return-purchase', { replace: true });
    }, [navigate]);

    return (
        <PageLayout eyebrow="Purchase" title="Edit Purchase Return">
            <p className="text-muted">
                Editing purchase returns is not available yet. Delete the return and create a new one if you need to change it.
            </p>
            <Link to="/return-purchase" className="ui-btn">Back to list</Link>
        </PageLayout>
    );
}

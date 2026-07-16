import { Navigate, useParams } from 'react-router-dom';

/** Legacy route — opens adjustment form on the list page (no separate URL). */
export default function AdjustmentCreate() {
    const { id } = useParams();
    if (id) {
        return (
            <Navigate
                to="/qty_adjustment"
                replace
                state={{ adjustmentForm: 'edit', id }}
            />
        );
    }
    return (
        <Navigate
            to="/qty_adjustment"
            replace
            state={{ adjustmentForm: 'create' }}
        />
    );
}

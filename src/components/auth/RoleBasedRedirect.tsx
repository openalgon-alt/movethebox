
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';

const RoleBasedRedirect = () => {
    const { user, isLoading } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && user) {
            if (user.role === 'admin') {
                navigate('/admin-dashboard', { replace: true });
            } else {
                navigate('/sales-dashboard', { replace: true });
            }
        }
    }, [user, isLoading, navigate]);

    return <div>Redirecting...</div>;
};

export default RoleBasedRedirect;

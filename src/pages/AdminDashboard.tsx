
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/components/auth/UserContext';
import { LeadInbox } from '@/components/leads/LeadInbox';

const AdminDashboard = () => {
    const { user, isLoading } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && user?.role !== 'admin') {
            navigate('/sales-dashboard', { replace: true });
        }
    }, [user, isLoading, navigate]);

    if (isLoading) return <div>Loading...</div>;
    if (user?.role !== 'admin') return null;

    return <LeadInbox />;
};

export default AdminDashboard;

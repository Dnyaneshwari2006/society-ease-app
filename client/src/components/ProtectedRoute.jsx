import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, roleRequired }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token) {
        return <Navigate to="/" />; // Send to Login if no token
    }

    if (roleRequired && user.role !== roleRequired) {
        return <Navigate to="/" />; // Send to Login if wrong role
    }

    return children; // Show the page if everything is okay
};

export default ProtectedRoute;

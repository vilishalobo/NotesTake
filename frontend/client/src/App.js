import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/auth';
import { SocketProvider } from './contexts/SocketContext';
import LoginWithFaceTracking from './LoginWithFaceTracking';
import Dashboard from './Dashboard';
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// Protected Route Component - MUST be inside a component that's wrapped by AuthProvider
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }
  
  return currentUser ? children : <Navigate to="/" />;
};

// AppRoutes Component - consumes AuthContext
const AppRoutes = () => {
  const { currentUser } = useAuth();
  
  return (
    <SocketProvider user={currentUser}>
      <Router>
        <Routes>
          <Route path="/" element={<LoginWithFaceTracking />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </SocketProvider>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

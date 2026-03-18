import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { useAuth } from './contexts/auth';
import { useNavigate } from 'react-router-dom';
import NotesList from "./NotesList";
import AddNote from "./AddNote";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";

const API_URL = process.env.REACT_APP_API_URL;

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [refreshNotes, setRefreshNotes] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Register user in database
  useEffect(() => {
    if (currentUser) {
      fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          email: currentUser.email
        })
      })
      .then(() => console.log('User registered/updated in database'))
      .catch(error => console.error('Error registering user:', error));
    }
  }, [currentUser]);

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showSnackbar("Logged out successfully", "success");
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      setLogoutError(error.message);
      showSnackbar("Logout failed", "error");
    }
  };

  const refreshNoteList = () => {
    setRefreshNotes((prev) => !prev);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      {/* Navbar */}
      <AppBar position="sticky" elevation={2}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            <span role="img" aria-label="notes">📝</span> NoteStake
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 0.5,
                borderRadius: 2,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <AccountCircleIcon />
              <Typography
                variant="body2"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                {currentUser?.email}
              </Typography>
            </Box>

            <IconButton
              color="inherit"
              onClick={handleLogout}
              aria-label="logout"
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        {logoutError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLogoutError("")}>
            {logoutError}
          </Alert>
        )}

        <AddNote userId={currentUser?.uid} onNoteAdded={refreshNoteList} />
        <NotesList userId={currentUser?.uid} refresh={refreshNotes} />
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
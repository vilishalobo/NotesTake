import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import Signup from "./Signup";
import Login from "./Login";
import NotesList from "./NotesList";
import AddNote from "./AddNote";
import { SocketProvider } from './contexts/SocketContext';

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import Fade from "@mui/material/Fade";

const API_URL = process.env.REACT_APP_API_URL

function App() {
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [refreshNotes, setRefreshNotes] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutError, setLogoutError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Handle authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (currentUser) {
          setUserId(currentUser.uid);
          setUserEmail(currentUser.email || "");
          setUser(currentUser);

          // Register/update user in database for sharing feature
          try {
            await fetch(`${API_URL}/users`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: currentUser.uid,
                email: currentUser.email
              })
            });
            console.log('User registered/updated in database');
          } catch (error) {
            console.error('Error registering user:', error);
          }
        } else {
          setUserId(null);
          setUserEmail("");
          setUser(null);
        }
        setAuthLoading(false);
      },
      (error) => {
        console.error("Auth state change error:", error);
        setAuthLoading(false);
        showSnackbar("Authentication error occurred", "error");
      }
    );

    return () => unsubscribe();
  }, []);

  // Parse Firebase error codes to user-friendly messages
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      "auth/network-request-failed":
        "Network error. Please check your connection.",
      "auth/too-many-requests": "Too many requests. Please try again later.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/user-not-found": "User not found.",
      "auth/internal-error": "An internal error occurred. Please try again.",
    };
    return errorMessages[errorCode] || "An error occurred. Please try again.";
  };

  // Show snackbar notification
  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handle logout with error handling
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserId(null);
      setUserEmail("");
      setUser(null);
      showSnackbar("Logged out successfully", "success");
    } catch (error) {
      console.error("Logout error:", error);
      const errorMessage = getErrorMessage(error.code);
      setLogoutError(errorMessage);
      showSnackbar(errorMessage, "error");
    }
  };

  // Refresh notes list
  const refreshNoteList = () => {
    setRefreshNotes((prev) => !prev);
  };

  // Close snackbar
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  // Loading state during authentication check
  if (authLoading) {
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
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            userSelect: "none",
            WebkitUserSelect: "none",
            cursor: "default",
          }}
        >
          Loading...
        </Typography>
      </Box>
    );
  }

  // Login/Signup view
  if (!userId) {
    return (
      <Fade in={true} timeout={500}>
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              fontWeight="bold"
              sx={{
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: "default",
              }}
            >
              NoteStake
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: "default",
              }}
            >
              Secure and simple note-taking
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              mb: 3,
              borderRadius: 2,
              backgroundColor: "background.paper",
              p: 1,
              boxShadow: 1,
            }}
          >
            <Button
              variant={showLogin ? "contained" : "text"}
              onClick={() => setShowLogin(true)}
              sx={{ flex: 1, borderRadius: 1.5 }}
            >
              Login
            </Button>
            <Button
              variant={!showLogin ? "contained" : "text"}
              onClick={() => setShowLogin(false)}
              sx={{ flex: 1, borderRadius: 1.5 }}
            >
              Sign Up
            </Button>
          </Box>

          {showLogin ? <Login /> : <Signup />}
        </Container>
      </Fade>
    );
  }

  // Main app view (authenticated)
  return (
    <SocketProvider user={user}>
      <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
        {/* Navbar */}
        <AppBar position="sticky" elevation={2}>
          <Toolbar>
            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                fontWeight: 600,
                cursor: "default",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              <span role="img" aria-label="notes">
                📝
              </span>{" "}
              NoteStake
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
                  sx={{
                    display: { xs: "none", sm: "block" },
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }}
                >
                  {userEmail}
                </Typography>
              </Box>

              <IconButton
                color="inherit"
                onClick={handleLogout}
                aria-label="logout"
                sx={{
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="md" sx={{ py: 4 }}>
          {logoutError && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setLogoutError("")}
            >
              {logoutError}
            </Alert>
          )}

          <AddNote userId={userId} onNoteAdded={refreshNoteList} />
          <NotesList userId={userId} refresh={refreshNotes} />
        </Container>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
            elevation={6}
            variant="filled"
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </SocketProvider>
  );
}

export default App;
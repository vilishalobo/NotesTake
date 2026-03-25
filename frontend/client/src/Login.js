import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig";

import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
} from "@mui/material";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";

//const API_URL = process.env.REACT_APP_API_URL

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return "Email is required";
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  // Password validation
  const validatePassword = (password) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  // Handle email blur event
  const handleEmailBlur = () => {
    const error = validateEmail(email);
    setEmailError(error);
  };

  // Handle password blur event
  const handlePasswordBlur = () => {
    const error = validatePassword(password);
    setPasswordError(error);
  };

  // Parse Firebase error codes to user-friendly messages
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      "auth/user-not-found": "No account found with this email. Please sign up.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/user-disabled": "This account has been disabled. Contact support.",
      "auth/too-many-requests": "Too many failed attempts. Please try again later.",
      "auth/network-request-failed": "Network error. Please check your connection.",
      "auth/invalid-credential": "Invalid email or password. Please try again.",
      "auth/operation-not-allowed": "Email/password sign-in is not enabled.",
      "auth/weak-password": "Password is too weak. Use at least 6 characters.",
    };
    return errorMessages[errorCode] || "Login failed. Please try again.";
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError("");
    setEmailError("");
    setPasswordError("");

    // Validate inputs
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Success - component will unmount when auth state changes
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = getErrorMessage(err.code);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        borderRadius: 3,
        backgroundColor: "background.paper",
        animation: "fadeIn 0.3s ease-in-out",
      }}
    >
      <Box
        component="form"
        onSubmit={handleLogin}
        noValidate
        sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        <Box sx={{ textAlign: "center", mb: 1 }}>
          <Box
            sx={{
              display: "inline-flex",
              p: 2,
              borderRadius: "50%",
              backgroundColor: "primary.light",
              mb: 1,
            }}
          >
            <LockOpenIcon color="primary" sx={{ fontSize: 40 }} />
          </Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to continue to your notes
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            variant="filled"
            onClose={() => setError("")}
            sx={{ borderRadius: 2 }}
          >
            {error}
          </Alert>
        )}

        <TextField
          label="Email Address"
          type="email"
          variant="outlined"
          fullWidth
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError("");
            if (error) setError("");
          }}
          onBlur={handleEmailBlur}
          error={!!emailError}
          helperText={emailError}
          disabled={loading}
          required
          autoComplete="email"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          variant="outlined"
          fullWidth
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError("");
            if (error) setError("");
          }}
          onBlur={handlePasswordBlur}
          error={!!passwordError}
          helperText={passwordError}
          disabled={loading}
          required
          autoComplete="current-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                  disabled={loading}
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            mt: 1,
            py: 1.5,
            position: "relative",
            "&:disabled": {
              backgroundColor: "primary.main",
              opacity: 0.7,
            },
          }}
        >
          {loading ? (
            <>
              <CircularProgress
                size={24}
                sx={{
                  color: "white",
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  marginTop: "-12px",
                  marginLeft: "-12px",
                }}
              />
              <span style={{ opacity: 0 }}>Sign In</span>
            </>
          ) : (
            "Sign In"
          )}
        </Button>

        <Box sx={{ textAlign: "center", mt: 1 }}>
          <Link
            component="button"
            variant="body2"
            type="button"
            disabled={loading}
            sx={{
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onClick={(e) => {
              e.preventDefault();
              // Add forgot password functionality here
              alert("Forgot password functionality to be implemented");
            }}
          >
            Forgot password?
          </Link>
        </Box>
      </Box>
    </Paper>
  );
};

export default Login;

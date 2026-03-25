import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
  LinearProgress,
  Chip,
} from "@mui/material";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

//const API_URL = process.env.REACT_APP_API_URL

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const checkPasswordStrength = (password) => {
    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setPasswordCriteria(criteria);
    return criteria;
  };

  const getPasswordStrength = () => {
    const count = Object.values(passwordCriteria).filter(Boolean).length;
    return (count / 5) * 100;
  };

  const getPasswordStrengthColor = () => {
    const strength = getPasswordStrength();
    if (strength <= 40) return "error";
    if (strength <= 60) return "warning";
    return "success";
  };

  const getPasswordStrengthLabel = () => {
    const strength = getPasswordStrength();
    if (strength === 0) return "";
    if (strength <= 40) return "Weak";
    if (strength <= 60) return "Medium";
    return "Strong";
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      "auth/email-already-in-use": "This email is already registered.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/operation-not-allowed": "Email/password accounts are not enabled.",
      "auth/weak-password": "Password is too weak.",
      "auth/network-request-failed": "Network error. Check your connection.",
      "auth/too-many-requests": "Too many requests. Try again later.",
    };
    return errorMessages[errorCode] || "Signup failed. Please try again.";
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
    if (!passwordTouched) setPasswordTouched(true);
    if (error) setError("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (getPasswordStrength() < 40) {
      setError("Please use a stronger password");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
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
        onSubmit={handleSignup}
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
            <PersonAddAlt1Icon color="primary" sx={{ fontSize: 40 }} />
          </Box>
          <Typography
            variant="h5"
            fontWeight="bold"
            gutterBottom
            sx={{
              userSelect: "none",
              WebkitUserSelect: "none",
              cursor: "default",
            }}
          >
            Create Account
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              userSelect: "none",
              WebkitUserSelect: "none",
              cursor: "default",
            }}
          >
            Sign up to start organizing your notes
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

        {/* EMAIL FIELD - FIXED ALIGNMENT */}
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
          sx={{
            "& .MuiInputBase-input": {
              paddingLeft: "8px",
            },
          }}
        />

        {/* PASSWORD */}
        <Box>
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            fullWidth
            value={password}
            onChange={handlePasswordChange}
            disabled={loading}
            required
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    disabled={loading}
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {passwordTouched && password && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }}
                >
                  Password Strength:
                </Typography>
                <Chip
                  label={getPasswordStrengthLabel()}
                  size="small"
                  color={getPasswordStrengthColor()}
                  sx={{ height: 20 }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={getPasswordStrength()}
                color={getPasswordStrengthColor()}
                sx={{ height: 6, borderRadius: 3 }}
              />

              <Box
                sx={{
                  mt: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                <PasswordCriteriaItem
                  met={passwordCriteria.length}
                  text="At least 8 characters"
                />
                <PasswordCriteriaItem
                  met={passwordCriteria.uppercase}
                  text="One uppercase letter"
                />
                <PasswordCriteriaItem
                  met={passwordCriteria.lowercase}
                  text="One lowercase letter"
                />
                <PasswordCriteriaItem
                  met={passwordCriteria.number}
                  text="One number"
                />
                <PasswordCriteriaItem
                  met={passwordCriteria.special}
                  text="One special character"
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* CONFIRM PASSWORD */}
        <TextField
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          variant="outlined"
          fullWidth
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (error) setError("");
          }}
          disabled={loading}
          required
          autoComplete="new-password"
          error={confirmPassword && password !== confirmPassword}
          helperText={
            confirmPassword && password !== confirmPassword
              ? "Passwords do not match"
              : ""
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  edge="end"
                  disabled={loading}
                  aria-label="toggle confirm password visibility"
                >
                  {showConfirmPassword ? (
                    <VisibilityOffIcon />
                  ) : (
                    <VisibilityIcon />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* SUBMIT BUTTON */}
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
              <span style={{ opacity: 0 }}>Create Account</span>
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </Box>
    </Paper>
  );
};

// Password criteria item component
const PasswordCriteriaItem = ({ met, text }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    {met ? (
      <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />
    ) : (
      <CancelIcon sx={{ fontSize: 16, color: "error.main" }} />
    )}
    <Typography
      variant="caption"
      sx={{
        color: met ? "success.main" : "text.secondary",
        fontWeight: met ? 500 : 400,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {text}
    </Typography>
  </Box>
);

export default Signup;

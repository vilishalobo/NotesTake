import React, { useEffect, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import Login from "./Login";
import {
  Box,
  Container,
  Typography,
  LinearProgress,
  Paper,
  Alert,
  IconButton,
  Fade,
} from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";

const LoginWithFaceTracking = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const lastNoseYRef = useRef(null);
  const scrollCountRef = useRef(0);
  const cameraInstanceRef = useRef(null);
  
  const [progress, setProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    if (!showCamera) return;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    
    if (!videoElement || !canvasElement) return;
    
    const canvasCtx = canvasElement.getContext("2d");

    // Initialize MediaPipe FaceMesh
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      
      // Mirror the image
      canvasCtx.translate(canvasElement.width, 0);
      canvasCtx.scale(-1, 1);
      
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        setFaceDetected(true);
        const landmarks = results.multiFaceLandmarks[0];
        const nose = landmarks[1]; // Nose tip
        const noseX = nose.x * canvasElement.width;
        const noseY = nose.y * canvasElement.height;

        // Draw red dot on nose (mirrored)
        canvasCtx.beginPath();
        canvasCtx.arc(
          canvasElement.width - noseX,
          noseY,
          8,
          0,
          2 * Math.PI
        );
        canvasCtx.fillStyle = "#f50057";
        canvasCtx.fill();
        canvasCtx.strokeStyle = "#fff";
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();

        // Detect head movement
        if (lastNoseYRef.current !== null) {
          const diffY = noseY - lastNoseYRef.current;

          if (Math.abs(diffY) > 10) {
            scrollCountRef.current += 1;
            const newProgress = Math.min(
              (scrollCountRef.current / 15) * 100,
              100
            );
            setProgress(newProgress);

            if (diffY > 10) {
              window.scrollBy({ top: 30, behavior: "smooth" });
            } else if (diffY < -10) {
              window.scrollBy({ top: -30, behavior: "smooth" });
            }
          }
        }

        lastNoseYRef.current = noseY;
      } else {
        setFaceDetected(false);
      }
      
      canvasCtx.restore();
    });

    // Initialize camera
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await faceMesh.send({ image: videoElement });
      },
      width: 320,
      height: 240,
    });

    camera.start().catch((err) => {
      console.error("Camera error:", err);
      setCameraError("Camera access denied. Please enable camera permissions.");
    });

    cameraInstanceRef.current = camera;

    // Cleanup
    return () => {
      if (cameraInstanceRef.current) {
        cameraInstanceRef.current.stop();
      }
      scrollCountRef.current = 0;
      lastNoseYRef.current = null;
    };
  }, [showCamera]);

  const toggleCamera = () => {
    setShowCamera((prev) => !prev);
    if (showCamera && cameraInstanceRef.current) {
      cameraInstanceRef.current.stop();
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        position: "relative",
      }}
    >
      <Container maxWidth="sm">
        {/* Camera Toggle Button */}
        <Box sx={{ position: "absolute", top: 20, right: 20, zIndex: 1000 }}>
          <IconButton
            onClick={toggleCamera}
            sx={{
              backgroundColor: "rgba(255,255,255,0.9)",
              "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
            }}
          >
            {showCamera ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>
        </Box>

        {/* Face Tracking Camera Preview */}
        {showCamera && (
          <Fade in={showCamera}>
            <Paper
              elevation={6}
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 3,
                backgroundColor: "rgba(255,255,255,0.95)",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ textAlign: "center", fontWeight: "bold" }}
              >
                🎯 Face Tracking Active
              </Typography>

              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <video
                  ref={videoRef}
                  style={{ display: "none" }}
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  width="320"
                  height="240"
                  style={{
                    borderRadius: "12px",
                    maxWidth: "100%",
                    height: "auto",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                />
              </Box>

              {cameraError && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                  {cameraError}
                </Alert>
              )}

              {/* Progress Indicator */}
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Scroll Progress
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {Math.round(progress)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "rgba(0,0,0,0.1)",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      background:
                        "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                    },
                  }}
                />
              </Box>

              {/* Status Indicator */}
              <Alert
                severity={faceDetected ? "success" : "info"}
                icon={false}
                sx={{ borderRadius: 2 }}
              >
                <Typography variant="body2">
                  {faceDetected ? (
                    <>
                      ✅ <strong>Face detected!</strong> Move your head up/down
                      to scroll
                    </>
                  ) : (
                    <>
                      👤 <strong>Position your face</strong> in the camera view
                    </>
                  )}
                </Typography>
              </Alert>
            </Paper>
          </Fade>
        )}

        {/* Login Form */}
        <Login />

        {/* Instructions */}
        <Paper
          elevation={3}
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 3,
            backgroundColor: "rgba(255,255,255,0.95)",
          }}
        >
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ textAlign: "center" }}
          >
            💡 <strong>Tip:</strong> Move your head up and down to scroll
            through the page hands-free!
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginWithFaceTracking;

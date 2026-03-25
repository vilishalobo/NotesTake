import React, { useState, useRef} from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useSocket } from './contexts/SocketContext';
import { auth } from './firebaseConfig'; // Add this import

import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Collapse,
  IconButton,
  Tooltip,
  Snackbar,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Divider,
} from "@mui/material";
import { 
  Add as AddIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SaveIcon from "@mui/icons-material/Save";

const API_URL = process.env.REACT_APP_API_URL

const AddNote = ({ userId, onNoteAdded }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");
  const [tagError, setTagError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Add Socket.IO hook
  const { socket, isConnected } = useSocket();

  const quillRef = useRef(null);
  const MAX_TITLE_LENGTH = 100;
  const MAX_TAG_COUNT = 10;
  const MAX_TAG_LENGTH = 20;

  // Quill editor config
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link", "code-block"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "color",
    "background",
    "link",
    "code-block",
  ];

  // Validation
  const validateTitle = (value) => {
    if (!value.trim()) return "Title is required";
    if (value.length > MAX_TITLE_LENGTH)
      return `Title must be less than ${MAX_TITLE_LENGTH} characters`;
    return "";
  };

  const validateContent = (value) => {
    const plainText = value.replace(/<[^>]*>/g, "").trim();
    if (!plainText) return "Please add some content to your note";
    if (plainText.length < 10) return "Content must be at least 10 characters";
    return "";
  };

  // Handlers
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    if (titleError) setTitleError("");
    if (error) setError("");
  };

  const handleContentChange = (value) => {
    setContent(value);
    if (contentError) setContentError("");
    if (error) setError("");
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (!trimmedTag) return setTagError("Tag cannot be empty");
    if (trimmedTag.length > MAX_TAG_LENGTH)
      return setTagError(`Tag must be less than ${MAX_TAG_LENGTH} characters`);
    if (tags.length >= MAX_TAG_COUNT)
      return setTagError(`Maximum ${MAX_TAG_COUNT} tags allowed`);
    if (tags.includes(trimmedTag)) return setTagError("This tag already exists");

    setTags([...tags, trimmedTag]);
    setTagInput("");
    setTagError("");
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
    setTagError("");
  };

  const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setUploadingImage(true);
    setError("");

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_URL}/images/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setImages([...images, data.fileId]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image
  const removeImage = async (fileId) => {
    try {
      await fetch(`${API_URL}/images/${fileId}`, {
        method: 'DELETE',
      });
      setImages(images.filter(id => id !== fileId));
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();

    setError("");
    setTitleError("");
    setContentError("");

    const titleValidationError = validateTitle(title);
    const contentValidationError = validateContent(content);

    if (titleValidationError) return setTitleError(titleValidationError);
    if (contentValidationError) return setContentError(contentValidationError);

    setLoading(true);
    try {
      const response = await fetchWithRetry(`${API_URL}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
          ownerEmail: auth.currentUser?.email, // Add owner email for sharing
          title: title.trim(), 
          content, 
          tags,
          images
        }),
      });

      const newNote = await response.json();

      // Emit socket event for real-time update
      if (socket && isConnected) {
        socket.emit('note-created', { note: newNote, userId });
      }

      setTitle("");
      setContent("");
      setTags([]);
      setImages([]);
      setSuccessMessage("Note added successfully!");
      onNoteAdded();

      setTimeout(() => {
        setShowForm(false);
        setTimeout(() => setShowForm(true), 300);
      }, 1500);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Network error. Please check your connection."
          : err.message || "Failed to add note. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const generateTags = async () => {
    const plainText = content.replace(/<[^>]*>/g, "").trim();
    if (!plainText) return setError("Please write some content first");
    if (plainText.length < 20)
      return setError("Content is too short to generate tags");

    setLoadingTags(true);
    try {
      const response = await fetchWithRetry(`${API_URL}/ai/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteContent: plainText }),
      });
      const data = await response.json();

      if (!data.tags || data.tags.length === 0)
        return setError("Could not generate tags. Try adding more content.");

      const newTags = data.tags
        .filter((tag) => !tags.includes(tag))
        .slice(0, MAX_TAG_COUNT - tags.length);

      if (newTags.length === 0)
        return setError("All generated tags are already added");

      setTags([...tags, ...newTags]);
      setSuccessMessage(`${newTags.length} tag(s) generated successfully!`);
    } catch {
      setError("Failed to generate tags. Please try again later.");
    } finally {
      setLoadingTags(false);
    }
  };

  const handleClearForm = () => {
    setTitle("");
    setContent("");
    setTags([]);
    setImages([]);
    setError("");
    setTitleError("");
    setContentError("");
    setTagError("");
  };

  return (
    <>
      {/* Connection Status Indicator */}
      {isConnected && (
        <Alert 
          severity="success" 
          sx={{ mb: 2, borderRadius: 2 }}
          icon={<span>🟢</span>}
        >
          Live collaboration enabled - Your notes will sync in real-time
        </Alert>
      )}

      <Collapse in={showForm}>
        <Card
          elevation={3}
          sx={{
            mb: 4,
            borderRadius: 3,
            border: error ? "2px solid" : "none",
            borderColor: "error.main",
            transition: "all 0.3s ease",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{ cursor: "default", userSelect: "none" }}
              >
                <span role="img" aria-label="create">✍️</span> Create New Note
              </Typography>
              {(title || content || tags.length > 0 || images.length > 0) && (
                <Tooltip title="Clear form">
                  <IconButton
                    size="small"
                    onClick={handleClearForm}
                    disabled={loading}
                    sx={{ color: "text.secondary" }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Box
              component="form"
              onSubmit={handleAddNote}
              noValidate
              sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
            >
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

              {/* Title */}
              <TextField
                label="Title"
                value={title}
                onChange={handleTitleChange}
                error={!!titleError}
                helperText={
                  titleError || `${title.length}/${MAX_TITLE_LENGTH} characters`
                }
                required
                fullWidth
                disabled={loading}
                autoComplete="off"
                inputProps={{ maxLength: MAX_TITLE_LENGTH }}
                variant="outlined"
              />

              {/* Content */}
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1, userSelect: "none" }}
                >
                  Content *
                </Typography>
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={content}
                  onChange={handleContentChange}
                  modules={modules}
                  formats={formats}
                  placeholder="Write your note here..."
                  readOnly={loading}
                  style={{
                    backgroundColor: loading ? "#f5f5f5" : "white",
                    borderRadius: "4px",
                    minHeight: "200px",
                  }}
                />
                {contentError && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, display: "block", userSelect: "none" }}
                  >
                    {contentError}
                  </Typography>
                )}
              </Box>

              {/* Image Upload Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#666' }}>
                  Images (Optional)
                </Typography>
                
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={uploadingImage ? <CircularProgress size={20} /> : <UploadIcon />}
                  disabled={uploadingImage}
                  sx={{ mb: 2 }}
                >
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>

                {images.length > 0 && (
                  <ImageList cols={3} gap={8}>
                    {images.map((fileId) => (
                      <ImageListItem key={fileId}>
                        <img
                          src={`${API_URL}/images/${fileId}`}
                          alt="Note attachment"
                          loading="lazy"
                          style={{ height: 150, objectFit: 'cover', borderRadius: 8 }}
                        />
                        <ImageListItemBar
                          actionIcon={
                            <IconButton
                              sx={{ color: 'white' }}
                              onClick={() => removeImage(fileId)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Tags */}
              <Box>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <TextField
                    label="Add Tag"
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      if (tagError) setTagError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    size="small"
                    disabled={loading || tags.length >= MAX_TAG_COUNT}
                    error={!!tagError}
                    helperText={tagError}
                    inputProps={{ maxLength: MAX_TAG_LENGTH }}
                    sx={{ flex: 1 }}
                    variant="outlined"
                  />
                  <Button
                    variant="outlined"
                    onClick={addTag}
                    startIcon={<AddIcon />}
                    disabled={loading || tags.length >= MAX_TAG_COUNT}
                  >
                    Add
                  </Button>
                  <Button
                    variant="contained"
                    onClick={generateTags}
                    startIcon={
                      loadingTags ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <AutoAwesomeIcon />
                      )
                    }
                    disabled={loading || loadingTags || !content}
                  >
                    {loadingTags ? "Generating..." : "AI Tags"}
                  </Button>
                </Stack>

                {tags.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                    {tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => removeTag(tag)}
                        color="primary"
                        variant="outlined"
                        disabled={loading}
                      />
                    ))}
                  </Stack>
                )}

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block", userSelect: "none" }}
                >
                  {tags.length}/{MAX_TAG_COUNT} tags
                </Typography>
              </Box>

              {/* Save Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.5,
                  "&:disabled": {
                    backgroundColor: "primary.main",
                    opacity: 0.7,
                  },
                }}
              >
                {loading ? "Saving..." : "Save Note"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      {/* Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessMessage("")}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddNote;

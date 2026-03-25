import React, { useState, useRef, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Typography,
  Divider,
  Chip,
  Stack,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import RestoreIcon from "@mui/icons-material/Restore";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";

const API_URL = process.env.REACT_APP_API_URL

const EditNote = ({ note, onUpdate, onCancel }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState(note.tags || []);
  const [images, setImages] = useState(note.images || []);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingTags, setGeneratingTags] = useState(false); // Add this state
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const quillRef = useRef(null);
  const MAX_TITLE_LENGTH = 100;
  const MAX_TAG_COUNT = 10;

  // Rich text editor configuration
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

  // Check for changes
  useEffect(() => {
    const changed =
      title !== note.title ||
      content !== note.content ||
      JSON.stringify(tags) !== JSON.stringify(note.tags || []) ||
      JSON.stringify(images) !== JSON.stringify(note.images || []);
    setHasChanges(changed);
  }, [title, content, tags, images, note]);

  // Validate title
  const validateTitle = (value) => {
    if (!value.trim()) {
      return "Title is required";
    }
    if (value.length > MAX_TITLE_LENGTH) {
      return `Title must be less than ${MAX_TITLE_LENGTH} characters`;
    }
    return "";
  };

  // Validate content
  const validateContent = (value) => {
    const plainText = value.replace(/<[^>]*>/g, "").trim();
    if (!plainText) {
      return "Content cannot be empty";
    }
    return "";
  };

  // Handle title change
  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    if (titleError) setTitleError("");
    if (error) setError("");
  };

  // Handle content change
  const handleContentChange = (value) => {
    setContent(value);
    if (contentError) setContentError("");
    if (error) setError("");
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
    formData.append("image", file);

    try {
      const response = await fetch(`${API_URL}/images/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      setImages([...images, data.fileId]);
    } catch (err) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image
  const removeImage = async (fileId) => {
    try {
      await fetch(`${API_URL}/images/${fileId}`, {
        method: "DELETE",
      });
      setImages(images.filter((id) => id !== fileId));
    } catch (err) {
      console.error("Failed to delete image:", err);
      setError("Failed to delete image");
    }
  };

  // Generate AI tags - NEW FUNCTION
  const generateTags = async () => {
    const plainText = content.replace(/<[^>]*>/g, "").trim();

    if (!plainText) {
      setError("Please write some content first");
      return;
    }

    if (tags.length >= MAX_TAG_COUNT) {
      setError(`You already have the maximum of ${MAX_TAG_COUNT} tags`);
      return;
    }

    setGeneratingTags(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/ai/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noteContent: plainText }),
      });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error("AI service is busy. Please try again in a moment.");
        }
        throw new Error("Failed to generate tags");
      }

      const data = await response.json();

      // Filter out tags that already exist
      const newTags = data.tags.filter((tag) => !tags.includes(tag));

      // Only add tags up to the limit
      const tagsToAdd = newTags.slice(0, MAX_TAG_COUNT - tags.length);

      if (tagsToAdd.length === 0) {
        setError("All AI-generated tags already exist");
        return;
      }

      setTags([...tags, ...tagsToAdd]);
    } catch (error) {
      console.error("Error generating tags:", error);
      setError(error.message || "Failed to generate AI tags. Please try again.");
    } finally {
      setGeneratingTags(false);
    }
  };

  // Add tag
  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (
      trimmedTag &&
      !tags.includes(trimmedTag) &&
      tags.length < MAX_TAG_COUNT
    ) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Reset to original values
  const handleReset = () => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags || []);
    setImages(note.images || []);
    setError("");
    setTitleError("");
    setContentError("");
  };

  // Handle update with retry
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

  // Handle update
  const handleUpdate = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setError("");
    setTitleError("");
    setContentError("");

    // Validate inputs
    const titleValidationError = validateTitle(title);
    const contentValidationError = validateContent(content);

    if (titleValidationError) {
      setTitleError(titleValidationError);
      return;
    }

    if (contentValidationError) {
      setContentError(contentValidationError);
      return;
    }

    if (!hasChanges) {
      setError("No changes detected");
      return;
    }

    setLoading(true);

    try {
      await fetchWithRetry(`${API_URL}/notes/${note._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content,
          tags,
          images,
        }),
      });

      onUpdate();
      onCancel();
    } catch (err) {
      console.error("Update note error:", err);
      setError(
        err.message === "Failed to fetch"
          ? "Network error. Please check your connection."
          : err.message || "Failed to update note. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle close with confirmation if there are unsaved changes
  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (!confirmed) return;
    }
    onCancel();
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              cursor: "default",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            <span role="img" aria-label="edit">
              ✏️
            </span>{" "}
            Edit Note
          </Typography>
          <IconButton
            edge="end"
            onClick={handleClose}
            aria-label="close"
            disabled={loading}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        <Box
          component="form"
          onSubmit={handleUpdate}
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

          <TextField
            label="Title"
            fullWidth
            value={title}
            onChange={handleTitleChange}
            error={!!titleError}
            helperText={
              titleError || `${title.length}/${MAX_TITLE_LENGTH} characters`
            }
            disabled={loading}
            autoFocus
            required
            inputProps={{ maxLength: MAX_TITLE_LENGTH }}
          />

          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
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
              readOnly={loading}
              style={{
                backgroundColor: loading ? "#f5f5f5" : "white",
                minHeight: "250px",
              }}
            />
            {contentError && (
              <Typography
                variant="caption"
                color="error"
                sx={{
                  mt: 0.5,
                  display: "block",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              >
                {contentError}
              </Typography>
            )}
          </Box>

          {/* Image Upload Section */}
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              Images (Optional)
            </Typography>

            <Button
              variant="outlined"
              component="label"
              startIcon={
                uploadingImage ? (
                  <CircularProgress size={20} />
                ) : (
                  <CloudUploadIcon />
                )
              }
              disabled={uploadingImage || loading}
              sx={{ mb: 2 }}
            >
              {uploadingImage ? "Uploading..." : "Upload Image"}
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
                      style={{
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                    <ImageListItemBar
                      actionIcon={
                        <IconButton
                          sx={{ color: "white" }}
                          onClick={() => removeImage(fileId)}
                          disabled={loading}
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

          {/* Tags Section with AI Generation */}
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              Tags
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Add Tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                size="small"
                disabled={loading || tags.length >= MAX_TAG_COUNT}
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                onClick={addTag}
                disabled={loading || tags.length >= MAX_TAG_COUNT}
              >
                Add
              </Button>
              <Button
                variant="contained"
                onClick={generateTags}
                disabled={loading || generatingTags || uploadingImage || tags.length >= MAX_TAG_COUNT}
                startIcon={
                  generatingTags ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <span>✨</span>
                  )
                }
                sx={{
                  textTransform: "none",
                  background: "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                  whiteSpace: "nowrap",
                }}
              >
                {generatingTags ? "..." : "AI"}
              </Button>
            </Stack>

            {tags.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                {tags.map((tag, index) => (
                  <Chip
                    key={index}
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
              sx={{
                mt: 1,
                display: "block",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {tags.length}/{MAX_TAG_COUNT} tags
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleReset}
          startIcon={<RestoreIcon />}
          disabled={loading || !hasChanges}
        >
          Reset
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpdate}
          variant="contained"
          startIcon={
            loading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <SaveIcon />
            )
          }
          disabled={loading || !hasChanges}
        >
          {loading ? "Updating..." : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditNote;

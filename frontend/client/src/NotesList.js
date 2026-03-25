import React, { useEffect, useState, useCallback } from "react";
import EditNote from "./EditNote";
import { useSocket } from './contexts/SocketContext';

import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Fade,
  Skeleton,
  ImageList,
  ImageListItem,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SummarizeIcon from "@mui/icons-material/Summarize";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import ShareIcon from "@mui/icons-material/Share";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const API_URL = process.env.REACT_APP_API_URL

// Separate component for each note card with PDF export
const NoteCard = ({ note, onEdit, onDelete, onSummary, onShare, loadingSummary, summary, onTagClick, currentUserId }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const isOwner = note.userId === currentUserId;

  const exportToPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      const element = document.createElement('div');
      element.style.padding = '20px';
      element.style.backgroundColor = 'white';
      element.style.width = '800px';
      element.innerHTML = `
        <h1 style="margin-bottom: 10px;">${note.title}</h1>
        ${note.tags?.length > 0 ? `<p style="color: #666; margin-bottom: 20px;">Tags: ${note.tags.join(', ')}</p>` : ''}
        <div>${note.content}</div>
      `;
      document.body.appendChild(element);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
      });

      document.body.removeChild(element);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${note.title}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Show if note is shared */}
        {note.isShared && (
          <Chip 
            icon={<ShareIcon fontSize="small" />}
            label={isOwner ? `Shared with ${note.sharedWithEmails?.length || 0}` : "Shared with you"}
            size="small"
            color="secondary"
            sx={{ mb: 1 }}
          />
        )}
        
        <Typography
          variant="h6"
          gutterBottom
          fontWeight={600}
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {note.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          dangerouslySetInnerHTML={{ __html: note.content }}
          sx={{
            mb: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            "& p": { margin: 0 },
            "& img": { display: "none" },
          }}
        />

        {/* Display Images */}
        {note.images && note.images.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <ImageList cols={2} gap={8}>
              {note.images.map((fileId) => (
                <ImageListItem key={fileId}>
                  <img
                    src={`${API_URL}/images/${fileId}`}
                    alt="Note attachment"
                    loading="lazy"
                    style={{ 
                      height: 120, 
                      objectFit: 'cover', 
                      borderRadius: 8,
                      cursor: 'pointer'
                    }}
                    onClick={() => window.open(`${API_URL}/images/${fileId}`, '_blank')}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        )}

        {note.tags?.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.5,
              mb: 1,
            }}
          >
            {note.tags.map((tag, i) => (
              <Chip
                key={i}
                label={tag}
                size="small"
                color="primary"
                variant="outlined"
                onClick={() => onTagClick(tag)}
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Box>
        )}

        {summary && (
          <Alert
            severity="info"
            sx={{ mt: 2, fontSize: "0.875rem" }}
            icon={<SummarizeIcon fontSize="small" />}
          >
            {summary}
          </Alert>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, flexWrap: 'wrap', gap: 0.5 }}>
        <Button
          size="small"
          startIcon={<EditIcon />}
          onClick={onEdit}
        >
          Edit
        </Button>
        
        {isOwner && (
          <Button 
            size="small" 
            startIcon={<PersonAddIcon />} 
            onClick={onShare}
            color="secondary"
          >
            Share
          </Button>
        )}
        
        <Button
          size="small"
          startIcon={<DeleteIcon />}
          color="error"
          onClick={onDelete}
        >
          Delete
        </Button>
        <Button
          size="small"
          startIcon={
            isGeneratingPDF ? (
              <CircularProgress size={14} />
            ) : (
              <PictureAsPdfIcon />
            )
          }
          onClick={exportToPDF}
          disabled={isGeneratingPDF}
          color="success"
        >
          {isGeneratingPDF ? "..." : "PDF"}
        </Button>
        <Button
          size="small"
          startIcon={
            loadingSummary ? (
              <CircularProgress size={14} />
            ) : (
              <SummarizeIcon />
            )
          }
          onClick={onSummary}
          disabled={loadingSummary}
        >
          {loadingSummary ? "..." : "Summary"}
        </Button>
      </CardActions>
    </Card>
  );
};

const NotesList = ({ userId, refresh }) => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [summaries, setSummaries] = useState({});
  const [loadingSummary, setLoadingSummary] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deletingNote, setDeletingNote] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  
  // Share dialog states
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [noteToShare, setNoteToShare] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareError, setShareError] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');

  const { socket, isConnected } = useSocket();

  const fetchWithRetry = async (url, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  const fetchNotes = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      const data = await fetchWithRetry(
        `${API_URL}/notes?userId=${userId}`
      );
      setNotes(data);
      setFilteredNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setError(
        error.message === "Failed to fetch"
          ? "Network error. Please check your connection."
          : "Failed to load notes. Please try again."
      );
      setNotes([]);
      setFilteredNotes([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Socket.IO real-time listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('note-created', ({ note }) => {
      // Show note if user owns it OR it's shared with them
      if (note.userId === userId || note.sharedWith?.includes(userId)) {
        setNotes(prev => {
          const exists = prev.some(n => n._id === note._id);
          if (exists) return prev;
          return [note, ...prev];
        });
        setFilteredNotes(prev => {
          const exists = prev.some(n => n._id === note._id);
          if (exists) return prev;
          return [note, ...prev];
        });
      }
    });

    socket.on('note-changed', ({ updatedNote }) => {
      if (updatedNote.userId === userId || updatedNote.sharedWith?.includes(userId)) {
        setNotes(prev => 
          prev.map(note => note._id === updatedNote._id ? updatedNote : note)
        );
        setFilteredNotes(prev =>
          prev.map(note => note._id === updatedNote._id ? updatedNote : note)
        );
      }
    });

    socket.on('note-removed', ({ noteId }) => {
      setNotes(prev => prev.filter(note => note._id !== noteId));
      setFilteredNotes(prev => prev.filter(note => note._id !== noteId));
    });

    socket.on('note-shared-update', () => {
      fetchNotes(); // Refresh to show newly shared notes
    });

    return () => {
      socket.off('note-created');
      socket.off('note-changed');
      socket.off('note-removed');
      socket.off('note-shared-update');
    };
  }, [socket, userId, fetchNotes]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, refresh]);

  useEffect(() => {
    let filtered = notes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (selectedTag) {
      filtered = filtered.filter((note) => note.tags?.includes(selectedTag));
    }

    setFilteredNotes(filtered);
  }, [searchQuery, selectedTag, notes]);

  const allTags = [...new Set(notes.flatMap((note) => note.tags || []))].sort();

  const handleShareClick = (note) => {
    setNoteToShare(note);
    setShareDialogOpen(true);
    setShareEmail('');
    setShareError('');
    setShareSuccess('');
  };

  const handleShareSubmit = async () => {
    if (!shareEmail.trim()) {
      setShareError('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      setShareError('Please enter a valid email address');
      return;
    }

    setShareLoading(true);
    setShareError('');

    try {
      const response = await fetch(
        `${API_URL}/notes/${noteToShare._id}/share`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shareWithEmail: shareEmail }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share note');
      }

      // Emit socket event
      if (socket && isConnected) {
        socket.emit('note-shared', { 
          noteId: noteToShare._id, 
          sharedWithUserId: data.note.sharedWith[data.note.sharedWith.length - 1]
        });
      }

      setShareSuccess(`Note shared with ${shareEmail} successfully!`);
      setShareEmail('');
      
      setTimeout(() => {
        setShareDialogOpen(false);
        fetchNotes();
      }, 2000);
    } catch (error) {
      console.error('Share error:', error);
      setShareError(error.message || 'Failed to share note');
    } finally {
      setShareLoading(false);
    }
  };

  const handleDeleteClick = (note) => {
    setNoteToDelete(note);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    setDeletingNote(true);

    try {
      const response = await fetch(
        `${API_URL}/notes/${noteToDelete._id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete note");

      if (socket && isConnected) {
        socket.emit('note-deleted', { 
          noteId: noteToDelete._id, 
          userId 
        });
      }

      setDeleteDialogOpen(false);
      setNoteToDelete(null);
      await fetchNotes();
    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to delete note. Please try again.");
      setDeleteDialogOpen(false);
    } finally {
      setDeletingNote(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  const generateSummary = async (note) => {
    const plainText = note.content.replace(/<[^>]*>/g, "").trim();
    if (!plainText || plainText.length < 20) {
      setError("Note content is too short to generate a summary");
      return;
    }

    setLoadingSummary(note._id);
    setError("");

    try {
      const response = await fetch(`${API_URL}/ai/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteContent: plainText }),
      });

      if (!response.ok) throw new Error("Failed to generate summary");

      const data = await response.json();
      setSummaries((prev) => ({ ...prev, [note._id]: data.summary }));
    } catch (error) {
      console.error("Error generating summary:", error);
      setError("Failed to generate summary. Please try again later.");
    } finally {
      setLoadingSummary(null);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedTag("");
  };

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="rectangular" height={100} sx={{ my: 2 }} />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {isConnected && (
        <Alert 
          severity="success" 
          sx={{ mb: 2, borderRadius: 2 }}
          icon={<FiberManualRecordIcon sx={{ fontSize: 12 }} />}
        >
          🟢 Live sync active - Changes will appear instantly across all devices
        </Alert>
      )}

      {!isConnected && socket && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2, borderRadius: 2 }}
        >
          ⚠️ Reconnecting to live sync...
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
          }}
        >
          <TextField
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Tooltip title="Refresh notes">
            <IconButton onClick={fetchNotes} color="primary" disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {allTags.length > 0 && (
          <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip
              icon={<FilterListIcon />}
              label="All"
              onClick={() => setSelectedTag("")}
              color={!selectedTag ? "primary" : "default"}
              variant={!selectedTag ? "filled" : "outlined"}
            />
            {allTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? "" : tag)}
                color={selectedTag === tag ? "primary" : "default"}
                variant={selectedTag === tag ? "filled" : "outlined"}
              />
            ))}
          </Box>
        )}

        {(searchQuery || selectedTag) && (
          <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredNotes.length} of {notes.length} notes
            </Typography>
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      {!loading && filteredNotes.length === 0 && !error && (
        <Fade in={true}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {searchQuery || selectedTag
              ? "No notes match your search criteria."
              : "No notes found. Create your first note above!"}
          </Alert>
        </Fade>
      )}

      <Grid container spacing={3}>
        {filteredNotes.map((note) =>
          editingNote && editingNote._id === note._id ? (
            <Grid item xs={12} key={note._id}>
              <EditNote
                note={note}
                onUpdate={fetchNotes}
                onCancel={() => setEditingNote(null)}
              />
            </Grid>
          ) : (
            <Grid item xs={12} sm={6} md={4} key={note._id}>
              <Fade in={true} timeout={300}>
                <div>
                  <NoteCard
                    note={note}
                    currentUserId={userId}
                    onEdit={() => setEditingNote(note)}
                    onDelete={() => handleDeleteClick(note)}
                    onShare={() => handleShareClick(note)}
                    onSummary={() => generateSummary(note)}
                    loadingSummary={loadingSummary === note._id}
                    summary={summaries[note._id]}
                    onTagClick={setSelectedTag}
                  />
                </div>
              </Fade>
            </Grid>
          )
        )}
      </Grid>

      {/* Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => !shareLoading && setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Share Note
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Share "<strong>{noteToShare?.title}</strong>" with another user by entering their email address.
          </DialogContentText>

          {shareSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {shareSuccess}
            </Alert>
          )}

          {shareError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setShareError('')}>
              {shareError}
            </Alert>
          )}

          {noteToShare?.sharedWithEmails?.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Currently shared with:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {noteToShare.sharedWithEmails.map((email) => (
                  <Chip key={email} label={email} size="small" />
                ))}
              </Stack>
            </Box>
          )}

          <TextField
            autoFocus
            fullWidth
            label="Email Address"
            type="email"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            disabled={shareLoading}
            placeholder="user@example.com"
            error={!!shareError}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setShareDialogOpen(false)} 
            disabled={shareLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShareSubmit}
            variant="contained"
            startIcon={
              shareLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <ShareIcon />
              )
            }
            disabled={shareLoading}
          >
            {shareLoading ? 'Sharing...' : 'Share'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <DeleteIcon color="error" />
            <Typography variant="h6" fontWeight={600}>
              Delete Note?
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>"{noteToDelete?.title}"</strong>? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteCancel} disabled={deletingNote}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            startIcon={
              deletingNote ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteIcon />
              )
            }
            disabled={deletingNote}
          >
            {deletingNote ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotesList;
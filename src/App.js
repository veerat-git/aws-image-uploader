import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [pasteUrl, setPasteUrl] = useState("");
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);
    if (!selectedFile) return;

    const duplicate = uploadedImages.some(
      (img) => img.name === selectedFile.name && img.size === selectedFile.size
    );

    if (duplicate) {
      setError("⚠️ This file already exists!");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const uploadImage = async () => {
    if (!file) {
      setError("Please select a file first!");
      return;
    }
    setUploading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/images/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");

      const { uploadUrl, viewUrl } = await res.json();

      if (uploadedImages.some((img) => img.url === viewUrl)) {
        setError("⚠️ This image already exists on server!");
        setUploading(false);
        return;
      }

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload file to S3");

      setUploadedImages((prev) => [
        ...prev,
        { url: viewUrl, name: file.name, size: file.size },
      ]);
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const addImageFromUrl = () => {
    if (!pasteUrl.trim()) {
      setError("Please paste a valid URL!");
      return;
    }

    if (uploadedImages.some((img) => img.url === pasteUrl.trim())) {
      setError("⚠️ This image already exists!");
      return;
    }

    setUploadedImages((prev) => [
      ...prev,
      { url: pasteUrl.trim(), name: "Pasted Image", size: null },
    ]);
    setPasteUrl("");
    setError(null);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📷 Image Uploader using AWS</h1>

      {/* File Upload */}
      <div style={styles.card}>
        <input type="file" onChange={handleFileChange} accept="image/*" style={styles.fileInput}/>
        <button onClick={uploadImage} disabled={uploading} style={styles.button}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* Paste URL */}
      <div style={styles.card}>
        <input
          type="text"
          placeholder="Paste image URL"
          value={pasteUrl}
          onChange={(e) => setPasteUrl(e.target.value)}
          style={styles.textInput}
        />
        <button onClick={addImageFromUrl} style={styles.button}>
          Add from URL
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Uploaded Images */}
      <div style={styles.gallery}>
        {uploadedImages.map((img, i) => (
          <div key={i} style={styles.imageCard}>
            <div style={styles.imageHeader}>
              <span style={styles.imageName}>{img.name}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(img.url);
                  alert("Copied!");
                }}
                style={styles.copyButton}
              >
                Copy Link
              </button>
            </div>
            <img src={img.url} alt={img.name} style={styles.image} />
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: "linear-gradient(135deg, #f0f4ff, #dbeafe)",
    minHeight: "100vh",
  },
  title: {
    textAlign: "center",
    color: "#1e3a8a",
    marginBottom: "30px",
  },
  card: {
    display: "flex",
    gap: "10px",
    backgroundColor: "#fff",
    padding: "15px 20px",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    marginBottom: "15px",
    alignItems: "center",
  },
  fileInput: {
    flex: 1,
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ddd",
  },
  textInput: {
    flex: 1,
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ddd",
  },
  button: {
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  error: {
    color: "red",
    marginTop: "10px",
    textAlign: "center",
  },
  gallery: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "20px",
    marginTop: "30px",
  },
  imageCard: {
    background: "#fff",
    padding: "10px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  imageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  imageName: {
    fontWeight: "bold",
    fontSize: "14px",
    color: "#1e3a8a",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  copyButton: {
    backgroundColor: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: "12px",
  },
  image: {
    width: "100%",
    borderRadius: "8px",
    objectFit: "cover",
  },
};

export default App;

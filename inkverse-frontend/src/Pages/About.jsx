import React from "react";

export default function About() {
  return (
    <div
      className="border border-3 w-auto rounded-3 container"
      style={{
        padding: "50px",
        textAlign: "center",
        minHeight: "80vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        borderColor: "#007bff"
      }}
    >
      <h1 style={{ color: "#333", fontSize: "3em", marginBottom: "20px" }}>
        About InkVerse 📖✨
      </h1>
      <p style={{ fontSize: "1.2em", color: "#555", marginBottom: "20px" }}>
        InkVerse is a storytelling platform built for readers and writers who
        love worlds, characters, and imagination. 🌍🧙‍♂️
      </p>
      <p style={{ fontSize: "1.1em", color: "#666", marginBottom: "20px" }}>
        Our goal is simple: make it easy to read, write, and explore stories —
        whether they are original works, alternate universes, or fan-created
        worlds inspired by existing fiction. 💡📚
      </p>
      <p style={{ fontSize: "1.1em", color: "#666", marginBottom: "20px" }}>
        InkVerse is currently in its early version (V1). Features such as author
        tools, character pages, and community-driven content are actively being
        developed and improved over time. 🚀🔧
      </p>
      <p style={{ fontSize: "1.3em", color: "#444", fontWeight: "bold" }}>
        We believe stories grow stronger when readers and writers grow together. 🤝❤️
      </p>
    </div>
  );
}

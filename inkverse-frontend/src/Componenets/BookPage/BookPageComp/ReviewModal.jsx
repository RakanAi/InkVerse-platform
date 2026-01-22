import React, { useMemo, useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import api from "../../../Api/api";
import StarRatingInput from "./StarRatingInput";

export default function ReviewModal({
  show,
  onClose,
  bookId,
  onSubmitted,
  initialReview, // ✅ NEW
}) {
  const [content, setContent] = useState("");

  

  const [characterAccuracy, setCharacterAccuracy] = useState(0);
  const [chemistryRelationships, setChemistryRelationships] = useState(0);
  const [plotCreativity, setPlotCreativity] = useState(0);
  const [canonIntegration, setCanonIntegration] = useState(0);
  const [emotionalDamage, setEmotionalDamage] = useState(0); // 1=MAX damage, 5=NO damage

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  

  // ✅ Prefill when editing (and reset when writing new)
  useEffect(() => {
    if (!show) return;

    if (initialReview) {
      setContent(initialReview.content ?? initialReview.Content ?? "");

      setCharacterAccuracy(
        initialReview.characterAccuracy ?? initialReview.CharacterAccuracy ?? 0
      );
      setChemistryRelationships(
        initialReview.chemistryRelationships ??
          initialReview.ChemistryRelationships ??
          0
      );
      setPlotCreativity(
        initialReview.plotCreativity ?? initialReview.PlotCreativity ?? 0
      );
      setCanonIntegration(
        initialReview.canonIntegration ?? initialReview.CanonIntegration ?? 0
      );
      setEmotionalDamage(
        initialReview.emotionalDamage ?? initialReview.EmotionalDamage ?? 0
      );

      setErr("");
    } else {
      // reset to empty/new
      setContent("");
      setCharacterAccuracy(0);
      setChemistryRelationships(0);
      setPlotCreativity(0);
      setCanonIntegration(0);
      setEmotionalDamage(0);
      setErr("");
    }
  }, [show, initialReview]);

  const damageLabel = useMemo(() => {
    switch (emotionalDamage) {
      case 1:
        return "I'm destroyed 💀";
      case 2:
        return "Pain 😭";
      case 3:
        return "Ouch 🥲";
      case 4:
        return "Soft hurt 😔";
      case 5:
        return "No damage 😌";
      default:
        return "";
    }
  }, [emotionalDamage]);

  const averagePreview = useMemo(() => {
    if (
      !characterAccuracy ||
      !chemistryRelationships ||
      !plotCreativity ||
      !canonIntegration ||
      !emotionalDamage
    )
      return 0;

    const normalizedDamage = 6 - emotionalDamage; // 1->5, 5->1
    const avg =
      (characterAccuracy +
        chemistryRelationships +
        plotCreativity +
        canonIntegration +
        normalizedDamage) /
      5;

    return Math.round(avg * 10) / 10;
  }, [
    characterAccuracy,
    chemistryRelationships,
    plotCreativity,
    canonIntegration,
    emotionalDamage,
  ]);

  const reset = () => {
    setContent("");
    setCharacterAccuracy(0);
    setChemistryRelationships(0);
    setPlotCreativity(0);
    setCanonIntegration(0);
    setEmotionalDamage(0);
    setErr("");
  };

  const submit = async () => {
    if (!bookId) return;

    if (!content.trim()) {
      setErr("Please write something in your review.");
      return;
    }

    if (
      !characterAccuracy ||
      !chemistryRelationships ||
      !plotCreativity ||
      !canonIntegration ||
      !emotionalDamage
    ) {
      setErr("Please rate all 5 categories (1–5 stars).");
      return;
    }

    try {
      setLoading(true);
      setErr("");

      // ✅ one review per user per book: backend add-or-update
      await api.post(`/books/${bookId}/reviews`, {
        content: content.trim(),
        characterAccuracy,
        chemistryRelationships,
        plotCreativity,
        canonIntegration,
        emotionalDamage,
      });

      if (onSubmitted) await onSubmitted();

      reset();
      onClose?.();
    } catch (e) {
      console.error("Failed to submit review:", e);
      setErr(
        e?.response?.status === 401
          ? "You must be logged in to write a review."
          : e?.response?.data?.message || "Failed to submit review."
      );
    } finally {
      setLoading(false);
    }
  };

  const damagePopover = (
    <Popover id="emotional-damage-popover">
      <Popover.Header as="h3">How Emotional Damage works 😈</Popover.Header>
      <Popover.Body>
        
        <div className="small">
          <div>
            <strong>Lower stars = higher damage</strong>
          </div>
          <div className="mt-2">⭐ = Maximum damage (I'm broken)</div>
          <div>⭐⭐⭐⭐⭐ = No damage (I'm fine)</div>
          <div className="mt-2 text-muted">
            We flip this value when calculating the overall score so painful
            stories aren’t punished.
          </div>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <Modal
      show={show}
      onHide={() => {
        reset();
        onClose?.();
      }}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {initialReview ? "Edit your Review" : "Write a Review"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {err ? <div className="alert alert-danger">{err}</div> : null}

        <div className="mb-3 p-3 border rounded">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-semibold">Category ratings</div>
            <div className="text-muted small">
              Overall preview:{" "}
              <strong>{averagePreview ? averagePreview.toFixed(1) : "—"}</strong>
            </div>
          </div>

          <div className="d-flex flex-column gap-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="fw-semibold">Character Accuracy</div>
              <StarRatingInput
                value={characterAccuracy}
                onChange={setCharacterAccuracy}
              />
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <div className="fw-semibold">Chemistry & Relationships</div>
              <StarRatingInput
                value={chemistryRelationships}
                onChange={setChemistryRelationships}
              />
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <div className="fw-semibold">Plot & Creativity</div>
              <StarRatingInput
                value={plotCreativity}
                onChange={setPlotCreativity}
              />
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <div className="fw-semibold">Canon Integration</div>
              <StarRatingInput
                value={canonIntegration}
                onChange={setCanonIntegration}
              />
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <div className="fw-semibold d-flex align-items-center gap-2">
                Emotional Damage
                <OverlayTrigger
                  trigger="click"
                  placement="top"
                  overlay={damagePopover}
                  rootClose
                >
                  <span
                    role="button"
                    className="text-muted"
                    style={{ cursor: "pointer" }}
                    title="How does this work?"
                  >
                    <i className="bi bi-info-circle" />
                  </span>
                </OverlayTrigger>
              </div>

              <div className="d-flex align-items-center gap-2">
                <StarRatingInput
                  value={emotionalDamage}
                  onChange={setEmotionalDamage}
                />
                <span className="text-muted small">{damageLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-2">
          <label className="form-label fw-semibold">Review</label>
          <textarea
            className="form-control"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tell us what you loved (or what destroyed you) 👀"
          />
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          className="btn btn-outline-secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? "Submitting..." : initialReview ? "Save" : "Submit"}
        </button>
      </Modal.Footer>
    </Modal>
  );
}

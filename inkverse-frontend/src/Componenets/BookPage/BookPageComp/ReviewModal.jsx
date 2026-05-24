import React, { useMemo, useRef, useState, useEffect } from "react";
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
  const modalLayoutRef = useRef(null);
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

  const roundedAverage = averagePreview ? Math.round(averagePreview) : 0;

  const reset = () => {
    setContent("");
    setCharacterAccuracy(0);
    setChemistryRelationships(0);
    setPlotCreativity(0);
    setCanonIntegration(0);
    setEmotionalDamage(0);
    setErr("");
  };

  const dismiss = () => {
    reset();
    onClose?.();
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
      onHide={dismiss}
      centered
      className="iv-book-review-modal"
      contentClassName="iv-book-review-modal__content"
    >
      <Modal.Header closeButton className="iv-book-review-modal__header">
        <div className="iv-book-review-modal__header-copy">
          <Modal.Title>
            {initialReview ? "Edit your review" : "Write a review"}
          </Modal.Title>
          <p className="iv-book-review-modal__subtitle">
            {initialReview
              ? "Adjust the score breakdown and tighten your take before saving it back."
              : "Rate the story, then leave a thoughtful take other readers can actually use."}
          </p>
        </div>
      </Modal.Header>

      <Modal.Body className="iv-book-review-modal__body">
        {err ? <div className="iv-book-review-modal__error">{err}</div> : null}

        <div className="iv-book-review-modal__layout" ref={modalLayoutRef}>
          <div className="iv-book-review-modal__ratings">
            <div className="iv-book-review-modal__ratings-head">
              <div>
                <div className="iv-book-review-modal__eyebrow">Category ratings</div>
                <div className="iv-book-review-modal__section-title">
                  Score the parts that shaped your read
                </div>
              </div>
            </div>

            <div className="iv-book-review-modal__ratings-shell">
              <div className="iv-book-review-modal__ratings-list">
                <div className="iv-book-review-modal__rating-row">
                  <div className="iv-book-review-modal__rating-label">
                    Character Accuracy
                  </div>
                  <StarRatingInput
                    value={characterAccuracy}
                    onChange={setCharacterAccuracy}
                  />
                </div>

                <div className="iv-book-review-modal__rating-row">
                  <div className="iv-book-review-modal__rating-label">
                    Chemistry & Relationships
                  </div>
                  <StarRatingInput
                    value={chemistryRelationships}
                    onChange={setChemistryRelationships}
                  />
                </div>

                <div className="iv-book-review-modal__rating-row">
                  <div className="iv-book-review-modal__rating-label">
                    Plot & Creativity
                  </div>
                  <StarRatingInput
                    value={plotCreativity}
                    onChange={setPlotCreativity}
                  />
                </div>

                <div className="iv-book-review-modal__rating-row">
                  <div className="iv-book-review-modal__rating-label">
                    Canon Integration
                  </div>
                  <StarRatingInput
                    value={canonIntegration}
                    onChange={setCanonIntegration}
                  />
                </div>

                <div className="iv-book-review-modal__rating-row iv-book-review-modal__rating-row--damage">
                  <div className="iv-book-review-modal__rating-label iv-book-review-modal__rating-label--with-help">
                    <span>Emotional Damage</span>
                    <OverlayTrigger
                      trigger="click"
                      placement="top"
                      overlay={damagePopover}
                      container={modalLayoutRef.current}
                      rootClose
                    >
                      <button
                        type="button"
                        className="iv-book-review-modal__help"
                        title="How does this work?"
                      >
                        <i className="bi bi-info-circle" />
                      </button>
                    </OverlayTrigger>
                  </div>

                  <div className="iv-book-review-modal__damage-control">
                    <StarRatingInput
                      value={emotionalDamage}
                      onChange={setEmotionalDamage}
                    />
                    {damageLabel ? (
                      <span className="iv-book-review-modal__damage-label">
                        {damageLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <aside className="iv-book-review-modal__score-card" aria-live="polite">
                <span className="iv-book-review-modal__score-label">Total score</span>
                <strong className="iv-book-review-modal__score-value">
                  {averagePreview ? averagePreview.toFixed(1) : "0.0"}
                </strong>
                <div className="iv-book-review-modal__score-stars" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i
                      key={star}
                      className={`bi ${
                        star <= roundedAverage ? "bi-star-fill" : "bi-star"
                      }`}
                    />
                  ))}
                </div>
              </aside>
            </div>
          </div>

          <div className="iv-book-review-modal__field">
            <label className="iv-book-review-modal__field-label">Review</label>
            <textarea
              className="iv-book-review-modal__textarea"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell readers what landed, what missed, and which details actually made this story memorable."
            />
            <p className="iv-book-review-modal__field-note">
              A grounded review with specific details helps far more than a one-line reaction.
            </p>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="iv-book-review-modal__footer">
        <button
          className="iv-book-review-modal__button iv-book-review-modal__button--ghost"
          onClick={dismiss}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="iv-book-review-modal__button"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Submitting..." : initialReview ? "Save review" : "Post review"}
        </button>
      </Modal.Footer>
    </Modal>
  );
}

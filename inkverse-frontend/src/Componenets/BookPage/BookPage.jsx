import "./BookPage.css";
import Bgpic from "./BookPageComp/BackgroundPic";
import BookData from "./BookPageComp/Data";
import SynopsisBox from "./BookPageComp/SynopsisBoxes";
import Toc from "./BookPageComp/TableOfContent";
import RatingBox from "./BookPageComp/RatingSec";
import Reviews from "./BookPageComp/ReviewsSec";
import ReviewModal from "./BookPageComp/ReviewModal";
import BookMetaBox from "./BookPageComp/BookMetaBox";

import { useEffect, useMemo, useState, useCallback, useContext } from "react";
import { useParams } from "react-router-dom";
import api from "../../Api/api";
import AuthContext from "../../Context/AuthProvider";

export default function BookPage() {
  const { id } = useParams();

  const [book, setBook] = useState(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [bookError, setBookError] = useState("");

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // ✅ modal state (so setShowModal exists)
  const [showModal, setShowModal] = useState(false);

  const { auth } = useContext(AuthContext);
  const myUserId = auth?.user?.id;

  const myReview = useMemo(() => {
    if (!myUserId) return null;
    return (
      reviews.find((r) => String(r.userId ?? r.UserId) === String(myUserId)) ||
      null
    );
  }, [reviews, myUserId]);

  const loadReviews = useCallback(
    async (silent = false) => {
      if (!id) return;

      try {
        if (!silent) setLoadingReviews(true);

        const res = await api.get(`/books/${id}/reviews`);
        setReviews(res.data || []);
      } catch (e) {
        console.error("Failed to load reviews:", e);
        if (!silent) setReviews([]);
      } finally {
        if (!silent) setLoadingReviews(false);
      }
    },
    [id],
  );

  // ✅ 1) fetch book
  useEffect(() => {
    if (!id) {
      setBookError("No book id in URL");
      setLoadingBook(false);
      return;
    }

    const loadBook = async () => {
      try {
        setLoadingBook(true);
        setBookError("");
        const res = await api.get(`/books/${id}`);
        setBook(res.data);
      } catch (e) {
        console.error("Failed to load book:", e);
        setBookError("Failed to load book.");
      } finally {
        setLoadingBook(false);
      }
    };

    loadBook();
  }, [id]);

  // ✅ 2) fetch reviews (separate effect)
  useEffect(() => {
    loadReviews(false);
  }, [loadReviews]);

  const totalReviews = reviews.length;

  const avgFromReviews = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  const breakdownAvg = useMemo(() => {
    if (!reviews.length) {
      return {
        characterAccuracy: 0,
        chemistryRelationships: 0,
        plotCreativity: 0,
        canonIntegration: 0,
        emotionalDamage: 0,
      };
    }

    const get = (r, camel, pascal) => Number(r?.[camel] ?? r?.[pascal] ?? 0);

    let sums = {
      characterAccuracy: 0,
      chemistryRelationships: 0,
      plotCreativity: 0,
      canonIntegration: 0,
      emotionalDamage: 0,
    };

    for (const r of reviews) {
      sums.characterAccuracy += get(
        r,
        "characterAccuracy",
        "CharacterAccuracy",
      );
      sums.chemistryRelationships += get(
        r,
        "chemistryRelationships",
        "ChemistryRelationships",
      );
      sums.plotCreativity += get(r, "plotCreativity", "PlotCreativity");
      sums.canonIntegration += get(r, "canonIntegration", "CanonIntegration");
      sums.emotionalDamage += get(r, "emotionalDamage", "EmotionalDamage"); // raw avg (1=MAX, 5=NO)
    }

    const n = reviews.length;

    const round1 = (x) => Math.round((x / n) * 10) / 10;

    return {
      characterAccuracy: round1(sums.characterAccuracy),
      chemistryRelationships: round1(sums.chemistryRelationships),
      plotCreativity: round1(sums.plotCreativity),
      canonIntegration: round1(sums.canonIntegration),
      emotionalDamage: round1(sums.emotionalDamage),
    };
  }, [reviews]);

  return (
    <div className="container bg-white pb-4">
      <Bgpic />

      {loadingBook ? (
        <p className="text-white">Loading book...</p>
      ) : bookError ? (
        <p className="text-danger">{bookError}</p>
      ) : !book ? (
        <p className="text-white">No book returned.</p>
      ) : (
        <>
          <BookData book={book} averageRating={avgFromReviews} />
          <br />
          <SynopsisBox description={book.description} />
          <Toc />

          <RatingBox
            averageRating={avgFromReviews}
            totalReviews={totalReviews}
            breakdown={breakdownAvg}
            myReview={myReview}
            onWriteReview={() => setShowModal(true)}
            onDeleteMyReview={async () => {
              if (!myReview) return;

              const reviewId = myReview.id ?? myReview.Id;
              if (!confirm("Delete your review?")) return;

              try {
                await api.delete(`/reviews/${reviewId}`);
                await loadReviews(true);
              } catch (e) {
                console.error("Delete review failed:", e);
                alert("Failed to delete review.");
              }
            }}
          />

          <Reviews
            reviews={reviews}
            loading={loadingReviews}
            onRefresh={loadReviews}
          />
          <ReviewModal
            show={showModal}
            onClose={() => setShowModal(false)}
            bookId={id}
            initialReview={myReview}
            onSubmitted={loadReviews}
            
          />


        </>
      )}
    </div>
  );
}

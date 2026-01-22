import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../../Api/api';

export default function PageBread() {
  const { id, chapterId } = useParams(); // Get book & chapter IDs from URL
  const [book, setBook] = useState(null);
  const [chapter, setChapter] = useState(null);

  useEffect(() => {
    const fetchBookAndChapter = async () => {
      try {
        // Fetch book details (Title & Genre)
        const bookResponse = await api.get(`/books/${id}`);
        setBook(bookResponse.data);

        // Fetch chapter details (Title)
        const chapterResponse = await api.get(`/chapters/${chapterId}`);
        setChapter(chapterResponse.data);
      } catch (err) {
        console.error('Failed to fetch breadcrumb data:', err);
      }
    };

    if (id && chapterId) fetchBookAndChapter();
  }, [id, chapterId]);

  if (!book || !chapter) return null;

  return (
    <Breadcrumb className="mt-3">
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      {/* <Breadcrumb.Item href="/Browser">{book.genres[0]}</Breadcrumb.Item> */}
      <Breadcrumb.Item href={`/book/${book.id}`}>{book.title}</Breadcrumb.Item>
      {/* <Breadcrumb.Item className="text-white" active>
        {chapter.title}
      </Breadcrumb.Item> */}
    </Breadcrumb>
  );
}

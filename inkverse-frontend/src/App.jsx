import "./App.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import Browser from "./Pages/Browser";
import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Ranking from "./Pages/Ranking";
import Author from "./Pages/Author";
import BookDetails from "./Pages/BookDetails";
import ChapterPage from "./Pages/ChapterPage";
import TrendsPage from "./Pages/Trends";
import ProfilePage from "./Pages/ProfilePage";
import Layout from "./Componenets/Layout/Layout";
import ProtectedRoute from "./Componenets/Layout/ProtectedRoute";
import MyLibrary from "./Pages/MyLibraryPage";
import AdminRoute from "./Componenets/Admin/AdminRoute";
import AdminLayout from "./Pages/Admin/AdminLayout";
import AdminDashboard from "./Componenets/Admin/AdminDashboard";
import AdminTags from "./Componenets/Admin/AdminTags";
import AdminGenres from "./Componenets/Admin/AdminGenres";
import AdminTrends from "./Componenets/Admin/AdminTrends";
import AdminBooksPage from "./Componenets/Admin/AdminBooksPage";
import AdminBookEditor from "./Componenets/Admin/AdminBookEditor";
import AdminChaptersPage from "./Componenets/Admin/AdminChapterPage";
import AdminChapterEditor from "./Componenets/Admin/AdminChapterEditor";
import TrendDetails from "./Pages/TrendDetails";
import About from "./Pages/About";
import Contact from "./Pages/Contact";
import Privacy from "./Pages/Privacy";
import DMCA from "./Pages/DMCA";
import TermsOfService from "./Pages/TermsOfService";


function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/browser" element={<Browser />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/author" element={<Author />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/dmca" element={<DMCA />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/signin" element={<Home />} />

          {/* User routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["Admin", "User", "Author"]} />
            }
          >
            <Route path="/book/:id" element={<BookDetails />} />
            <Route path="/profilePage" element={<ProfilePage />} />
            <Route
              path="/book/:id/chapter/:chapterId"
              element={<ChapterPage />}
            />
            <Route path="/my-library" element={<MyLibrary />} />
          </Route>

              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />

                  <Route path="books" element={<AdminBooksPage />} />
                  <Route path="books/new" element={<AdminBookEditor mode="create" />} />
                  <Route path="books/:id" element={<AdminBookEditor mode="edit" />} />

                  <Route path="/admin/books/:bookId/chapters" element={<AdminChaptersPage />} />
                  <Route path="/admin/books/:bookId/chapters/new" element={<AdminChapterEditor mode="create" />} />
                  <Route path="/admin/books/:bookId/chapters/:chapterId" element={<AdminChapterEditor mode="edit" />} />


                  <Route path="tags" element={<AdminTags />} />
                  <Route path="genres" element={<AdminGenres />} />
                  <Route path="trends" element={<AdminTrends />} />
                </Route>
              </Route>




          {/* Chapter reading page */}
          <Route path="/trend" element={<TrendsPage />} />
          <Route path="/trend/:id" element={<TrendDetails />} />


          {/* admin routes */}

          {/* catch all */}
        </Route>
      </Routes>
    </div>
  );
}

export default App;

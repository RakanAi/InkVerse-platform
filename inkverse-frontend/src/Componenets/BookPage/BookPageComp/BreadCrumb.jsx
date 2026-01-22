import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { Route } from 'react-router-dom';
import Book from "../../Essence/BooksData.json"
import Chapter from "../../ChapterPageComp.jsx/ChaptersData.json"

function BreadcrumbBP() {
  return (
    <Breadcrumb className='mt-2'>
      <Breadcrumb.Item href='/'></Breadcrumb.Item>
      <Breadcrumb.Item href="/Browser">
        {Book.BookGenra}
      </Breadcrumb.Item>
      <Breadcrumb.Item className=''>{Book.BookName}</Breadcrumb.Item>

      <Breadcrumb.Item className='text-white' active>{}</Breadcrumb.Item>
    </Breadcrumb>
  );
}

export default BreadcrumbBP;
import "./SideFilter.css"
import Book from "../Essence/BooksData.json"

export default function FilterBooks(){

    return(
        <div className="Books border-0 border-bottom border-top d-flex">
                <a href="BookDetails" className="text-start col-auto">
                <img variant="start" src="src\assets\BackGround_04.png" alt="" className="card-img m-2 rounded" style={{width:"90px", height:"120px"}}/>
                </a>
                <div className="m-2">
                <div className="d-flex gap-2 text-start ">
                    <a href=""><p className="genraFont">#{Book.BookGenra}</p></a>
                    <a href=""><p className="genraFont">#{Book.BookGenra}</p></a>
                    <a href=""><p className="genraFont">#{Book.BookGenra}</p></a>
                </div>
                    <h6 className="text-start"><a href="BookDetails" className="text-dark">{Book.BookName}</a></h6>
                    <p className="bookSyno text-start">{Book.Synopsis}</p>
                    <div className="d-flex">
                        <div className="bookRC text-muted d-flex gap-1 col-10">
                            <span>Author: <a href="AuthorPage" className="text-primary">{Book.AuthorName}</a> </span>
                            <span>| 5k-Words</span>
                        </div>
                        <div className="col-2 bookRC p-0 d-flex gap-2 justify-content-end">
                        <a href="" className="btn btn-outline-primary py-0 px-1 bookRC rounded-pill">+</a>
                        <a href="BookDetails" className="btn btn-primary py-0 px-1 bookRC rounded-pill">Read</a>
                        </div>
                    </div>
                </div>
            
            </div>
    )
}




// import "./SideFilter.css"
// import Book from "../Essence/BooksData.json"

// export default function FilterBooks({ books = [] }) {
//   return (
//     <>
//       {books.map((book, index) => (
//         <div key={index} className="Books border-0 border-bottom border-top d-flex">
//           <a href={`/book/${book.id}`} className="text-start col-auto">
//             <img
//               src={book.coverImageUrl || "src/assets/BackGround_04.png"}
//               alt=""
//               className="card-img m-2 rounded"
//               style={{ width: "90px", height: "120px" }}
//             />
//           </a>
//           <div className="m-2">
//             <div className="d-flex gap-2 text-start">
//               {book.genres?.slice(0, 3).map((genre, i) => (
//                 <a key={i} href="">
//                   <p className="genraFont">#{genre}</p>
//                 </a>
//               ))}
//             </div>
//             <h6 className="text-start">
//               <a href={`/book/${book.id}`} className="text-dark">{book.title}</a>
//             </h6>
//             <p className="bookSyno text-start">{book.description}</p>
//             <div className="d-flex">
//               <div className="bookRC text-muted d-flex gap-1 col-10">
//                 <span>
//                   Author: <a href={`/author/${book.authorId}`} className="text-primary">{book.authorName}</a>
//                 </span>
//                 <span>| {book.wordCount} Words</span>
//               </div>
//               <div className="col-2 bookRC p-0 d-flex gap-2 justify-content-end">
//                 <a href="#" className="btn btn-outline-primary py-0 px-1 bookRC rounded-pill">+</a>
//                 <a href={`/book/${book.id}`} className="btn btn-primary py-0 px-1 bookRC rounded-pill">Read</a>
//               </div>
//             </div>
//           </div>
//         </div>
//       ))}
//     </>
//   );
// }
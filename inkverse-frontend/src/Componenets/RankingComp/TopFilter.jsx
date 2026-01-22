import FilterBooks from "./FilteredBooks"
import "./SideFilter.css"

export default function TopFil(){
    return(
        
        <div className="row mt-5 topFil ">
            <div className=" mb-2 rounded text-start fw-bold fs-5 text-muted col-12">----Ranking 
            <i class="bi bi-patch-exclamation"></i>
            </div>
            <hr />
            <div className="col-12 text-start fw-bold d-flex gap-2 overflow-scroll-x-hidden ">
                <>
                <h6 className="">Time Ranking:</h6>
                <a href="" className="">Weakly</a>
                <p>❖</p>
                <a href="" className="">Mounthly</a>
                <p>❖</p>
                <a href="" className="">Season</a>
                <p>❖</p>
                <a href="" className="">Annual</a>
                <p>❖</p>
                <a href="" className="d-flex">All<div className="d-none d-md-block">-Time</div></a>
                </>  
            </div>
            <div className="border-top-dotted pt-2 col-12 text-start fw-bold d-flex gap-2 overflow-scroll-x-hidden d-block d-md-none">
            <>
                <h6 className="">Orignal.Ranking:</h6>
                <a href="" className="">Read</a>
                <p>❖</p>
                <a href="" className="">Active</a>
                <p>❖</p>
                <a href="" className="">Update</a>
                </> 
            </div>
            <div className="border-top-dotted pt-2 col-12 text-start fw-bold d-flex gap-2 overflow-scroll-x-hidden d-block d-md-none">
            <>
                <h6 className="">FanFic.Ranking:</h6>
                <a href="" className="">Read</a>
                <p>❖</p>
                <a href="" className="">Active</a>
                <p>❖</p>
                <a href="" className="">Update</a>
                </> 
            </div>
            <hr />
            <></>
            <FilterBooks />
            {/* <FilterBooks />
            <FilterBooks />
            <FilterBooks />
            <FilterBooks />
            <FilterBooks />
            <FilterBooks />
            <FilterBooks />
            <FilterBooks />
            <FilterBooks /> */}
        </div>




    )
}
import { useState } from "react"
import "./Log.css"



export default function Logform(){

    const [formInput, setFormInput] = useState("");
    return(
        <div className="container form">
        <form action="" onSubmit={(event) => {event.preventDefault()}}>

            <label>UserName:</label>
            <input type="text" value={formInput.name}
            onChange={(event) =>{setFormInput({username: event.target.value, password: formInput.password})}}
            />

            <label>password:</label>
            <input type="text" value={formInput.password}
            onChange={(event) =>{setFormInput({password: event.target.value, username: formInput.username})}}
            />
        </form>
        </div>
    )


}
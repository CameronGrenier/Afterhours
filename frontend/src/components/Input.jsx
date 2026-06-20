import {playSound} from "../audio/playSound.jsx";

function Input( { type, placeholderText, onChange } ) {
    return (
        <input 
            type={type} 
            placeholder={placeholderText} 
            className="mx-auto block w-full rounded-md border-2 border-black bg-white py-3 text-center text-2xl text-gray-700 font-medium outline-none focus:placeholder:text-transparent"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown = {(event) => {
                if (event.key.length === 1 || event.key === "Backspace") {
                    playSound("keyStroke");
                }
            }}
        />
    )
}

export default Input;
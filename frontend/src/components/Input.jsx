
function Input( { type, placeholderText, onChange } ) {
    return (
        <input 
            type={type} 
            placeholder={placeholderText} 
            className="mx-auto block w-full rounded-md border-2 border-black bg-white py-3 text-center text-2xl text-gray-700 font-medium outline-none focus:placeholder:text-transparent"
            onChange={(e) => onChange(e.target.value)}
        />
    )
}

export default Input;
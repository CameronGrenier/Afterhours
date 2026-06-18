
function Input( { placeholderText } ) {
    return (
        <input type="text" placeholder={placeholderText} className=" mx-auto block w-[80vw] max-w-[400px] rounded-md border-2 border-black bg-white py-3 text-center text-2xl text-gray-600 outline-none focus:placeholder:text-transparent"/>
    )
}

export default Input;
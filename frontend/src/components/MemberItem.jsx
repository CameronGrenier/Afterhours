import { useState, useRef, useEffect } from 'react'
import { CircleX } from 'lucide-react'
import "./MemberItem.css"
import kickPlayerIcon from '../assets/components/MemberItem/KickPlayerIcon.png'

// TODO: Replace this stub with the real backend call when the endpoint exists.
function handleKickUser(username) {
    console.log("Kicked Player:", username)
}

function MemberItem( { username } ) {

    const [isKickState, setIsKickState] = useState(false)
    const memberRef = useRef(null)

    // If the user clicks to kick a user then wants to click off
    useEffect(() => {
        function handleClickOutside(event) {
            if (memberRef.current && !memberRef.current.contains(event.target)) {
                setIsKickState(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    return (
        <div
            ref={memberRef}
            className={`member-item ${isKickState ? 'kick-state' : ''}`}
        >
            <div className="member-item-slider">
                <button
                    type="button"
                    className="member-item-front"
                    onClick={() => setIsKickState(true)}
                >
                    <span className="member-item-username">{username}</span>
                    <img src={kickPlayerIcon} className="door-kick-icon" alt="" />
                </button>

                <div className="member-item-back">
                    <button
                        type="button"
                        className="member-item-kick-button"
                        onClick={() => handleKickUser(username)}
                    >
                        <span className="member-item-kick">Kick?</span>
                    </button>
                    <button
                        type="button"
                        className="member-item-close-button"
                        onClick={() => setIsKickState(false)}
                        aria-label={`Cancel kick for ${username}`}
                    >
                        <CircleX className="kick-icon" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default MemberItem;

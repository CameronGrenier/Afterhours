import "./Panel.css"
import { onClose } from 'react'
import { CircleX } from 'lucide-react'


function Panel( { header, children, count, onClose } ) {
    return (
        <section className= "panel">
            <div className= "panel-header">
                <span className = "panel-title">{header}</span>
                {count !== undefined ? <span className = "player-count">{count}</span> : null}
            </div>

            <div className= "panel-body">
                {children}
            </div>
        </section>
    )
}

export default Panel

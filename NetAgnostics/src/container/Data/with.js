import Context from './Context'
import React from 'react'

const withContainer  = (Component) => {
    const ChildComponent = (props) => {
        return (
            <Context.Consumer>
                {(value) => {
                    return <Component {...value} {...props} />
                }}
            </Context.Consumer>
        )
    }

    return ChildComponent
}

export default withContainer
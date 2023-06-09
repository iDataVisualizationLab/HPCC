import { useContext } from 'react'
import Context from './Context'
export { default as withDatabase } from './with.js'
export { default } from './Provider.js'

export function useData() {
    return useContext(Context)
}
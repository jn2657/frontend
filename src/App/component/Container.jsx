import Sidebar from './Sidebar'
// - [ ] ::TODO:: NBN: this file Needs a Better Name.

export default function Container({children}) {
  return (
    <div>
      <Sidebar>
        {children}
      </Sidebar>
    </div>
  )
}

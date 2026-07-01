import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function Layout() {
  return (
    <div className="max-w-md mx-auto min-h-[100dvh] pb-20">
      <Outlet />
      <BottomNav />
    </div>
  )
}

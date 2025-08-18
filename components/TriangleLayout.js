import TriangleSideNav from './TriangleSideNav'

export default function TriangleLayout({ children }) {
  return (
    <div className="triangle-layout">
      <TriangleSideNav />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="flex h-16 items-center px-4 md:px-6">
          <h1 className="text-xl font-bold">ReviewAssist AI</h1>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <a className="text-sm font-medium hover:underline underline-offset-4" href="#">
              Overview
            </a>
            <a className="text-sm font-medium hover:underline underline-offset-4" href="#">
              Locations
            </a>
            <a className="text-sm font-medium hover:underline underline-offset-4" href="#">
              Settings
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1 space-y-4 p-8 pt-6">
        {children}
      </main>
    </div>
  )
}

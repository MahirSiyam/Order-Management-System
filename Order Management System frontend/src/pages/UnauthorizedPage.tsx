import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-base-100 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error/15 text-error">
        <ShieldAlert className="h-9 w-9" />
      </div>
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-base-content">You are not authorized</h1>
        <p className="mt-2 text-base-content/70">
          This area is restricted. Contact an administrator if you need access.
        </p>
      </div>
      <Link to="/" className="btn btn-primary rounded-xl">
        Back to dashboard
      </Link>
    </div>
  )
}

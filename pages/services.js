import { useEffect } from 'react'
import { useRouter } from 'next/router'

/**
 * /services redirect
 * Triangle Platform is now pure SaaS
 * Professional services have been archived
 * Redirect users to /pricing for subscription options
 */
export default function Services() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/pricing')
  }, [router])

  return null
}

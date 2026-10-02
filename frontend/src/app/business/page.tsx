import type { Metadata } from 'next'
import { BusinessModel } from '@/components/BusinessModel'
import { SiteFooter, SiteHeader } from '@/components/Site'

export const metadata: Metadata = { title: 'Business model' }

export default function BusinessPage() {
  return (
    <>
      <SiteHeader dark />
      <BusinessModel />
      <SiteFooter />
    </>
  )
}

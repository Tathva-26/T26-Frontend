import EventDetailPage from '@/pageComponents/EventDetail/EventDetailPage'

export default async function WorkshopDetailPage({ params }) {
  const { id } = await params

  return (
    <EventDetailPage
      id={id}
      label='Workshop'
      heading='WORKSHOPS'
      backHref='/workshops'
    />
  )
}

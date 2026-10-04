import EventDetailPage from '@/pageComponents/EventDetail/EventDetailPage'

export default async function WorkshopDetailPage({ params }) {
  const { id } = await params

  return (
    <EventDetailPage
      id={id}
      eventType='workshops'
      label='Workshop'
      heading='WORKSHOPS'
      backHref='/workshops'
    />
  )
}

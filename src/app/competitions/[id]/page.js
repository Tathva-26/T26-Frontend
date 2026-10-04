import EventDetailPage from '@/pageComponents/EventDetail/EventDetailPage'

export default async function CompetitionDetailPage({ params }) {
  const { id } = await params

  return (
    <EventDetailPage
      id={id}
      eventType='competitions'
      label='Competition'
      heading='COMPETITIONS'
      backHref='/competitions'
    />
  )
}

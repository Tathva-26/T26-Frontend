import EventDetailPage from '@/pageComponents/EventDetail/EventDetailPage'

export default async function LectureDetailPage({ params }) {
  const { id } = await params

  return (
    <EventDetailPage
      id={id}
      eventType='lectures'
      label='Lecture'
      heading='LECTURES'
      backHref='/lectures'
    />
  )
}

const workshopPlaceholder = {
  id: "workshop-slug",
  title: "WORKSHOPS",
  price: "999",
  date: "09 OCT",
  seatsLeft: "--",
  image: "/images/workshops/workshop-card.png",
  imageAlt: "Workshop participant at a computer",
  details:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  registrationUrl: "#",
  contacts: [
    { name: "John Doe", phone: "1234567890" },
    { name: "Jane Doe", phone: "9087654321" },
  ],
};

function normaliseWorkshop(workshop) {
  return {
    ...workshopPlaceholder,
    ...workshop,
    image: workshop.image ?? workshop.imageUrl ?? workshopPlaceholder.image,
    imageAlt: workshop.imageAlt ?? workshop.title ?? workshopPlaceholder.imageAlt,
    seatsLeft: workshop.seatsLeft ?? workshop.availableSeats ?? workshopPlaceholder.seatsLeft,
    details: workshop.details ?? workshop.description ?? workshopPlaceholder.details,
    registrationUrl: workshop.registrationUrl ?? workshop.registrationLink ?? workshopPlaceholder.registrationUrl,
    contacts: workshop.contacts?.length ? workshop.contacts : workshopPlaceholder.contacts,
  };
}

/**
 * Server-only data boundary for the workshops backend.
 * Set WORKSHOPS_API_URL to the backend base URL; it should expose GET /workshops/featured.
 */
export async function getFeaturedWorkshop() {
  const backendUrl = process.env.WORKSHOPS_API_URL;

  if (!backendUrl) {
    return workshopPlaceholder;
  }

  try {
    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/workshops/featured`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return workshopPlaceholder;
    }

    return normaliseWorkshop(await response.json());
  } catch {
    return workshopPlaceholder;
  }
}

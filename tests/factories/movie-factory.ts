import { faker } from "@faker-js/faker";
import { Movie } from "@prisma/client";
import prisma from "database";

export async function generateMovie(params?: Partial<Omit<Movie, "id">>) {
	const data: Omit<Movie, "id"> = {
		...params,
		adultsOnly: faker.datatype.boolean(),
		name: faker.music.songName(),
		rentalId: null,
	};

	const movie = await prisma.movie.create({ data });
	return movie;
}

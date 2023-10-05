import rentalsRepository from "repositories/rentals-repository";
import { generateMovie } from "./movie-factory";
import { generateUser } from "./user-factory";
import prisma from "database";

export async function generateRental(params?: {
	userId?: number;
	moviesId?: Array<number>;
}) {
	const userId = params ? params.userId : undefined;
	const moviesId = params ? params.moviesId : undefined;

	if (userId && !moviesId) {
		const movie = await generateMovie();

		const data = {
			moviesId: [movie.id],
			userId,
		};

		await rentalsRepository.createRental(data);

		const rental = await prisma.rental.findFirst({
			where: { userId: userId, closed: false },
		});
		return rental;
	}

	if (moviesId && !userId) {
		const user = await generateUser();

		const data = {
			moviesId,
			userId: user.id,
		};

		await rentalsRepository.createRental(data);

		const rental = await prisma.rental.findFirst({
			where: { userId: user.id, closed: false },
		});
		return rental;
	} else {
		const user = await generateUser();
		const movie = await generateMovie();

		const data = {
			moviesId: [movie.id],
			userId: user.id,
		};

		await rentalsRepository.createRental(data);

		const rental = await prisma.rental.findFirst({
			where: { userId: user.id, closed: false },
		});
		return rental;
	}
}

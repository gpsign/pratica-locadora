import moviesRepository from "repositories/movies-repository";
import rentalsRepository from "repositories/rentals-repository";
import usersRepository from "repositories/users-repository";
import rentalsService from "services/rentals-service";

const mockArray = [
	{
		id: 1,
		date: "2023-10-05T12:44:02.438Z",
		endDate: "1970-01-01T00:00:00.008Z",
		userId: 1,
		closed: false,
	},
	{
		id: 2,
		date: "2023-10-05T12:44:27.894Z",
		endDate: "1970-01-01T00:00:00.008Z",
		userId: 2,
		closed: false,
	},
];

describe("Rentals Service Unit Tests", () => {
	describe("getRentals", () => {
		it("should return all rentals", () => {
			jest.spyOn(rentalsRepository, "getRentals").mockImplementationOnce(() => {
				return mockArray;
			});

			const result = rentalsService.getRentals();

			expect(result).resolves.toEqual(mockArray);
		});
	});

	describe("getRentalbyId", () => {
		it("should throw notFoundError if rental is not found", () => {
			jest
				.spyOn(rentalsRepository, "getRentalById")
				.mockImplementationOnce(() => {
					return null;
				});

			const result = rentalsService.getRentalById(1);

			expect(result).rejects.toEqual({
				name: "NotFoundError",
				message: "Rental not found.",
			});
		});

		it("should return rental data if found", () => {
			jest
				.spyOn(rentalsRepository, "getRentalById")
				.mockImplementationOnce(() => {
					return mockArray[0];
				});

			const result = rentalsService.getRentalById(1);

			expect(result).resolves.toEqual(mockArray[0]);
		});
	});

	describe("createRental", () => {
		it("should throw NotFoundError if user is not found", () => {
			jest.spyOn(usersRepository, "getById").mockImplementationOnce(() => {
				return null;
			});

			const result = rentalsService.createRental({ moviesId: [1], userId: 1 });

			expect(result).rejects.toEqual({
				name: "NotFoundError",
				message: "User not found.",
			});
		});

		it("should throw PendentRentalError if user already has a rental", () => {
			jest
				.spyOn(usersRepository, "getById")
				.mockImplementationOnce(async () => {
					return {
						id: 1,
						birthDate: new Date(),
						cpf: "1234567890",
						email: "g@mail.com",
						firstName: "Gabriel",
						lastName: "Gabriel",
					};
				});

			jest
				.spyOn(rentalsRepository, "getRentalsByUserId")
				.mockImplementationOnce(async () => {
					return mockArray;
				});

			const result = rentalsService.createRental({ moviesId: [1], userId: 1 });

			expect(result).rejects.toEqual({
				name: "PendentRentalError",
				message: "The user already have a rental!",
			});
		});

		it("should throw NotFoundError if movie is not found", () => {
			jest
				.spyOn(usersRepository, "getById")
				.mockImplementationOnce(async () => {
					return {
						id: 1,
						birthDate: new Date(),
						cpf: "1234567890",
						email: "g@mail.com",
						firstName: "Gabriel",
						lastName: "Gabriel",
					};
				});

			jest
				.spyOn(rentalsRepository, "getRentalsByUserId")
				.mockImplementationOnce(async () => {
					return [];
				});

			jest
				.spyOn(moviesRepository, "getById")
				.mockImplementationOnce(async () => {
					return null;
				});

			const result = rentalsService.createRental({ moviesId: [1], userId: 1 });

			expect(result).rejects.toEqual({
				name: "NotFoundError",
				message: "Movie not found.",
			});
		});

		it("should throw MovieRentalError if movie is already in a rental", () => {
			jest
				.spyOn(usersRepository, "getById")
				.mockImplementationOnce(async () => {
					return {
						id: 1,
						birthDate: new Date(),
						cpf: "1234567890",
						email: "g@mail.com",
						firstName: "Gabriel",
						lastName: "Gabriel",
					};
				});

			jest
				.spyOn(rentalsRepository, "getRentalsByUserId")
				.mockImplementationOnce(async () => {
					return [];
				});

			jest
				.spyOn(moviesRepository, "getById")
				.mockImplementationOnce(async () => {
					return { adultsOnly: false, id: 1, name: "Titulo", rentalId: 1 };
				});

			const result = rentalsService.createRental({ moviesId: [1], userId: 1 });

			expect(result).rejects.toEqual({
				name: "MovieInRentalError",
				message: "Movie already in a rental.",
			});
		});

		it("should throw InsufficientAgeError if movie is for adults and user is underage", () => {
			jest
				.spyOn(usersRepository, "getById")
				.mockImplementationOnce(async () => {
					return {
						id: 1,
						birthDate: new Date(),
						cpf: "1234567890",
						email: "g@mail.com",
						firstName: "Gabriel",
						lastName: "Gabriel",
					};
				});

			jest
				.spyOn(rentalsRepository, "getRentalsByUserId")
				.mockImplementationOnce(async () => {
					return [];
				});

			jest
				.spyOn(moviesRepository, "getById")
				.mockImplementationOnce(async () => {
					return { adultsOnly: true, id: 1, name: "Titulo", rentalId: null };
				});

			const result = rentalsService.createRental({ moviesId: [1], userId: 1 });

			expect(result).rejects.toEqual({
				name: "InsufficientAgeError",
				message: "Cannot see that movie.",
			});
		});

		it("should create rental", () => {
			jest
				.spyOn(usersRepository, "getById")
				.mockImplementationOnce(async () => {
					return {
						id: 1,
						birthDate: new Date(),
						cpf: "1234567890",
						email: "g@mail.com",
						firstName: "Gabriel",
						lastName: "Gabriel",
					};
				});

			jest
				.spyOn(rentalsRepository, "getRentalsByUserId")
				.mockImplementationOnce(async () => {
					return [];
				});

			jest
				.spyOn(moviesRepository, "getById")
				.mockImplementationOnce(async () => {
					return { adultsOnly: false, id: 1, name: "Titulo", rentalId: null };
				});

			jest
				.spyOn(rentalsRepository, "createRental")
				.mockImplementationOnce(async () => {
					return;
				});

			const result = rentalsService.createRental({ moviesId: [1], userId: 1 });

			expect(result).resolves;
		});
	});

	describe("finishRental", () => {
		it("should throw NotFoundError if rental is not found", () => {
			jest
				.spyOn(rentalsRepository, "getRentalById")
				.mockImplementationOnce(() => {
					return null;
				});

			const result = rentalsService.finishRental(1);

			expect(result).rejects.toEqual({
				name: "NotFoundError",
				message: "Rental not found.",
			});
		});

		it("should close rental", () => {
			jest
				.spyOn(rentalsRepository, "getRentalById")
				.mockImplementationOnce(() => {
					return mockArray[0];
				});
			jest
				.spyOn(rentalsRepository, "finishRental")
				.mockImplementationOnce(async () => {
					return;
				});

			const result = rentalsService.finishRental(1);

			expect(result).resolves;
		});
	});
});

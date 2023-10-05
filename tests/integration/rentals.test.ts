import supertest from "supertest";
import app from "app";
import httpStatus from "http-status";
import prisma from "database";
import { generateUser } from "../factories/user-factory";
import { generateRental } from "../factories/rental-factory";
import { generateMovie } from "../factories/movie-factory";
import { json } from "stream/consumers";
import { Rental } from "@prisma/client";

const server = supertest(app);

beforeEach(async () => {
	await prisma.rental.deleteMany({});
	await prisma.movie.deleteMany({});
	await prisma.user.deleteMany({});
});

describe("Rentals Service Unit Tests", () => {
	describe("POST /rentals", () => {
		describe("when body is invalid", () => {
			it("should return 422 if body is not present", async () => {
				const { status } = await server.post("/rentals").send({});

				expect(status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
			});

			it("should return 422 if userId is invalid", async () => {
				const { status } = await server
					.post("/rentals")
					.send({ userId: "NaN", moviesId: [1] });

				expect(status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
			});

			it("should return 422 if moviesId is not an array", async () => {
				const { status } = await server
					.post("/rentals")
					.send({ userId: 1, moviesId: 1 });

				expect(status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
			});
		});

		describe("when body is valid", () => {
			it("should return 404 if user was not found", async () => {
				const { status, text } = await server
					.post("/rentals")
					.send({ userId: 1, moviesId: [1] });

				expect(status).toBe(httpStatus.NOT_FOUND);
				expect(JSON.parse(text)).toEqual({
					message: "User not found.",
				});
			});

			it("should return 402 if user already has a rental", async () => {
				const user = await generateUser();
				await generateRental({ userId: user.id });

				const { status, text } = await server
					.post("/rentals")
					.send({ userId: user.id, moviesId: [1] });

				expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
				expect(text).toEqual("The user already have a rental!");
			});

			it("should return 404 if movie was not found", async () => {
				const user = await generateUser();

				const { status, text } = await server
					.post("/rentals")
					.send({ userId: user.id, moviesId: [1] });

				expect(status).toBe(httpStatus.NOT_FOUND);
				expect(JSON.parse(text)).toEqual({
					message: "Movie not found.",
				});
			});

			it("should return 409 if movie is in a rental", async () => {
				const user = await generateUser();
				const movie = await generateMovie();
				await generateRental({
					moviesId: [movie.id],
				});

				const { status, text } = await server
					.post("/rentals")
					.send({ userId: user.id, moviesId: [movie.id] });

				expect(status).toBe(httpStatus.CONFLICT);
				expect(text).toEqual("Movie already in a rental.");
			});

			it("should return 201 when created", async () => {
				const user = await generateUser();
				const movie = await generateMovie();

				const { status, body } = await server
					.post("/rentals")
					.send({ userId: user.id, moviesId: [movie.id] });

				expect(status).toBe(httpStatus.CREATED);
			});
		});
	});

	describe("POST /rentals/finish", () => {
		describe("when body is invalid", () => {
			it("should return 422 if body is not present", async () => {
				const { status } = await server.post("/rentals/finish").send({});

				expect(status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
			});

			it("should return 422 if rentalId is invalid", async () => {
				const { status } = await server
					.post("/rentals/finish")
					.send({ rentalId: "NaN" });

				expect(status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
			});
		});

		describe("when body is valid", () => {
			it("should return 404 if rental was not found", async () => {
				const { status, text } = await server
					.post("/rentals/finish")
					.send({ rentalId: 1 });

				expect(status).toBe(httpStatus.NOT_FOUND);
				expect(JSON.parse(text)).toEqual({
					message: "Rental not found.",
				});
			});

			it("should return 200 and close rental", async () => {
				const rental: Rental = await generateRental();

				const { status } = await server
					.post("/rentals/finish")
					.send({ rentalId: rental.id });

				const rentalAfter = await prisma.rental.findUnique({
					where: { id: rental.id },
				});
				expect(status).toBe(httpStatus.OK);
				expect(rentalAfter).toEqual({ ...rental, closed: true });
			});
		});
	});

	describe("GET /rentals", () => {
		it("should return 200 and an empty array when there is no rentals", async () => {
			const { status, body } = await server.get("/rentals");

			expect(status).toBe(httpStatus.OK);
			expect(body).toEqual([]);
		});
		it("should return 200 and all rentals", async () => {
			const rental = await generateRental();

			const { status, body } = await server.get("/rentals");

			expect(status).toBe(httpStatus.OK);
			expect(body).toEqual([
				{
					...rental,
					date: rental.date.toISOString(),
					endDate: rental.endDate.toISOString(),
				},
			]);
		});
	});

	describe("GET /rentals/:id", () => {
		it("should return 400 if id is invalid", async () => {
			const { status } = await server.get("/rentals/NaN");

			expect(status).toBe(httpStatus.BAD_REQUEST);
		});

		it("should return 404 if rental was not found", async () => {
			const { status, body } = await server.get("/rentals/1");

			expect(status).toBe(httpStatus.NOT_FOUND);
		});

		it("should return rental", async () => {
			const rental = await generateRental();
			const { body } = await server.get(`/rentals/${rental.id}`);

			expect(body).toEqual({
				...rental,
				date: rental.date.toISOString(),
				endDate: rental.endDate.toISOString(),
			});
		});
	});
});

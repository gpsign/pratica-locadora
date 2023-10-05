import { faker } from "@faker-js/faker";
import { User } from "@prisma/client";
import prisma from "database";

export async function generateUser(params?: Partial<Omit<User, "id">>) {
	const data: Omit<User, "id"> = {
		...params,
		birthDate: faker.date.birthdate(),
		cpf: faker.phone.number(),
		email: faker.internet.email(),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
	};

	const user = await prisma.user.create({ data });
	return user;
}

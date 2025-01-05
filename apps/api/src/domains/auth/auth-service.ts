import { User } from "./user.entity.js";
import type { ServiceContext } from "../../libs/service-context.js";
import type { Repository } from "typeorm";
import {
  adjectives,
  animals,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { v4 } from "uuid";

export class AuthService {
  readonly userRepository: Repository<User>;
  constructor(context: ServiceContext) {
    this.userRepository = context.entityManager.getRepository(User);
  }

  async createAnonUser(): Promise<User> {
    const user = new User();
    user.id = v4();
    user.name = uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: " ",
      style: "capital",
      length: 2,
    });
    return await this.userRepository.save(user);
  }
}

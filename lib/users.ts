import { getMongoClient, COLLECTIONS, type Role } from "@/lib/config";
import { ObjectId } from "mongodb";

export type UserRecord = {
  _id: ObjectId;
  name: string;
  its: number;
  passwordHash: string;
  phoneOrEmail?: string;
  role: Role;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function getUsersCollection() {
  const client = await getMongoClient();
  return client.db().collection<UserRecord>(COLLECTIONS.USERS);
}

export async function findUserByITS(its: number) {
  const users = await getUsersCollection();
  return users.findOne({ its });
}

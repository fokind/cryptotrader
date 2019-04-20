import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { ODataController, Edm, odata, ODataQuery } from "odata-v4-server";
import { Account } from "../models/Account";
import { Credential } from "../models/Credential";
import connect from "../connect";

const collectionName = "account";

@odata.type(Account)
@Edm.EntitySet("Accounts")
export class AccountController extends ODataController {
  async get(@odata.query query: ODataQuery): Promise<Account[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    if (typeof mongodbQuery.query._id == "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    let result = typeof mongodbQuery.limit == "number" && mongodbQuery.limit === 0 ? [] : await db.collection(collectionName)
      .find(mongodbQuery.query)
      .project(mongodbQuery.projection)
      .skip(mongodbQuery.skip || 0)
      .limit(mongodbQuery.limit || 0)
      .sort(mongodbQuery.sort)
      .toArray();//TODO заменить на поток
    if (mongodbQuery.inlinecount) {
      (<any>result).inlinecount = await db.collection(collectionName)
        .find(mongodbQuery.query)
        .project(mongodbQuery.projection)
        .count(false);
    }
    return result;
  }

  @odata.GET
  async getById(@odata.key key: string, @odata.query query: ODataQuery): Promise<Account> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return await db.collection(collectionName).findOne({_id: keyId}, {
      fields: mongodbQuery.projection // TODO заменить
    });
  }

  @odata.POST
  async post(@odata.body data: any): Promise<Account> {
    const db = await connect();
    const { name, Credentials } = data;
    const account = new Account({ name });
    // const credentials = data.Credentials;
    // delete data.Credentials;

    const { insertedId } = await db.collection(collectionName).insertOne(account);
    account._id = insertedId;
    const { insertedIds } = await db.collection("credential").insertMany(Credentials.map(e => {
      e.accountId = insertedId;
      return e;
    }));
    account.Credentials = Credentials;
    return account;
  }

  @odata.DELETE
  async delete(@odata.key key: string): Promise<number> {
    const db = await connect();
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return await db.collection(collectionName).deleteOne({_id: keyId}).then(result => result.deletedCount);
  }

  @odata.GET("Credentials")
  async getCredentials(@odata.result result: any, @odata.query query: ODataQuery): Promise<Credential[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    const accountId = new ObjectID(result._id);
    // if (typeof mongodbQuery.query._id === "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id); // зачем?
    // if (typeof mongodbQuery.query.accountId === "string") mongodbQuery.query.accountId = new ObjectID(mongodbQuery.query.accountId);
    // let creds = await db.collection("credential").find({ accountId: result._id }).toArray();

    let credentials = typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0 ? [] : await db.collection("credential")
      .find({ $and: [{ accountId }, mongodbQuery.query] })
      .project(mongodbQuery.projection)
      .skip(mongodbQuery.skip || 0)
      .limit(mongodbQuery.limit || 0)
      .sort(mongodbQuery.sort)
      .toArray();
    if (mongodbQuery.inlinecount) {
      (<any>credentials).inlinecount = await db.collection("credential")
        .find({ $and: [{ accountId }, mongodbQuery.query] })
        .project(mongodbQuery.projection)
        .count(false);
    }
    return credentials;
  }
}

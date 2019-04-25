import { MongoClient, Db } from "mongodb";

let connect: MongoClient;

export default async function(): Promise<Db>{
    const uri = process.env.NODE_ENV === "production" ?
    "mongodb://localhost:27017/crypto" :
    "mongodb://localhost:27017/crypto";

    if (!connect) connect = await MongoClient.connect(uri);
    if (!connect.isConnected()) await connect.connect();
    
    return connect.db('crypto');
};
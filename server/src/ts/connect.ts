import { MongoClient, Db } from "mongodb";

export default async function(): Promise<Db>{
    const uri = process.env.NODE_ENV === "production" ?
    "mongodb://localhost:27017/crypto" :
    "mongodb://localhost:27017/crypto";
    
    return (await MongoClient.connect(uri)).db('crypto');
};
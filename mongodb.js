import { MongoClient, ServerApiVersion } from "mongodb";
import { mongo_url } from "./constants.js";

const client = new MongoClient(mongo_url, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


export async function uploadData(data) {
  try {
    await client.connect();
    const db = client.db("TwitterData");
    const collection = db.collection("Trends");

    const result = await collection.insertOne(data);
    console.log(`Document was inserted into the database.`);

    const insertedDocument = await collection.findOne({
      _id: result.insertedId,
    });

    return insertedDocument;
  } catch (error) {
    console.error("Error uploading data: ", error);
  } finally {
    await client.close();
  }
}
import { ObjectId } from 'mongodb';

export const fetchAllPlayers = async (collection) => {
    return await collection.find()
      // using collation so sort is case insensitive
      .collation({ locale: 'en' })
      .sort({ name: 1 })
      .toArray();
};

export const fetchAllSeasons = async (collection) => {
  return await collection.find()
    // using collation so sort is case insensitive
    .collation({ locale: 'en' })
    .sort({ name: 1 })
    .toArray();
};

export const fetchPlayerById = async (collection, playerId) => {
    return await collection.findOne({
      _id: new ObjectId(playerId)
    });
};

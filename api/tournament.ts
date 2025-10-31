import { MongoClient } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import {
  getTournament,
  getTournaments,
  insertTournament,
  editTournament,
  duplicateTournament,
  deleteTournament,
  userOwnsEvent
} from './_utils.js';

const client = new MongoClient(database_uri);

export default async (req, res) => {
  try {
    await client.connect();

    const database = client.db(database_name);
    const tournamentsCol = database.collection('tournaments');
    const seasonsCol = database.collection('seasons');
    const playersCol = database.collection('players');

    if (req.method === 'GET') {
      const event_id = req.query.event_id;
      const tournaments = req.query.tournament_id
        ? await getTournament(tournamentsCol, event_id, req.query.tournament_id)
        : await getTournaments(tournamentsCol, event_id, req.body.season_id);
      const data = {
        seasons: await seasonsCol.find({event_id}).sort({ name: -1 }).toArray(),
        players: await playersCol.find({event_id}).sort({ name: 1 }).toArray(),
        tournaments: tournaments
      };
      res.json(data);
    }

    if (req.method === 'POST') {
      const event_id = req.body.event_id;
      const events = database.collection('events');
      if (!await userOwnsEvent(event_id, req.cookies.jwt, events)) {
        throw new Error('Either event ID is not valid or Logged-in user is not owner of the event');
      }
      const returnAllTournaments = async () => {
        const tournamentsData = await getTournaments(tournamentsCol, event_id);
        res.json({
          data: {
            tournaments: tournamentsData
          }
        });
      };

      if (req.body.tournament_id) {
        if (req.body.form_action) {
          // duplicate tournament
          if (req.body.form_action === 'duplicate') {
            const response = await duplicateTournament(tournamentsCol, req);
            if (response && response.insertedId) {
              await returnAllTournaments();
            } else {
              throw new Error('Failed to duplicate tournament');
            }
          }
          if (req.body.form_action === 'delete') {
            const response = await deleteTournament(tournamentsCol, req);
            if (response && response.deletedCount > 0) {
              await returnAllTournaments();
            } else {
              throw new Error('Failed to delete tournament!');
            }
          }
        } else {
          // edit tournament
          const response = await editTournament(tournamentsCol, req);
          if (response && response.modifiedCount > 0) {
            await returnAllTournaments();
          } else {
            throw new Error('Failed to edit tournament');
          }
        }
      } else {
        // add tournament
        const response = await insertTournament(tournamentsCol, req);
        if (response && response.insertedId) {
          await returnAllTournaments();
        } else {
          throw new Error('Failed to add tournament');
        }
      }
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({
      error: e.message
    });
  } finally {
    await client.close();
  }
}

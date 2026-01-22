import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import {
  getTournament,
  getTournaments,
  duplicateTournament,
  deleteTournament,
  userOwnsLeague,
  createTournamentDocument
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
      const league_id = req.query.league_id;
      const tournaments = req.query.tournament_id
        ? await getTournament(tournamentsCol, league_id, req.query.tournament_id)
        : await getTournaments(tournamentsCol, league_id, req.body.season_id);
      const data = {
        seasons: await seasonsCol.find({league_id}).sort({ name: -1 }).toArray(),
        players: await playersCol.find({league_id}).sort({ name: 1 }).toArray(),
        tournaments: tournaments
      };
      res.json(data);
    }

    if (req.method === 'POST') {
      const league_id = req.body.league_id;
      const leagues = database.collection('leagues');
      if (!await userOwnsLeague(league_id, req.cookies.jwt, leagues)) {
        throw new Error('Either league id is not valid or Logged-in user is not owner of the league');
      }

      if (req.body.tournament_id) {
        if (req.body.form_action) {
          // duplicate tournament
          if (req.body.form_action === 'duplicate') {
            const response = await duplicateTournament(tournamentsCol, req);
            if (response && response.insertedId) {
              const tournamentsData = await getTournaments(tournamentsCol, league_id);
              res.json({
                data: {
                  tournaments: tournamentsData,
                },
                tournament_id: response.insertedId.toString()
              });
            } else {
              throw new Error('Failed to duplicate tournament');
            }
          }

          // delete tournament
          if (req.body.form_action === 'delete') {
            const response = await deleteTournament(tournamentsCol, req);
            if (response && response.deletedCount > 0) {
              const tournamentsData = await getTournaments(tournamentsCol, league_id);
              res.json({
                data: {
                  tournaments: tournamentsData
                }
              });
            } else {
              throw new Error('Failed to delete tournament!');
            }
          }
        } else {
          // edit tournament
          const responseObject = createTournamentDocument(req);
          if (responseObject.document) {
            const query = { _id: ObjectId.createFromHexString(req.body.tournament_id) };
            const response = await tournamentsCol.replaceOne(query, responseObject.document);
            if (response && response.modifiedCount > 0) {
              const tournamentsData = await getTournaments(tournamentsCol, league_id);
              res.json({
                data: {
                  tournaments: tournamentsData
                }
              });
            } else {
              throw new Error('Database error');
            }
          } else {
            throw new Error(`Failed to save changes. ${responseObject.error}`);
          }
        }
      } else {
        // add tournament
        const responseObject = createTournamentDocument(req);
        if (responseObject.document) {
          const response = await tournamentsCol.insertOne(responseObject.document);
          if (response && response.insertedId) {
            const tournamentsData = await getTournaments(tournamentsCol, league_id);
            res.json({
              data: {
                tournaments: tournamentsData
              }
            });
          } else {
            throw new Error('Database error');
          }
        } else {
          throw new Error('Failed to save changes.');
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

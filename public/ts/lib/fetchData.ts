import { Json } from './types.js';

export default async function fetchData() {
    try {
        const response = await fetch('/api/tournament', {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
        });
        const json: Json = await response.json();
        if (!json) throw ('Failed to fetch data from server!');
        if (json.error) {
            throw(json.message);
        } else {
            return json;
        }
    } catch (e) {
        console.error(` Error: ${e}`);
    }
}

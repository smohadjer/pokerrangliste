import { Data } from './types.js';

export default async function fetchData() {
    try {
        const response = await fetch('/api/tournament', {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
        });
        const json: Data = await response.json();
        if (json.error) {
            throw(json.message);
        } else {
            return json;
        }
    } catch (e) {
        console.error(` Error: ${e}`);
    }
}

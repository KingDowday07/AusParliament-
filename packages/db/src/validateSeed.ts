import { loadSeed } from "./loadSeed";

loadSeed()
  .then((data) => {
    console.error(
      `OK: ${data.entities.length} entities, ${data.seats.length} seats, ` +
        `${data.persons.length} persons, ${data.terms.length} terms, ` +
        `${data.relationships.length} relationships. Referential integrity check passed.`,
    );
  })
  .catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });

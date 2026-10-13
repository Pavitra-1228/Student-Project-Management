export function buildUpdate(data, columns) {
  const sets = [];
  const values = [];
  for (const [key, column] of Object.entries(columns)) {
    if (data[key] !== undefined) {
      values.push(data[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }
  return { sets, values };
}

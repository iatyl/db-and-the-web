function getConnection(connection) {
  if (!connection) {
    return global.db
  }
  return connection
}
function count(table, connection) {
  connection = getConnection(connection)
  const result = connection.query(`SELECT COUNT(*) FROM ${table}`)
  const cnt = result[0]["COUNT(*)"]
  return cnt
}
function exists(table, connection) {
  connection = getConnection(connection)
  const result = connection.query("SELECT * FROM ?", [table])
  return result.length > 0
}
function deleteById(table, id, connection) {
  connection = getConnection(connection)
  const result = connection.query("DELETE FROM ? WHERE id=?", [table, id])
  return result.affectedRows > 0
}
function byId(table, id, connection) {
  connection = getConnection(connection)
  const result = connection.query(`SELECT * FROM ${table} WHERE id = ?`, [id])
  if (result.length === 0) {
    return null
  }
  return result[0]
}

module.exports = {
  count,
  exists,
  byId,
  deleteById,
}

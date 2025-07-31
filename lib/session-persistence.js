const SeedData = require("./seed-data");
const deepCopy = require("./deep-Copy");

class SessionPersistence {
  constructor(session) {
    this._todoLists = session.todoLists || deepCopy(SeedData); //deepCopy of SD only temp
    session.todoLists = this._todoLists;
  }
};

module.exports = SessionPersistence;
const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");

class PgPersistence {
  // Returns the todo list with the indicated ID. Returns `undefined`
  // if not found. Note that `todoListId` must be numeric.
  async loadTodoList(todoListId) {
    const TODOLIST = "SELECT * FROM todolists WHERE id = $1";
    const FIND_TODOS = "SELECT * FROM todos WHERE todolist_id = $1";
    // await can be omitted, as all are resolved at once with Promise.all below
    let todoListResult = dbQuery(TODOLIST, todoListId);
    let todosResult = dbQuery(FIND_TODOS, todoListId);
    let resultBoth = await Promise.all([todoListResult, todosResult]);
    // finds the object with the rows array containing the todoList object
    // rows has one todolist object, thus it needs to be accessed by [0]
    let todoList = resultBoth[0].rows[0];
    if (!todoList) return undefined;

    todoList.todos = resultBoth[1].rows;

    return todoList;
  }

  // Find a todo with the indicated ID in the indicated todo list. Returns
  // `undefined` if not found. Note that both `todoListId` and `todoId` must be
  // numeric.
  async loadTodo(todoListId, todoId) {
    const FIND_TODO = 'SELECT * FROM todos WHERE todolist_id = $1 AND id = $2';
    let result = await dbQuery(FIND_TODO, todoListId, todoId);

    return result.rows[0]
  }

  // Does the todo list have any undone todos? Returns true if yes, false if no.
  hasUndoneTodos(todoList) {
    return todoList.todos.some(todo => !todo.done);
  }
  
  // Are all of the todos in the todo list done? If the todo list has at least
  // one todo and all of its todos are marked as done, then the todo list is
  // done. Otherwise, it is undone.
  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 && todoList.todos.every(todo => todo.done);
  }

  // Returns a promise that resolves to a sorted list of all the todo lists
  // together with their todos. The list is sorted by completion status and
  // title (case-insensitive). The todos in the list are unsorted.
  async sortedTodoLists() {
    const ALL_TODOLISTS = "SELECT * FROM todolists ORDER BY lower(title) ASC";
    const FIND_TODOS = "SELECT * FROM todos WHERE todolist_id = $1";

    let result = await dbQuery(ALL_TODOLISTS);
    let todoLists = result.rows;

    for (let index = 0; index < todoLists.length; ++index) {
      let todoList = todoLists[index];
      let todos = await dbQuery(FIND_TODOS, todoList.id);
      todoList.todos = todos.rows;
    }

    return this._partitionTodoLists(todoLists);
  }

  // Returns a new list of todo lists partitioned by completion status.
  _partitionTodoLists(todoLists) {
    let undone = [];
    let done = [];

    todoLists.forEach(todoList => {
      if (this.isDoneTodoList(todoList)) {
        done.push(todoList);
      } else {
        undone.push(todoList);
      }
    });

    return undone.concat(done);
  }

  // Returns a promise that resolves to a sorted list of all the todos in the
  // specified todo list. The list is sorted by completion status and title
  // (case-insensitive).
  async sortedTodos(todoList) {
    const SORTED_TODOS = 'SELECT * FROM todos WHERE todolist_id = $1 ORDER BY done, lower(title) ASC';
    let result = await dbQuery(SORTED_TODOS, todoList.id);

    return result.rows;
  }

  // Toggle a todo between the done and not done state. 
  // Both Id arguments must be numeric.
  async toggleTodo(todoListId, todoId) {
    const TOGGLE_DONE = "UPDATE todos SET done = NOT done WHERE todolist_id = $1 AND id = $2";

    await dbQuery(TOGGLE_DONE, todoListId, todoId);
  }

  // Delete a todo list and all of its todos (handled by cascade).
  async deleteTodoList(todoListId) {
    const DELETE_TODOLIST = 'DELETE FROM todolists WHERE id = $1';
    await dbQuery(DELETE_TODOLIST, todoListId);
  }

  // Delete a todo from the specified todo list.
  async deleteTodo(todoListId, todoId) {
    const DELETE_TODO = 'DELETE FROM todos WHERE todolist_id = $1 AND id = $2';
    await dbQuery(DELETE_TODO, todoListId, todoId);
  }
  // Checks if both, the todoList and Todo are valid.
  // Returns false if either doesn't exist, true otherwise.
  async _isValid(todoListId, todoId) {
    let todoList = await this.loadTodoList(todoListId);
    if (!todoList) return false

    let todo = await this.loadTodo(todoListId, todoId);
    if (!todo) return false

    return true;
  }
  
  // Checks if athe todoList is valid.
  // Returns false if it doesn't exist, true otherwise. 
  async _isValidTodoList(todoListId) {
    let todoList = await this.loadTodoList(todoListId);
    if (!todoList) return false

    return true;
  }

  // Does the todo list have any undone todos? Returns true if yes, false if no.
  async completeAllTodos(todoListId) {
    const COMPLETE_ALL_TODOS = 'UPDATE todos SET done = true WHERE todolist_id = $1 AND NOT done';
    await dbQuery(COMPLETE_ALL_TODOS, todoListId);
  }

  // Create a new todolist with the specified title.
  async addTodoList(title) {
    const CREATE_TODOLIST = 'INSERT INTO todolists (title) VALUES ($1)';
    await dbQuery(CREATE_TODOLIST, title);
  }

  // Create a new todo with the specified title and add it to the indicated todolist.
  async addTodo(todoListId, title) {
    const CREATE_TODO = 'INSERT INTO todos (title, todolist_id) VALUES ($2, $1)';
    await dbQuery(CREATE_TODO, todoListId, title);
  }
  
  // Set a new title for the specified todo list.
  async renameTodoList(todoListId, newTitle) {
    const RENAME_LIST = 'UPDATE todolists SET title = $2 WHERE id = $1';
    await dbQuery(RENAME_LIST, todoListId, newTitle);
  }

  // Returns a Promise that resolves to `true` if a todo list with the specified
  // title exists in the list of todo lists, `false` otherwise.
  async existsTodoListTitle(newTodoListTitle) {
    const FIND_LIST_TITLE = 'SELECT * FROM todolists WHERE title = $1';
    let result = await dbQuery(FIND_LIST_TITLE, newTodoListTitle);
    return result.rowCount > 0;
  }

  // Returns `true` if `error` seems to indicate a `UNIQUE` constraint
  // violation, `false` otherwise.
  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }

  async authenticate(username, password) {
    const FIND_HASHED_PASSWORD = 'SELECT password FROM users WHERE username = $1';
    let result = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (result.rowCount === 0) return false;

    let hashedPassword = result.rows[0].password;
    return bcrypt.compare(password, hashedPassword);
  }
};

module.exports = PgPersistence;
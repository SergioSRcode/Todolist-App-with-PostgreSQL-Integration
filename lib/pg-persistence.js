const { dbQuery } = require("./db-query");

class PgPersistence {
  constructor(session) {
    // this._todoLists = session.todoLists;
    // session.todoLists = this._todoLists;
  }
  
  // Returns a copy of the todo list with the indicated ID. Returns `undefined`
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

  _findTodoListIndex(todoListId) {
    // return this._todoLists.findIndex(todoList => todoListId === todoList.id);
  }

  _findTodoList(todoListId) {
    // return this._todoLists.find(todoList => todoListId === todoList.id);
  }

  _findTodo(todoListId, todoId) {
    // let originalTodoList = this._findTodoList(todoListId);
    // if (!originalTodoList) return undefined;
    
    // return originalTodoList.todos.find(todo => todoId === todo.id);
  }

  async toggleTodo(todoListId, todoId) {
    const TOGGLE_DONE = "UPDATE todos SET done = NOT done WHERE todolist_id = $1 AND id = $2";

    await dbQuery(TOGGLE_DONE, todoListId, todoId);
  }

  async deleteTodo(todoListId, todoId) {
    const DELETE_TODO = 'DELETE FROM todos WHERE todolist_id = $1 AND id = $2';
    await dbQuery(DELETE_TODO, todoListId, todoId);
  }
  
  async _isValid(todoListId, todoId) {
    let todoList = await this.loadTodoList(todoListId);
    if (!todoList) return false

    let todo = await this.loadTodo(todoListId, todoId);
    if (!todo) return false

    return true;
  }
  
  async _isValidTodoList(todoListId) {
    let todoList = await this.loadTodoList(todoListId);
    if (!todoList) return false

    return true;
  }

  async completeAllTodos(todoListId) {
    const COMPLETE_ALL_TODOS = 'UPDATE todos SET done = true WHERE todolist_id = $1 AND NOT done';
    await dbQuery(COMPLETE_ALL_TODOS, todoListId);
  }

  async addTodo(todoListId, title) {
    const CREATE_TODO = 'INSERT INTO todos (title, todolist_id) VALUES ($2, $1)';
    await dbQuery(CREATE_TODO, todoListId, title);
  }

  addTodoList(title) {
    // let todoList = {
      // id: nextId(),
      // title,
      // todos: [],
    // };
    
    // this._todoLists.push(todoList);
  }

  deleteTodoList(index) {
    // this._todoLists.splice(index, 1);
  }

  renameTodoList(todoListId, newTitle) {
    // let originalTodoList = this._findTodoList(todoListId);
    // originalTodoList.title = newTitle;
  }

  existsTodoListTitle(newTodoListTitle) {
    // const isDuplicateTitle = this._todoLists.some(todoList => todoList.title === newTodoListTitle);
    // return isDuplicateTitle;
  }
};

module.exports = PgPersistence;
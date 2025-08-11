// const { Client } = require("pg");
const { dbQuery } = require("./db-query");

module.exports = class PgPersistence {
  constructor(session) {
    // this._todoLists = session.todoLists || deepCopy(SeedData);
    // session.todoLists = this._todoLists;
  }

  // Returns a copy of the indicated todo in the indicated todo list. Returns
  // `undefined` if either the todo list or the todo is not found. Note that
  // both IDs must be numeric.
  loadTodo(todoListId, todoId) {
    // let todo = this._findTodo(todoListId, todoId);
    // return deepCopy(todo);
  }

  // Returns a promise that resolves to the todo list with the specified ID. The
  // todo list contains the todos for that list. The todos are not sorted. The
  // Promise resolves to `undefined` if the todo list is not found.
  async loadTodoList(todoListId) {
    const FIND_TODOLIST = "SELECT * FROM todolists WHERE id = $1";
    const FIND_TODOS = "SELECT * FROM todos WHERE todolist_id = $1";

    let resultTodoList = dbQuery(FIND_TODOLIST, todoListId);
    let resultTodos = dbQuery(FIND_TODOS, todoListId);
    let resultBoth = await Promise.all([resultTodoList, resultTodos]);

    let todoList = resultBoth[0].rows[0];
    if (!todoList) return undefined;

    todoList.todos = resultBoth[1].rows;
    return todoList;
  }

  // Does the todo list have any undone todos? Returns true if yes, false if no.
  hasUndoneTodos(todoList) {
    // return todoList.todos.some(todo => !todo.done);
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

  // Returns a copy of the list of todos in the indicated todo list by sorted by
  // completion status and title (case-insensitive).
  sortedTodos(todoList) {
    // let todos = todoList.todos;
    // let undone = todos.filter(todo => !todo.done);
    // let done = todos.filter(todo => todo.done);
    // return deepCopy(sortTodos(undone, done));
  }

    // Toggle a todo between the done and not done state. Returns `true` on
  // success, `false` if the todo or todo list doesn't exist. The id arguments
  // must both be numeric.
  toggleDoneTodo(todoListId, todoId) {
    // let todo = this._findTodo(todoListId, todoId);
    // if (!todo) return false;

    // todo.done = !todo.done;
    // return true;
  }

  // Returns a reference to the todo list with the indicated ID. Returns
  // `undefined`. if not found. Note that `todoListId` must be numeric.
  _findTodoList(todoListId) {
    // return this._todoLists.find(todoList => todoList.id === todoListId);
  }

  // Returns a reference to the indicated todo in the indicated todo list.
  // Returns `undefined` if either the todo list or the todo is not found. Note
  // that both IDs must be numeric.
  _findTodo(todoListId, todoId) {
    // let todoList = this._findTodoList(todoListId);
    // if (!todoList) return undefined;

    // return todoList.todos.find(todo => todo.id === todoId);
  }

  // Delete the specified todo from the specified todo list. Returns `true` on
  // success, `false` if the todo or todo list doesn't exist. The id arguments
  // must both be numeric.
  deleteTodo(todoListId, todoId) {
    // let todoList = this._findTodoList(todoListId);
    // if (!todoList) return false;

    // let todoIndex = todoList.todos.findIndex(todo => todo.id === todoId);
    // if (todoIndex === -1) return false;

    // todoList.todos.splice(todoIndex, 1);
    // return true;
  }

  // Mark all todos on the todo list as done. Returns `true` on success,
  // `false` if the todo list doesn't exist. The todo list ID must be numeric.
  completeAllTodos(todoListId) {
    // let todoList = this._findTodoList(todoListId);
    // if (!todoList) return false;

    // todoList.todos.forEach(todo => {
      // if (!todo.done) todo.done = true;
    // });

    // return true;
  }

  // Create a new todo with the specified title and add it to the indicated todo
  // list. Returns `true` on success, `false` on failure.
  createTodo(todoListId, title) {
    // let todoList = this._findTodoList(todoListId);
    // if (!todoList) return false;

    // todoList.todos.push({
      // title,
      // id: nextId(),
      // done: false,
    // });

    // todoList.todos.forEach(todo => console.log(todo.id, todo));

    // return true;
  }

  // Create a new todo list with the specified title and add it to the list of
  // todo lists. Returns `true` on success, `false` on failure. (At this time,
  // there are no known failure conditions.)
  createTodoList(title) {
    // this._todoLists.push({
      // title,
      // id: nextId(),
      // todos: [],
    // });

    // return true;
  }

  // Delete a todo list from the list of todo lists. Returns `true` on success,
  // `false` if the todo list doesn't exist. The ID argument must be numeric.
  deleteTodoList(todoListId) {
    // let todoListIndex = this._todoLists.findIndex(todoList => {
      // return todoList.id === todoListId;
    // });

    // if (todoListIndex === -1) return false;

    // this._todoLists.splice(todoListIndex, 1);
    // return true;
  }

  // Set a new title for the specified todo list. Returns `true` on success,
  // `false` if the todo list isn't found. The todo list ID must be numeric.
  setTodoListTitle(todoListId, title) {
    // let todoList = this._findTodoList(todoListId);
    // if (!todoList) return false;

    // todoList.title = title;
    // return true;
  }

  // Returns `true` if a todo list with the specified title exists in the list
  // of todo lists, `false` otherwise.
  existsTodoListTitle(title) {
    // return this._todoLists.some(todoList => todoList.title === title);
  }
};
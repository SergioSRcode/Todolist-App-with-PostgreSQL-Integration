const { dbQuery } = require("./db-query");

class PgPersistence {
  constructor(session) {
    this._todoLists = session.todoLists;
    session.todoLists = this._todoLists;
  }
  
  // Returns a copy of the todo list with the indicated ID. Returns `undefined`
  // if not found. Note that `todoListId` must be numeric.
  loadTodoList(todoListId) {
    // return deepCopy(this._findTodoList(todoListId));
  }

  // Find a todo with the indicated ID in the indicated todo list. Returns
  // `undefined` if not found. Note that both `todoListId` and `todoId` must be
  // numeric.
  loadTodo(todoListId, todoId) {
    // return deepCopy(this._findTodo(todoListId, todoId));
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

  sortedTodos(todoList) {
    // let undone = todoList.todos.filter(todo => !todo.done);
    // let done = todoList.todos.filter(todo => todo.done);
    // return deepCopy(sortTodos(undone, done));
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

  toggleTodo(todoListId, todoId) {
    // let originalTodo = this._findTodo(todoListId, todoId);

    // originalTodo.done = !originalTodo.done;
  }

  deleteTodo(todoListId, todoId) {
    // let originalTodoList = this._findTodoList(todoListId);
    // let originalTodo = this._findTodo(todoListId, todoId);
    // let idxOfTodo = originalTodoList.todos.indexOf(originalTodo);

    // originalTodoList.todos.splice(idxOfTodo, 1)
  }

  _isValid(todoListId, todoId) {
    // let todoList = this.loadTodoList(todoListId);
    // if (!todoList) return false

    // let todo = this.loadTodo(todoListId, todoId);
    // if (!todo) return false

    // return true;
  }

  _isValidTodoList(todoListId) {
    // let todoList = this.loadTodoList(todoListId);
    // if (!todoList) return false

    // return true;
  }

  completeAllTodos(todoListId) {
    // let originalTodoList = this._findTodoList(todoListId);
    // originalTodoList.todos.forEach(todo => todo.done = true);
  }

  addTodo(todoListId, title) {
    // let originalTodoList = this._findTodoList(todoListId);
    // let newTodo = {
      // id: nextId(),
      // title,
      // done: false,
    // }

    // originalTodoList.todos.push(newTodo);
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
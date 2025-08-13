const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const PgPersistence = require("./lib/pg-persistence");
const store = require("connect-loki");
const catchError = require("./lib/catch-error");

const app = express();
const host = "localhost";
const port = 3000;
const LokiStore = store(session);

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in millseconds
    path: "/",
    secure: false,
  },
  name: "launch-school-todos-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
  store: new LokiStore({}),
}));
app.use(flash());
// Create a new datastore
app.use((req, res, next) => {
  res.locals.store = new PgPersistence(req.session);
  next();
});
// Extract session info
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// Redirect start page
app.get("/", (req, res) => {
  res.redirect("/lists");
});

// Render the list of todo lists
app.get("/lists", 
  catchError(async (req, res) => {
    let todoLists = await res.locals.store.sortedTodoLists();
    let todosInfo = todoLists.map(todoList => ({
      countAllTodos: todoList.todos.length,
      countDoneTodos: todoList.todos.filter(todo => todo.done).length,
      isDone: res.locals.store.isDoneTodoList(todoList),
    }));

    res.render("lists", {
      todoLists,
      todosInfo,
    });
  })
);

// Render new todo list page
app.get("/lists/new", (req, res) => {
  res.render("new-list");
});

// Create a new todo list
app.post("/lists",
  [
    body("todoListTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The list title is required.")
      .isLength({ max: 100 })
      .withMessage("List title must be between 1 and 100 characters.")
  ],
  catchError(async (req, res) => {
    let todoListTitle = req.body.todoListTitle;
    try {
      let errors = validationResult(req);
      let isDuplicateListTitle = await res.locals.store.existsTodoListTitle(todoListTitle);

      // eliminates duplicate todolist titles
      if (isDuplicateListTitle) {
        errors.errors.push({ 
          value: '',
          msg: 'The list title must be unique.',
          param: 'todoListTitle',
          location: 'body'
        });
      }

      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));
        res.render("new-list", {
          flash: req.flash(),
          todoListTitle,
        });
      } else {
        await res.locals.store.addTodoList(todoListTitle);
        req.flash("success", "The todo list has been created.");
        res.redirect("/lists");
      }
    } catch (error) {
      if (res.locals.store.isUniqueConstraintViolation(error)) {
        req.flash("error", "The list title must be unique.");
        res.render("new-list", {
        flash: req.flash(),
        todoListTitle,
        });
      }
    }
  })
);

// Render specified todolist page
app.get("/lists/:todoListId", 
  catchError(async (req, res) => {
    let todoListId = req.params.todoListId;
    let todoList = await res.locals.store.loadTodoList(+todoListId);
    if (todoList === undefined) throw new Error("Not found.");
    
    todoList.todos = await res.locals.store.sortedTodos(todoList);
    
    res.render("list", {
      todoList,
      todos: todoList.todos,
      todoListIsDone: res.locals.store.isDoneTodoList(todoList),
      hasUndoneTodos: res.locals.store.hasUndoneTodos(todoList),
    });
  })
);

// Toggle completion status of a todo
app.post("/lists/:todoListId/todos/:todoId/toggle", 
  catchError(async (req, res) => {
    let { todoListId, todoId } = { ...req.params };
    await res.locals.store.toggleTodo(+todoListId, +todoId);  // toggles todo.done
    let todo = await res.locals.store.loadTodo(+todoListId, +todoId); // retrieves updated todo
    if (!todo) throw new Error("Not found.");
    
    let title = todo.title;
    if (!todo.done) {
      req.flash("success", `"${title}" marked as NOT done!`);
    } else {
      req.flash("success", `"${title}" marked done.`);
    }

    res.redirect(`/lists/${todoListId}`);
  })
);

// Delete a todo
app.post("/lists/:todoListId/todos/:todoId/destroy", 
  catchError(async (req, res) => {
    let { todoListId, todoId } = { ...req.params };
    let validListAndTodo = await res.locals.store._isValid(+todoListId, +todoId);
    if (!validListAndTodo) throw new Error("Not found.");
    
    await res.locals.store.deleteTodo(+todoListId, +todoId);
    req.flash("success", "The todo has been deleted.");
    res.redirect(`/lists/${todoListId}`);
  })
);

// Mark all todos as done
app.post("/lists/:todoListId/complete_all", 
  catchError(async (req, res) => {
    let todoListId = req.params.todoListId;
    let isValidTodoList = await res.locals.store._isValidTodoList(+todoListId);
    if (!isValidTodoList) throw new Error("Not found.");

    await res.locals.store.completeAllTodos(+todoListId);
    req.flash("success", "All todos have been marked as done.");
    res.redirect(`/lists/${todoListId}`);
  })
);

// Create a new todo and add it to the specified list
app.post("/lists/:todoListId/todos",
  [
    body("todoTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The todo title is required.")
      .isLength({ max: 100 })
      .withMessage("Todo title must be between 1 and 100 characters."),
  ],
  catchError(async (req, res) => {
    let todoListId = req.params.todoListId;
    let todoList = await res.locals.store.loadTodoList(+todoListId);
    if (!todoList) throw new Error("Not found.");

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));

      res.render("list", {
        flash: req.flash(),
        todoList: todoList,
        todos: await res.locals.store.sortedTodos(todoList),
        todoTitle: req.body.todoTitle,
      });
    } else {
      let isValidTodoList = await res.locals.store._isValidTodoList(+todoListId);
      if (!isValidTodoList) throw new Error("Not found.");
      console.log("correct");

      await res.locals.store.addTodo(+todoListId, req.body.todoTitle);
      req.flash("success", "The todo has been created.");
      res.redirect(`/lists/${todoListId}`);
    }
  })
);

// Render edit todo list form
app.get("/lists/:todoListId/edit", 
  catchError(async (req, res) => {
    let todoListId = req.params.todoListId;
    let todoList = await res.locals.store.loadTodoList(+todoListId);
    if (!todoList) throw new Error("Not found.");
    
    res.render("edit-list", { todoList });
  })
);

// Delete todo list
app.post("/lists/:todoListId/destroy", 
  catchError(async (req, res) => {
    let todoListId = +req.params.todoListId;
    let isValidTodoList = await res.locals.store._isValidTodoList(+todoListId);
    if (!isValidTodoList) throw new Error("Not found.");

    await res.locals.store.deleteTodoList(+todoListId);
    req.flash("success", "Todo list deleted.");
    res.redirect("/lists");
  })
);

// Edit todo list title
app.post("/lists/:todoListId/edit",
  [
    body("todoListTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The list title is required.")
      .isLength({ max: 100 })
      .withMessage("List title must be between 1 and 100 characters.")
  ],
  catchError(async (req, res) => {
    let todoListId = req.params.todoListId;
    let todoList = await res.locals.store.loadTodoList(+todoListId);
    if (!todoList) throw new Error("Not found.");

    let newTodoListTitle = req.body.todoListTitle;
    // try/catch block handles race conditions
    try {
      let errors = validationResult(req);
      // eliminates duplicate todolist titles
      if (await res.locals.store.existsTodoListTitle(newTodoListTitle)) {
        errors.errors.push({ 
          value: '',
          msg: 'The list title must be unique.',
          param: 'todoListTitle',
          location: 'body'
        });
      }
      
      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));
        res.render("edit-list", {
          flash: req.flash(),
          todoListTitle: newTodoListTitle,
          todoList,
        });
      } else {
        let isValidTodoList = await res.locals.store._isValidTodoList(+todoListId);
        if (!isValidTodoList) throw new Error("Not found.");
        
        await res.locals.store.renameTodoList(+todoListId, newTodoListTitle);
        req.flash("success", "Todo list updated.");
        res.redirect(`/lists/${todoListId}`);
      }
    } catch (error) {
      if (res.locals.store.isUniqueConstraintViolation(error)) {
        req.flash("error", "The list title must be unique.");
        res.render("edit-list", {
        flash: req.flash(),
        todoListTitle: newTodoListTitle,
        todoList,
        });
      }
    }
  })
);

// Error handler
app.use((err, req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send(err.message);
});

// Listener
app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
});

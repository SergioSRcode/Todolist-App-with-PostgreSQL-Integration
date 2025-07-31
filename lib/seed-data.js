const nextId = require("./next-id");

let todoList1 = {
  id: nextId(),
  title: "Work Todos",
  todos: [
    {
      id: nextId(),
      title: "Get coffee",
      done: true,
    },
    {
      id: nextId(),
      title: "Chat with co-workers",
      done: true,
    },
    {
      id: nextId(),
      title: "Duck out of meeting",
      done: false,
    },
  ],
};

let todoList2 = {
  id: nextId(),
  title: "Home Todos",
  todos: [
    {
      id: nextId(),
      title: "Feed the cats",
      done: true,
    },
    {
      id: nextId(),
      title: "Go to bed",
      done: true,
    },
    {
      id: nextId(),
      title: "Buy milk",
      done: true,
    },
    {
      id: nextId(),
      title: "study for Launch School",
      done: true,
    },
  ],
};

let todoList3 = {
  id: nextId(),
  title: "Additional Todos",
  todos: [],
};

let todoList4 = {
  id: nextId(),
  title: "social todos",
  todos: [
    {
      id: nextId(),
      title: "Go to Libby's birthday party",
      done: false,
    },
  ],
};

let todoLists = [
  todoList1,
  todoList2,
  todoList3,
  todoList4,
];

module.exports = todoLists;

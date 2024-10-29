// src/Home.js
import { useContext, useEffect, useState } from "react";
import UserContext from "./UserContext";
import axios from "axios";

function Home() {
  const userInfo = useContext(UserContext);
  const [inputVal, setInputVal] = useState('');
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:4000/todos', { withCredentials: true })
      .then(response => {
        setTodos(response.data);
      })
      .catch(error => console.error("Error fetching todos:", error));
  }, []);

  if (!userInfo.email) {
    return <p>You need to be logged in to see this page.</p>;
  }

  function addTodo(e) {
    e.preventDefault();
    if (!inputVal.trim()) return; // Prevent empty to-do submissions

    axios.put('http://localhost:4000/todos', { text: inputVal }, { withCredentials: true })
      .then(response => {
        setTodos([...todos, response.data]);
        setInputVal('');
      })
      .catch(error => console.error("Error adding todo:", error));
  }

  function updateTodo(todo) {
    const data = { id: todo._id, done: !todo.done };
    axios.post('http://localhost:4000/todos', data, { withCredentials: true })
      .then(() => {
        const newTodos = todos.map(t => (t._id === todo._id ? { ...t, done: !t.done } : t));
        setTodos(newTodos);
      })
      .catch(error => console.error("Error updating todo:", error));
  }

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
      <h2>Welcome, {userInfo.email}!</h2>
      <form onSubmit={addTodo} style={{ marginBottom: "20px" }}>
        <input
          placeholder="What do you want to do?"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          style={{ padding: "10px", width: "80%", marginRight: "10px" }}
        />
        <button type="submit" style={{ padding: "10px" }}>Add</button>
      </form>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {todos.map(todo => (
          <li key={todo._id} style={{ marginBottom: "10px", display: "flex", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => updateTodo(todo)}
              style={{ marginRight: "10px" }}
            />
            <span style={{ textDecoration: todo.done ? "line-through" : "none" }}>
              {todo.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;
